import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import CostComparisonTrainer from '../CostComparisonTrainer';
const amounts = ['9120','9760','640'];
function fillComparison() {
 const form=screen.getByRole('region',{name:'1. Kosten nach 36 Monaten'});
 within(form).getAllByRole('textbox').forEach((input,i)=>fireEvent.change(input,{target:{value:amounts[i]}}));
 fireEvent.change(within(form).getByRole('combobox'),{target:{value:'own'}});
}
function fillCrossover() {
 const form=screen.getByRole('region',{name:'2. Erster günstigerer Monat'});
 within(form).getAllByRole('textbox').forEach((input,i)=>fireEvent.change(input,{target:{value:['32','8520','8460','8640','8720'][i]}}));
}
it('records two completed checks only once and new run resets all state',()=>{
 const attempt=vi.fn();render(<CostComparisonTrainer isAuthenticated onAttempt={attempt}/>);
 fillComparison();fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
 fillCrossover();fireEvent.click(screen.getByRole('button',{name:'Monatsgrenze prüfen'}));expect(attempt).toHaveBeenCalledTimes(2);expect(attempt).toHaveBeenLastCalledWith(true);
 fireEvent.change(screen.getByLabelText('Empfehlung und Grenzen'),{target:{value:'Vertrag prüfen'}});
 fireEvent.click(within(screen.getByRole('group',{name:'Selbstbewertung'})).getAllByRole('checkbox')[0]);
 fireEvent.click(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'}));expect(attempt).toHaveBeenCalledTimes(2);
 fireEvent.click(screen.getByRole('button',{name:'Neuer Durchlauf'}));
 expect(screen.getAllByRole('textbox').every(e=>(e as HTMLInputElement).value==='')).toBe(true);
 expect(screen.getByRole('combobox')).toHaveValue('');
 expect(screen.getAllByRole('checkbox').every(e=>!(e as HTMLInputElement).checked)).toBe(true);
 expect(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'})).toHaveAttribute('aria-expanded','false');
 fillComparison();fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));expect(attempt).toHaveBeenCalledTimes(3);
});
it('counts blank submission once, associates errors and clears stale section feedback on edits',()=>{
 const attempt=vi.fn();render(<CostComparisonTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
 const field=screen.getByLabelText('Eigener Server nach 36 Monaten (€)');expect(field).toHaveAttribute('aria-invalid','true');
 expect(document.getElementById(field.getAttribute('aria-describedby')!)).toHaveTextContent('Eurobetrag');
 fillComparison();expect(field).toHaveAttribute('aria-invalid','false');
 expect(screen.getAllByRole('status')[0]).toHaveTextContent('Noch keine aktuelle Prüfung');
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));expect(screen.getAllByRole('status')[0]).toHaveTextContent('Korrekt');expect(attempt).toHaveBeenCalledTimes(1);
});
it('revealing then hiding a section stays unscored while the other can score',()=>{
 const attempt=vi.fn();render(<CostComparisonTrainer isAuthenticated onAttempt={attempt}/>);
 const reveal=screen.getByRole('button',{name:'Monatsgrenze: Lösung anzeigen'});fireEvent.click(reveal);
 expect(reveal).toHaveAttribute('aria-expanded','true');expect(document.getElementById(reveal.getAttribute('aria-controls')!)).toHaveTextContent('32');
 fireEvent.click(screen.getByRole('button',{name:'Monatsgrenze: Lösung verbergen'}));fillCrossover();
 fireEvent.click(screen.getByRole('button',{name:'Monatsgrenze prüfen'}));expect(attempt).not.toHaveBeenCalled();
 fillComparison();fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
});
it('completed guest checks never score, identity remount resets dirty inputs, reveals and rubric',()=>{
 const attempt=vi.fn();const r=render(<CostComparisonTrainer key="guest" isAuthenticated={false} onAttempt={attempt}/>);
 fillComparison();fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));expect(screen.getAllByRole('status')[0]).toHaveTextContent('Korrekt');expect(attempt).not.toHaveBeenCalled();
 fillCrossover();fireEvent.click(screen.getByRole('button',{name:'Monatsgrenze: Lösung anzeigen'}));
 fireEvent.change(screen.getByLabelText('Empfehlung und Grenzen'),{target:{value:'Sitzung'}});
 fireEvent.click(screen.getAllByRole('checkbox')[0]);
 expect(screen.getByText(/Beim Anmelden oder Wechseln/)).toBeInTheDocument();
 r.rerender(<CostComparisonTrainer key="account" isAuthenticated onAttempt={attempt}/>);
 expect(screen.getAllByRole('textbox').every(e=>(e as HTMLInputElement).value==='')).toBe(true);
 expect(screen.getAllByRole('checkbox').every(e=>!(e as HTMLInputElement).checked)).toBe(true);
 expect(screen.getAllByRole('status').every(e=>e.textContent?.includes('Noch keine aktuelle Prüfung'))).toBe(true);
 expect(screen.getByRole('button',{name:'Monatsgrenze: Lösung anzeigen'})).toHaveAttribute('aria-expanded','false');
 fillCrossover();fireEvent.click(screen.getByRole('button',{name:'Monatsgrenze prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
});

it('reasoning example reveals no graded result and leaves objective checks eligible',()=>{
 const attempt=vi.fn();render(<CostComparisonTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'}));
 const example=document.getElementById('cost-reasoning-example')!;
 expect(example).not.toHaveTextContent(/640|spart der eigene Server|zugunsten des eigenen Servers/);
 expect(attempt).not.toHaveBeenCalled();
 fillComparison();fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
});
it('names each status announcement for wrong, edited and correct answers',()=>{
 render(<CostComparisonTrainer isAuthenticated={false} onAttempt={vi.fn()}/>);
 const comparison=screen.getByRole('region',{name:'1. Kosten nach 36 Monaten'});
 const crossover=screen.getByRole('region',{name:'2. Erster günstigerer Monat'});
 fireEvent.click(within(comparison).getByRole('button',{name:'Kostenvergleich prüfen'}));
 expect(within(comparison).getByRole('status')).toHaveTextContent('Kostenvergleich: Bitte die markierten Eingaben prüfen.');
 fireEvent.click(within(crossover).getByRole('button',{name:'Monatsgrenze prüfen'}));
 expect(within(crossover).getByRole('status')).toHaveTextContent('Monatsgrenze: Bitte die markierten Eingaben prüfen.');
 fillComparison();expect(within(comparison).getByRole('status')).toHaveTextContent('Kostenvergleich: Noch keine aktuelle Prüfung.');
 fireEvent.click(within(comparison).getByRole('button',{name:'Kostenvergleich prüfen'}));
 fillCrossover();fireEvent.click(within(crossover).getByRole('button',{name:'Monatsgrenze prüfen'}));
 expect(within(comparison).getByRole('status')).toHaveTextContent('Kostenvergleich: Korrekt');
 expect(within(crossover).getByRole('status')).toHaveTextContent('Monatsgrenze: Korrekt');
});
it('a populated wrong first submission consumes the attempt even after correction or later reveal',()=>{
 const attempt=vi.fn();render(<CostComparisonTrainer isAuthenticated onAttempt={attempt}/>);
 fillComparison();fireEvent.change(screen.getByLabelText('Absoluter Kostenunterschied nach 36 Monaten (€)'),{target:{value:'641'}});
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
 fillComparison();fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich: Lösung anzeigen'}));
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
});
