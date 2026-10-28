import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import BackupRecoveryTrainer from '../BackupRecoveryTrainer';
function fillTimeline(){
 fireEvent.change(screen.getByLabelText('Mögliches Datenverlustfenster (Minuten)'),{target:{value:'20'}});
 fireEvent.change(screen.getByLabelText('Ausfalldauer (Minuten)'),{target:{value:'70'}});
 for(const label of ['RPO-Ziel','RTO-Ziel']) fireEvent.change(screen.getByLabelText(label,{exact:true}),{target:{value:'met'}});
}
function fillChain(value='F2,I4'){fireEvent.change(screen.getByLabelText('Sicherungskette'),{target:{value}});}
it('scores each section once including a wrong first check, and edits clear accessible feedback',()=>{
 const attempt=vi.fn();render(<BackupRecoveryTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Zeitziele prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
 const input=screen.getByLabelText('Mögliches Datenverlustfenster (Minuten)');expect(input).toHaveAttribute('aria-invalid','true');
 expect(document.getElementById(input.getAttribute('aria-describedby')!)).toHaveTextContent('Minuten');
 fillTimeline();expect(input).toHaveAttribute('aria-invalid','false');
 expect(screen.getAllByRole('status')[0]).toHaveTextContent('Zeitziele: Noch keine aktuelle Prüfung.');
 fireEvent.click(screen.getByRole('button',{name:'Zeitziele prüfen'}));expect(attempt).toHaveBeenCalledTimes(1);
 expect(screen.getAllByRole('status')[0]).toHaveTextContent('Zeitziele: Korrekt');
 fillChain();fireEvent.click(screen.getByRole('button',{name:'Sicherungskette prüfen'}));fireEvent.click(screen.getByRole('button',{name:'Sicherungskette prüfen'}));
 expect(attempt).toHaveBeenCalledTimes(2);expect(attempt).toHaveBeenLastCalledWith(true);
 fillChain('F1,I2');expect(screen.getAllByRole('status')[1]).toHaveTextContent('Sicherungskette: Noch keine aktuelle Prüfung.');
 fireEvent.click(screen.getByRole('button',{name:'Sicherungskette prüfen'}));const chain=screen.getByLabelText('Sicherungskette');
 expect(document.getElementById(chain.getAttribute('aria-describedby')!)).toHaveTextContent('I1');expect(attempt).toHaveBeenCalledTimes(2);
});
it('reveal/hide stays unscored only for that section; both displayed alternatives are usable',()=>{
 const attempt=vi.fn();render(<BackupRecoveryTrainer isAuthenticated onAttempt={attempt}/>);
 const reveal=screen.getByRole('button',{name:'Sicherungskette: Lösung anzeigen'});fireEvent.click(reveal);
 expect(reveal).toHaveAttribute('aria-expanded','true');
 const panel=document.getElementById(reveal.getAttribute('aria-controls')!)!;expect(panel).toHaveTextContent('F1,I1,I2');expect(panel).toHaveTextContent('F2,I4');
 fireEvent.click(screen.getByRole('button',{name:'Sicherungskette: Lösung verbergen'}));fillChain();fireEvent.click(screen.getByRole('button',{name:'Sicherungskette prüfen'}));expect(attempt).not.toHaveBeenCalled();
 fillTimeline();fireEvent.click(screen.getByRole('button',{name:'Zeitziele prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
 fireEvent.click(screen.getByRole('button',{name:'Zeitziele: Lösung anzeigen'}));fireEvent.click(screen.getByRole('button',{name:'Zeitziele prüfen'}));expect(attempt).toHaveBeenCalledTimes(1);
});
it('new run resets completed/revealed drafts and rubric; generic reasoning never scores or leaks results',()=>{
 const attempt=vi.fn();render(<BackupRecoveryTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'}));
 const panel=document.getElementById('recovery-reasoning-example')!;expect(panel).not.toHaveTextContent(/\d|RPO.*erfüllt|RTO.*erfüllt/);
 fireEvent.change(screen.getByLabelText('Prüfung und Freigabe'),{target:{value:'Integrität prüfen'}});
 fireEvent.click(screen.getAllByRole('checkbox')[0]);expect(attempt).not.toHaveBeenCalled();
 fillTimeline();fireEvent.click(screen.getByRole('button',{name:'Zeitziele prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
 fireEvent.click(screen.getByRole('button',{name:'Sicherungskette: Lösung anzeigen'}));fillChain();
 fireEvent.click(screen.getByRole('button',{name:'Neuer Durchlauf'}));
 expect(screen.getAllByRole('textbox').every(e=>(e as HTMLInputElement).value==='')).toBe(true);
 expect(screen.getAllByRole('combobox').every(e=>(e as HTMLSelectElement).value==='')).toBe(true);
 expect(screen.getAllByRole('checkbox').every(e=>!(e as HTMLInputElement).checked)).toBe(true);
 expect(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'})).toHaveAttribute('aria-expanded','false');
 expect(screen.getByRole('button',{name:'Sicherungskette: Lösung anzeigen'})).toHaveAttribute('aria-expanded','false');
 fillChain('F1,I1,I2');fireEvent.click(screen.getByRole('button',{name:'Sicherungskette prüfen'}));expect(attempt).toHaveBeenCalledTimes(2);expect(attempt).toHaveBeenLastCalledWith(true);
});
it('completed guest checks stay unscored and identity remount clears all session state',()=>{
 const attempt=vi.fn();const r=render(<BackupRecoveryTrainer key="guest" isAuthenticated={false} onAttempt={attempt}/>);
 fillTimeline();fillChain();for(const name of ['Zeitziele prüfen','Sicherungskette prüfen']) fireEvent.click(screen.getByRole('button',{name}));
 expect(screen.getAllByRole('status').every(e=>e.textContent?.includes('Korrekt'))).toBe(true);expect(attempt).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Zeitziele: Lösung anzeigen'}));fireEvent.click(screen.getAllByRole('checkbox')[0]);
 fireEvent.change(screen.getByLabelText('Prüfung und Freigabe'),{target:{value:'Entwurf'}});
 expect(screen.getByText(/Beim Anmelden oder Wechseln/)).toBeInTheDocument();
 r.rerender(<BackupRecoveryTrainer key="account" isAuthenticated onAttempt={attempt}/>);
 expect(screen.getAllByRole('textbox').every(e=>(e as HTMLInputElement).value==='')).toBe(true);
 expect(screen.getAllByRole('checkbox').every(e=>!(e as HTMLInputElement).checked)).toBe(true);
 expect(screen.getByRole('button',{name:'Zeitziele: Lösung anzeigen'})).toHaveAttribute('aria-expanded','false');
 fillTimeline();fireEvent.click(screen.getByRole('button',{name:'Zeitziele prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
 expect(within(screen.getByRole('region',{name:'1. Wiederherstellungsziele prüfen'})).getByRole('status')).toHaveTextContent('Zeitziele: Korrekt');
});
