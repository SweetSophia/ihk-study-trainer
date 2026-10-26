import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import AlgorithmTracingTrainer from '../AlgorithmTracingTrainer';
function correctBoundary(){fireEvent.change(screen.getByLabelText('Korrigierter Vergleich'),{target:{value:'<='}});fireEvent.change(screen.getByLabelText('Entscheidender Testfall'),{target:{value:'equal-active'}});}
it('limits scoring independently, clears stale accessible feedback and resets a run',()=>{
 const attempt=vi.fn();render(<AlgorithmTracingTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Ablauf prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
 const input=screen.getByLabelText('A: geprüft');expect(input).toHaveAttribute('aria-invalid','true');expect(document.getElementById(input.getAttribute('aria-describedby')!)).toHaveTextContent('ganze Zahl');
 fireEvent.change(input,{target:{value:'1'}});expect(input).toHaveAttribute('aria-invalid','false');fireEvent.click(screen.getByRole('button',{name:'Ablauf prüfen'}));expect(attempt).toHaveBeenCalledTimes(1);
 correctBoundary();fireEvent.click(screen.getByRole('button',{name:'Grenzfall prüfen'}));expect(attempt).toHaveBeenLastCalledWith(true);fireEvent.click(screen.getByRole('button',{name:'Grenzfall prüfen'}));expect(attempt).toHaveBeenCalledTimes(2);
 fireEvent.click(screen.getByRole('button',{name:'Neuer Durchlauf'}));expect(input).toHaveValue('');expect(screen.getByLabelText('Korrigierter Vergleich')).toHaveValue('');fireEvent.click(screen.getByRole('button',{name:'Ablauf prüfen'}));expect(attempt).toHaveBeenCalledTimes(3);
});
it('keeps revealed section unscored after hiding without suppressing other section',()=>{
 const attempt=vi.fn();render(<AlgorithmTracingTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Grenzfall: Lösung anzeigen'}));const hide=screen.getByRole('button',{name:'Grenzfall: Lösung verbergen'});expect(hide).toHaveAttribute('aria-expanded','true');expect(document.getElementById(hide.getAttribute('aria-controls')!)).toBeTruthy();fireEvent.click(hide);
 correctBoundary();fireEvent.click(screen.getByRole('button',{name:'Grenzfall prüfen'}));expect(attempt).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Ablauf prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
});
it('guests and self-assessment never score; identity remount clears every part',()=>{
 const attempt=vi.fn();const r=render(<AlgorithmTracingTrainer key="guest" isAuthenticated={false} onAttempt={attempt}/>);expect(screen.getByText(/Beim Anmelden/)).toBeInTheDocument();
 correctBoundary();fireEvent.click(screen.getByRole('button',{name:'Grenzfall prüfen'}));expect(screen.getByText('Grenzfall: Korrekt.')).toBeInTheDocument();fireEvent.change(screen.getByLabelText('Sichere betriebliche Reaktion'),{target:{value:'prüfen'}});fireEvent.click(screen.getByLabelText(/Ich begründe die Wartungsausnahme/));fireEvent.click(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'}));expect(attempt).not.toHaveBeenCalled();
 r.rerender(<AlgorithmTracingTrainer key="account" isAuthenticated onAttempt={attempt}/>);expect(screen.getByLabelText('Sichere betriebliche Reaktion')).toHaveValue('');expect(screen.getByLabelText('Korrigierter Vergleich')).toHaveValue('');expect(screen.getByLabelText(/Ich begründe die Wartungsausnahme/)).not.toBeChecked();
});
