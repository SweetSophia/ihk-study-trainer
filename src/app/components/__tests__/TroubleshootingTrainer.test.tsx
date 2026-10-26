import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import TroubleshootingTrainer from '../TroubleshootingTrainer';
function correct(){fireEvent.change(screen.getByLabelText('Begründete Korrektur'),{target:{value:'restore-profile'}});fireEvent.change(screen.getByLabelText('Anschließende Verifikation'),{target:{value:'normal-dns-https'}});}
it('limits scoring to first check per section, clears accessible errors and resets',()=>{
 const attempt=vi.fn();render(<TroubleshootingTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Diagnose prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
 const input=screen.getByLabelText('Am besten gestützte Diagnose');expect(input).toHaveAttribute('aria-invalid','true');expect(document.getElementById(input.getAttribute('aria-describedby')!)).toHaveTextContent('Profilvergleich');
 fireEvent.change(input,{target:{value:'local-override'}});expect(input).toHaveAttribute('aria-invalid','false');fireEvent.click(screen.getByRole('button',{name:'Diagnose prüfen'}));expect(attempt).toHaveBeenCalledTimes(1);
 correct();fireEvent.click(screen.getByRole('button',{name:'Maßnahme prüfen'}));expect(attempt).toHaveBeenLastCalledWith(true);fireEvent.click(screen.getByRole('button',{name:'Maßnahme prüfen'}));expect(attempt).toHaveBeenCalledTimes(2);
 fireEvent.click(screen.getByRole('button',{name:'Neuer Durchlauf'}));expect(input).toHaveValue('');fireEvent.click(screen.getByRole('button',{name:'Diagnose prüfen'}));expect(attempt).toHaveBeenCalledTimes(3);
});
it('revealing then hiding a solution makes only that section unscored',()=>{
 const attempt=vi.fn();render(<TroubleshootingTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.click(screen.getByRole('button',{name:'Maßnahme: Lösung anzeigen'}));const hide=screen.getByRole('button',{name:'Maßnahme: Lösung verbergen'});expect(hide).toHaveAttribute('aria-expanded','true');expect(document.getElementById(hide.getAttribute('aria-controls')!)).toBeTruthy();fireEvent.click(hide);
 correct();fireEvent.click(screen.getByRole('button',{name:'Maßnahme prüfen'}));expect(attempt).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Diagnose prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(false);
});
it('completed guest checks and reasoning never score; identity remount resets',()=>{
 const attempt=vi.fn();const r=render(<TroubleshootingTrainer key="guest" isAuthenticated={false} onAttempt={attempt}/>);
 correct();fireEvent.click(screen.getByRole('button',{name:'Maßnahme prüfen'}));expect(screen.getByText('Maßnahme: Korrekt.')).toBeInTheDocument();expect(screen.getByText(/Beim Anmelden/)).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Begründung und Betriebsplan'),{target:{value:'prüfen'}});fireEvent.click(screen.getByLabelText(/Ich trenne Beobachtung/));fireEvent.click(screen.getByRole('button',{name:'Begründungsbeispiel anzeigen'}));expect(attempt).not.toHaveBeenCalled();
 r.rerender(<TroubleshootingTrainer key="account" isAuthenticated onAttempt={attempt}/>);expect(screen.getByLabelText('Begründung und Betriebsplan')).toHaveValue('');expect(screen.getByLabelText('Begründete Korrektur')).toHaveValue('');expect(screen.getByLabelText(/Ich trenne Beobachtung/)).not.toBeChecked();
});
it('shows the full selected choice outside the narrow native select',()=>{
 render(<TroubleshootingTrainer isAuthenticated={false} onAttempt={vi.fn()}/>);
 correct();const select=screen.getByLabelText('Begründete Korrektur');
 const description=document.getElementById(select.getAttribute('aria-describedby')!);
 expect(description).toHaveTextContent('Lokale DNS-Überschreibung entfernen und das freigegebene Clientprofil mit DNS 10.20.30.53 wiederherstellen.');
});
it('records a fully supported diagnosis as correct and clears it after an edit',()=>{
 const attempt=vi.fn();render(<TroubleshootingTrainer isAuthenticated onAttempt={attempt}/>);
 fireEvent.change(screen.getByLabelText('Am besten gestützte Diagnose'),{target:{value:'local-override'}});
 for(const [label,value] of [
  ['Die lokale DNS-Konfiguration weicht vom freigegebenen Profil ab.','supported'],
  ['Der HTTPS-Endpunkt antwortet vom betroffenen Client aus, wenn die Namensauflösung gezielt umgangen wird.','supported'],
  ['Der DNS-Dienst auf .99 ist sicher gestoppt.','unproven'],
  ['Wegen der fehlenden Ping-Antworten ist der Portalserver unerreichbar.','unproven'],
 ]) fireEvent.change(screen.getByLabelText(label),{target:{value}});
 fireEvent.click(screen.getByRole('button',{name:'Diagnose prüfen'}));expect(attempt).toHaveBeenCalledExactlyOnceWith(true);
 fireEvent.change(screen.getByLabelText('Am besten gestützte Diagnose'),{target:{value:'firewall'}});expect(screen.queryByText('Diagnose: Korrekt.')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Diagnose prüfen'}));expect(attempt).toHaveBeenCalledTimes(1);
});
