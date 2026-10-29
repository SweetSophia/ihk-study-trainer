import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import TrainingRun from '../TrainingRun';

const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
function costs() {
 const region = screen.getByRole('region', { name: '1. Kosten nach 36 Monaten' });
 within(region).getAllByRole('textbox').forEach((input, i) => fireEvent.change(input, { target: { value: ['9120','9760','640'][i] } }));
 fireEvent.change(within(region).getByRole('combobox'), { target: { value: 'own' } });
}
it('retains inputs, rubric, disclosure and first-check guards during repeated navigation', async () => {
 const attempt = vi.fn(); render(<TrainingRun isAuthenticated onAttempt={attempt} />);
 costs(); fireEvent.change(screen.getByLabelText('Empfehlung und Grenzen'), { target: { value: 'Verträge prüfen' } });
 fireEvent.click(screen.getAllByRole('checkbox')[0]); click('Begründungsbeispiel anzeigen');
 click('Kostenvergleich prüfen'); expect(attempt).toHaveBeenCalledExactlyOnceWith('ap2CostComparison', true);
 click('2. Fehlersuche'); expect(screen.getByLabelText('Empfehlung und Grenzen')).not.toBeVisible();
 click('1. Wirtschaftlichkeit'); expect(screen.getByLabelText('Empfehlung und Grenzen')).toHaveValue('Verträge prüfen');
 expect(screen.getAllByRole('checkbox')[0]).toBeChecked(); expect(screen.getByRole('button', {name:'Begründungsbeispiel verbergen'})).toHaveAttribute('aria-expanded','true');
 expect(screen.getByLabelText('Eigener Server nach 36 Monaten (€)')).toHaveValue('9120');
 click('Kostenvergleich prüfen'); expect(attempt).toHaveBeenCalledTimes(1);
 click('Auswertung'); expect(screen.getByRole('region', {name:'Kostenvergleich'})).toHaveTextContent('Erste Prüfung: korrekt');
 expect(screen.getByText(/1 von 1 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
 await waitFor(() => expect(screen.getByRole('heading', {name:'Gemeinsame Auswertung'})).toHaveFocus());
});
it('keeps the wrong first result while edits clear current feedback and later corrections cannot rescore', () => {
 const attempt=vi.fn(); render(<TrainingRun isAuthenticated onAttempt={attempt}/>);
 click('Kostenvergleich prüfen'); costs(); click('Auswertung');
 const section=screen.getByRole('region',{name:'Kostenvergleich'});
 expect(section).toHaveTextContent('Erste Prüfung: nicht korrekt'); expect(section).toHaveTextContent('Aktuell: nach Änderung ungeprüft');
 click('Wirtschaftlichkeit weiterüben'); click('Kostenvergleich prüfen'); click('Auswertung');
 expect(screen.getByRole('region',{name:'Kostenvergleich'})).toHaveTextContent('Aktuell: korrekt');
 expect(attempt).toHaveBeenCalledExactlyOnceWith('ap2CostComparison',false);
});
it('remembers reveal-before-check through hiding and navigation without losing the other section eligibility', () => {
 const attempt=vi.fn(); render(<TrainingRun isAuthenticated onAttempt={attempt}/>);
 click('Kostenvergleich: Lösung anzeigen'); click('Kostenvergleich: Lösung verbergen'); click('3. Datensicherung'); click('1. Wirtschaftlichkeit');
 costs(); click('Kostenvergleich prüfen'); click('Monatsgrenze prüfen'); click('Auswertung');
 expect(screen.getByRole('region',{name:'Kostenvergleich'})).toHaveTextContent('Ungewertet: Lösung vor der ersten Prüfung');
 expect(attempt).toHaveBeenCalledExactlyOnceWith('ap2CostComparison',false);
 expect(screen.getByText(/0 von 1 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
});
it('reports guest checks locally without writing progress and separates reasoning from objective totals', () => {
 const attempt=vi.fn(); render(<TrainingRun isAuthenticated={false} onAttempt={attempt}/>);
 costs(); click('Kostenvergleich prüfen'); fireEvent.click(screen.getAllByRole('checkbox')[0]);
 click('3. Datensicherung'); fireEvent.change(screen.getByLabelText('Prüfung und Freigabe'),{target:{value:'Integrität prüfen'}});
 click('Zeitziele prüfen'); click('Auswertung');
 expect(screen.getByText(/1 von 2 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
 expect(screen.getByText(/Selbstbewertung.*keine automatische Bewertung/)).toBeInTheDocument();
 expect(attempt).not.toHaveBeenCalled(); expect(screen.getByText(/Als Gast.*nicht gespeichert/)).toBeInTheDocument();
});
it('keeps all six objective checks topic-specific and idempotent after summary visits', () => {
 const attempt=vi.fn();render(<TrainingRun isAuthenticated onAttempt={attempt}/>);
 click('Kostenvergleich prüfen');click('Monatsgrenze prüfen');click('2. Fehlersuche');
 click('Diagnose prüfen');click('Maßnahme prüfen');click('3. Datensicherung');click('Zeitziele prüfen');click('Sicherungskette prüfen');
 click('Auswertung'); expect(screen.getByText(/0 von 6 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
 click('Datensicherung weiterüben');click('Zeitziele prüfen');expect(attempt.mock.calls).toEqual([
 ['ap2CostComparison',false],['ap2CostComparison',false],['ap2Troubleshooting',false],['ap2Troubleshooting',false],['ap2BackupRecovery',false],['ap2BackupRecovery',false]]);
});
it('requires confirmation to discard a run and resets all panels and guards together', () => {
 const attempt=vi.fn();render(<TrainingRun isAuthenticated onAttempt={attempt}/>);
 costs();click('Kostenvergleich prüfen');click('Neuen Trainingslauf starten');click('Weiterarbeiten');
 expect(screen.getByLabelText('Eigener Server nach 36 Monaten (€)')).toHaveValue('9120');
 click('Neuen Trainingslauf starten');click('Trainingslauf verwerfen und neu starten');
 expect(screen.getByLabelText('Eigener Server nach 36 Monaten (€)')).toHaveValue('');
 click('Auswertung');expect(screen.getByText(/0 von 0 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
 click('1. Wirtschaftlichkeit');costs();click('Kostenvergleich prüfen');expect(attempt).toHaveBeenCalledTimes(2);
});
it('identity remount and leaving/re-entering lose session drafts with an explicit warning', () => {
 const attempt=vi.fn();const view=render(<TrainingRun key="guest" isAuthenticated={false} onAttempt={attempt}/>);
 expect(screen.getByText(/Neuladen.*Verlassen.*Anmelden.*Kontowechsel/)).toBeInTheDocument();
 costs();click('Kostenvergleich: Lösung anzeigen');click('Kostenvergleich prüfen');
 view.rerender(<TrainingRun key="account" isAuthenticated onAttempt={attempt}/>);
 expect(screen.getByLabelText('Eigener Server nach 36 Monaten (€)')).toHaveValue('');
 expect(screen.getByRole('button',{name:'Kostenvergleich: Lösung anzeigen'})).toHaveAttribute('aria-expanded','false');
 costs();click('Kostenvergleich prüfen');expect(attempt).toHaveBeenCalledExactlyOnceWith('ap2CostComparison',true);
 view.unmount();render(<TrainingRun isAuthenticated onAttempt={attempt}/>);click('Auswertung');
 expect(screen.getByText(/0 von 0 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
});
it.each([
 ['1. Wirtschaftlichkeit','Kostenvergleich','Kostenvergleich prüfen','Kostenvergleich: Lösung anzeigen'],
 ['2. Fehlersuche','Evidenz und Diagnose','Diagnose prüfen','Diagnose: Lösung anzeigen'],
 ['3. Datensicherung','Wiederherstellungsziele','Zeitziele prüfen','Zeitziele: Lösung anzeigen'],
])('keeps %s reveal eligibility and edited feedback in the combined summary', (navigation, title, check, reveal) => {
 const attempt=vi.fn();render(<TrainingRun isAuthenticated onAttempt={attempt}/>);
 click(navigation);click(reveal);click(check);click('Auswertung');
 expect(screen.getByRole('region',{name:title})).toHaveTextContent('Ungewertet: Lösung vor der ersten Prüfung');
 click(navigation);
 const input=screen.getAllByRole('textbox').find(element=>element.tagName==='INPUT');
 if(input) fireEvent.change(input,{target:{value:'20'}});
 else { const select=screen.getAllByRole('combobox')[0] as HTMLSelectElement;fireEvent.change(select,{target:{value:select.options[1].value}}); }
 click('Auswertung');expect(screen.getByRole('region',{name:title})).toHaveTextContent('Aktuell: nach Änderung ungeprüft');
 expect(attempt).not.toHaveBeenCalled();
});
it('a reveal after the first check never retroactively uncounts that check',()=>{
 const attempt=vi.fn();render(<TrainingRun isAuthenticated onAttempt={attempt}/>);
 costs();click('Kostenvergleich prüfen');click('Kostenvergleich: Lösung anzeigen');click('Auswertung');
 expect(screen.getByText(/1 von 1 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
 expect(screen.getByRole('region',{name:'Kostenvergleich'})).not.toHaveTextContent('Ungewertet');
 expect(attempt).toHaveBeenCalledExactlyOnceWith('ap2CostComparison',true);
});
