import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import AccessControlTrainer from '../AccessControlTrainer';
function matrix() {
 for (const [label,value] of [['Lea · Aufträge','edit'],['Lea · Personalakten','none'],['Tom · Aufträge','read'],['Tom · Personalakten','edit'],['Mira · Aufträge','none'],['Mira · Personalakten','edit']]) fireEvent.change(screen.getByLabelText(label),{target:{value}});
}
function correction() {
 fireEvent.change(screen.getByLabelText('Kleinste zulässige Korrektur'),{target:{value:'remove-personnel'}});
 fireEvent.change(screen.getByLabelText('Geplante Kontrolle'),{target:{value:'all-users-both-folders'}});
}
const click=(name:string)=>fireEvent.click(screen.getByRole('button',{name}));
it('records each completed section once, with correction before matrix also supported',()=>{
 const attempt=vi.fn();render(<AccessControlTrainer isAuthenticated onAttempt={attempt}/>);
 correction();click('Korrektur prüfen');click('Korrektur prüfen');expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
 matrix();click('Zugriffe prüfen');expect(attempt.mock.calls).toEqual([[true],[true]]);
 click('Zugriffe prüfen');expect(attempt).toHaveBeenCalledTimes(2);
});
it('consumes populated wrong first checks and leaves later corrections feedback-only',()=>{
 const attempt=vi.fn();render(<AccessControlTrainer isAuthenticated onAttempt={attempt}/>);
 matrix();fireEvent.change(screen.getByLabelText('Tom · Personalakten'),{target:{value:'none'}});click('Zugriffe prüfen');
 expect(attempt).toHaveBeenCalledExactlyOnceWith(false);matrix();click('Zugriffe prüfen');
 expect(screen.getAllByRole('status')[0]).toHaveTextContent('Zugriffe: Korrekt');expect(attempt).toHaveBeenCalledTimes(1);
});
it('counts blank answers, associates field feedback and clears stale section results on edit',()=>{
 const attempt=vi.fn();render(<AccessControlTrainer isAuthenticated onAttempt={attempt}/>);
 click('Zugriffe prüfen');expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
 const field=screen.getByLabelText('Lea · Aufträge');expect(field).toHaveAttribute('aria-invalid','true');
 expect(document.getElementById(field.getAttribute('aria-describedby')!)).toHaveTextContent('Zugriffsstände');
 fireEvent.change(field,{target:{value:'edit'}});expect(field).toHaveAttribute('aria-invalid','false');
 expect(screen.getAllByRole('status')[0]).toHaveTextContent('Zugriffe: Noch keine aktuelle Prüfung');
 click('Korrektur prüfen');const plan=screen.getByLabelText('Kleinste zulässige Korrektur');expect(plan).toHaveAttribute('aria-invalid','true');
 correction();expect(plan).toHaveAttribute('aria-invalid','false');expect(screen.getAllByRole('status')[1]).toHaveTextContent('Korrektur: Noch keine aktuelle Prüfung');
});
it.each(['Zugriffe','Korrektur'])('revealing and hiding %s before checking leaves only that section unscored',(section)=>{
 const attempt=vi.fn();render(<AccessControlTrainer isAuthenticated onAttempt={attempt}/>);
 const reveal=screen.getByRole('button',{name:`${section}: Lösung anzeigen`});click(`${section}: Lösung anzeigen`);
 expect(reveal).toHaveAttribute('aria-expanded','true');expect(document.getElementById(reveal.getAttribute('aria-controls')!)).toBeInTheDocument();
 click(`${section}: Lösung verbergen`);matrix();correction();click(`${section} prüfen`);expect(attempt).not.toHaveBeenCalled();
 click(`${section==='Zugriffe'?'Korrektur':'Zugriffe'} prüfen`);expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
});
it('keeps generic reasoning and rubric actions unscored without exposing graded choices',()=>{
 const attempt=vi.fn();render(<AccessControlTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.change(screen.getByLabelText('Freigabe, Dokumentation und Rücknahme'),{target:{value:'Genehmigung einholen'}});
 fireEvent.click(within(screen.getByRole('group',{name:'Selbstbewertung'})).getAllByRole('checkbox')[0]);click('Begründungsbeispiel anzeigen');
 const example=document.getElementById('access-reasoning-example')!;
 expect(example).not.toHaveTextContent(/\b(Tom|Lea|Mira|Werkstatt|Disposition|Personal)\b|remove-personnel|all-users-both-folders/);
 expect(attempt).not.toHaveBeenCalled();matrix();click('Zugriffe prüfen');expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
});
it('new run clears both sections, reveal guards and all session-only reasoning',()=>{
 const attempt=vi.fn();render(<AccessControlTrainer isAuthenticated onAttempt={attempt}/>);
 matrix();correction();click('Zugriffe prüfen');click('Korrektur: Lösung anzeigen');click('Korrektur prüfen');
 fireEvent.change(screen.getByLabelText('Freigabe, Dokumentation und Rücknahme'),{target:{value:'Notiz'}});fireEvent.click(screen.getAllByRole('checkbox')[0]);click('Begründungsbeispiel anzeigen');click('Neuer Durchlauf');
 expect(screen.getAllByRole('combobox').every(field=>(field as HTMLSelectElement).value==='')).toBe(true);
 expect(screen.getByRole('textbox')).toHaveValue('');expect(screen.getAllByRole('checkbox').every(field=>!(field as HTMLInputElement).checked)).toBe(true);
 expect(screen.getAllByRole('status').every(field=>field.textContent?.includes('Noch keine aktuelle Prüfung'))).toBe(true);
 expect(screen.getByRole('button',{name:'Korrektur: Lösung anzeigen'})).toHaveAttribute('aria-expanded','false');
 expect(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'})).toHaveAttribute('aria-expanded','false');
 correction();click('Korrektur prüfen');expect(attempt.mock.calls).toEqual([[true],[true]]);
});
it('completed guest answers never score and identity remount resets guest reveals and drafts',()=>{
 const attempt=vi.fn();const view=render(<AccessControlTrainer key="guest" isAuthenticated={false} onAttempt={attempt}/>);
 expect(screen.getByText(/Beim Anmelden oder Kontowechsel/)).toBeInTheDocument();
 matrix();correction();click('Zugriffe prüfen');click('Korrektur prüfen');expect(attempt).not.toHaveBeenCalled();
 click('Zugriffe: Lösung anzeigen');fireEvent.change(screen.getByRole('textbox'),{target:{value:'Gastnotiz'}});fireEvent.click(screen.getAllByRole('checkbox')[0]);
 view.rerender(<AccessControlTrainer key="account" isAuthenticated onAttempt={attempt}/>);
 expect(screen.getAllByRole('combobox').every(field=>(field as HTMLSelectElement).value==='')).toBe(true);
 expect(screen.getByRole('textbox')).toHaveValue('');expect(screen.getAllByRole('checkbox').every(field=>!(field as HTMLInputElement).checked)).toBe(true);
 expect(screen.getByRole('button',{name:'Zugriffe: Lösung anzeigen'})).toHaveAttribute('aria-expanded','false');
 matrix();click('Zugriffe prüfen');expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
});
