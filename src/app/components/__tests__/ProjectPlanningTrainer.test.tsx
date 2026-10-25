import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import ProjectPlanningTrainer from '../ProjectPlanningTrainer';
function changeAnswers(){fireEvent.change(screen.getByLabelText('Änderung: Projektdauer'),{target:{value:'12'}});for(const id of ['A','C','D','E','F']) fireEvent.click(screen.getByLabelText(`Änderung: ${id} kritisch`));}
it('grades both sections once, clears stale errors and resets explicitly',()=>{
 const attempt=vi.fn();render(<ProjectPlanningTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Basisplan prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
 const field=screen.getByLabelText('Basisplan: A FAZ');expect(field).toHaveAttribute('aria-invalid','true');expect(document.getElementById(field.getAttribute('aria-describedby')!)).toHaveTextContent('ganze Zahl');
 fireEvent.change(field,{target:{value:'0'}});expect(field).not.toHaveAttribute('aria-invalid','true');
 fireEvent.click(screen.getByRole('button',{name:'Basisplan prüfen'}));expect(attempt).toHaveBeenCalledTimes(1);
 changeAnswers();fireEvent.click(screen.getByRole('button',{name:'Änderung prüfen'}));expect(attempt).toHaveBeenLastCalledWith(true);expect(attempt).toHaveBeenCalledTimes(2);
 fireEvent.click(screen.getByRole('button',{name:'Änderung prüfen'}));expect(attempt).toHaveBeenCalledTimes(2);
 fireEvent.click(screen.getByRole('button',{name:'Neuer Durchlauf'}));expect(screen.getByLabelText('Änderung: Projektdauer')).toHaveValue('');
 fireEvent.click(screen.getByRole('button',{name:'Basisplan prüfen'}));expect(attempt).toHaveBeenCalledTimes(3);
});
it('solution reveal remains unscored after hiding; reasoning and rubric never score',()=>{
 const attempt=vi.fn();render(<ProjectPlanningTrainer isAuthenticated onAttempt={attempt}/>);
 const reveal=screen.getByRole('button',{name:'Änderung: Lösung anzeigen'});fireEvent.click(reveal);expect(reveal).toHaveAttribute('aria-expanded','true');expect(document.getElementById(reveal.getAttribute('aria-controls')!)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Änderung: Lösung verbergen'}));changeAnswers();fireEvent.click(screen.getByRole('button',{name:'Änderung prüfen'}));
 fireEvent.change(screen.getByLabelText('Abnahme und Umgang mit Fehlern'),{target:{value:'Restore prüfen'}});
 fireEvent.click(within(screen.getByRole('group',{name:'Selbstbewertung'})).getAllByRole('checkbox')[0]);
 fireEvent.click(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'}));expect(attempt).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Basisplan prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
});
it('completed guest checks do not score and identity remount clears session',()=>{
 const attempt=vi.fn();const r=render(<ProjectPlanningTrainer key="guest" isAuthenticated={false} onAttempt={attempt}/>);
 expect(screen.getByText(/Beim Anmelden/)).toBeInTheDocument();changeAnswers();fireEvent.click(screen.getByRole('button',{name:'Änderung prüfen'}));expect(screen.getByText(/Änderung: Korrekt/)).toBeInTheDocument();expect(attempt).not.toHaveBeenCalled();
 r.rerender(<ProjectPlanningTrainer key="account" isAuthenticated onAttempt={attempt}/>);expect(screen.getByLabelText('Änderung: Projektdauer')).toHaveValue('');
});

it('shows the same changed schedule that accepts the answer',()=>{
 const attempt=vi.fn();render(<ProjectPlanningTrainer isAuthenticated onAttempt={attempt}/>);
 expect(screen.getByRole('heading',{name:'2. Änderung: C dauert jetzt 5 Arbeitstage'})).toBeInTheDocument();
 changeAnswers();fireEvent.click(screen.getByRole('button',{name:'Änderung prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
 fireEvent.click(screen.getByRole('button',{name:'Änderung: Lösung anzeigen'}));expect(screen.getByText('Lösung für diese festen Annahmen: 12 Arbeitstage; kritisch: A, C, D, E, F.')).toBeInTheDocument();
});
