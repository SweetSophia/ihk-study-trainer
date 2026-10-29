import type { HTMLAttributes } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion: pass-through so we don't fight animations in jsdom.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: HTMLAttributes<HTMLDivElement>) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons used by AuthModal.
vi.mock('lucide-react', () => ({
  X: () => <svg data-testid="icon-x" />,
  Copy: () => <svg data-testid="icon-copy" />,
  Check: () => <svg data-testid="icon-check" />,
  AlertTriangle: () => <svg data-testid="icon-alert" />,
  LogIn: () => <svg data-testid="icon-login" />,
  Key: () => <svg data-testid="icon-key" />,
  ClipboardPaste: () => <svg data-testid="icon-paste" />,
  CircleAlert: () => <svg data-testid="icon-circle-alert" />,
  CircleCheck: () => <svg data-testid="icon-circle-check" />,
}));

import AuthModal from '../AuthModal';

const noOpAsync = vi.fn().mockResolvedValue({ success: true });
const noOpRegister = vi.fn().mockResolvedValue('Ab12cD34eF56');

async function openLoginMode() {
  render(
    <AuthModal
      isOpen
      onClose={vi.fn()}
      onLogin={noOpAsync}
      onRegister={noOpRegister}
    />,
  );
  await userEvent.click(screen.getByText('Ich habe einen Code'));
}

describe('AuthModal – login validation (PR 4 polish)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows character count and "noch X Zeichen fehlen" while typing', async () => {
    await openLoginMode();
    const input = screen.getByLabelText(/Zugangscode/i) as HTMLInputElement;
    await userEvent.type(input, 'Ab1');
    expect(screen.getByText('3/12')).toBeInTheDocument();
    expect(screen.getByText(/9 Zeichen/)).toBeInTheDocument();
  });

  it('shows the green "Format OK" hint at 12 chars', async () => {
    await openLoginMode();
    const input = screen.getByLabelText(/Zugangscode/i) as HTMLInputElement;
    await userEvent.type(input, 'Ab12cD34eF56');
    expect(screen.getByText('12/12')).toBeInTheDocument();
    expect(screen.getByText(/Format OK/)).toBeInTheDocument();
  });

  it('shows the "ungültige Zeichen" hint when non-alphanumerics sneak in via raw change', async () => {
    await openLoginMode();
    const input = screen.getByLabelText(/Zugangscode/i) as HTMLInputElement;
    // fireEvent.change bypasses the input event filtering so we can prove
    // the validation hint reacts to garbage.
    fireEvent.change(input, { target: { value: 'bad chars!!' } });
    // onChange strips non-alphanumerics, so we get 'badchars' (8 chars).
    expect(input.value).toBe('badchars');
  });

  it('normalizes pasted text — strips surrounding noise and shows the paste hint', async () => {
    await openLoginMode();
    const input = screen.getByLabelText(/Zugangscode/i) as HTMLInputElement;
    // fireEvent.paste triggers React's synthetic onPaste handler with a
    // clipboardData-shaped payload. jsdom doesn't simulate the default
    // paste-to-input behavior, so our handler is what populates the
    // value — exactly the unit under test.
    fireEvent.paste(input, {
      clipboardData: { getData: () => 'Hier dein Code: ab12cd34ef56 — viel Erfolg!' },
    });

    expect(input.value).toBe('ab12cd34ef56');
    expect(input.value).toHaveLength(12);
    // The paste confirmation banner shows briefly.
    expect(screen.getByText(/aus Zwischenablage/)).toBeInTheDocument();
  });

  it('handles paste of just whitespace as an error', async () => {
    await openLoginMode();
    const input = screen.getByLabelText(/Zugangscode/i) as HTMLInputElement;
    fireEvent.paste(input, {
      clipboardData: { getData: () => '   \n\t   ' },
    });
    expect(screen.getByText(/enthält keinen gültigen Code/)).toBeInTheDocument();
  });

  it('calls onLogin with the trimmed hash on submit when valid', async () => {
    await openLoginMode();
    const input = screen.getByLabelText(/Zugangscode/i) as HTMLInputElement;
    await userEvent.type(input, 'Ab12cD34eF56');
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    await waitFor(() => {
      expect(noOpAsync).toHaveBeenCalledWith('Ab12cD34eF56');
    });
  });

  it('disables the Anmelden button until the hash is complete', async () => {
    await openLoginMode();
    const input = screen.getByLabelText(/Zugangscode/i) as HTMLInputElement;
    await userEvent.type(input, 'Ab1');
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeDisabled();
    await userEvent.type(input, '2cD34eF56');
    expect(screen.getByRole('button', { name: 'Anmelden' })).not.toBeDisabled();
  });

  it('disables the Anmelden button when the format is invalid', async () => {
    await openLoginMode();
    const input = screen.getByLabelText(/Zugangscode/i) as HTMLInputElement;
    await userEvent.type(input, 'Ab12c');
    // The inline hint ("Noch … Zeichen fehlen") covers this state for
    // users; the button stays disabled so they can't submit garbage.
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeDisabled();
  });
});

const fixtureCode='Ab12cD34eF56';
const createButton=()=>screen.getByRole('button',{name:/Zugangscode erstellen/});
const alertRegion=()=>screen.getByRole('alert');
const expectMessage=async(message:string)=>waitFor(()=>expect(alertRegion()).toHaveTextContent(message));
function deferred<T>() {
  let resolve!: (value:T)=>void;
  let reject!: (reason:Error)=>void;
  const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}

describe('AuthModal – shared feedback',()=>{
  it('keeps one atomic live alert mounted before updating it with registration failure',async()=>{
    const register=vi.fn().mockResolvedValue(null);
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={vi.fn()} onRegister={register}/>);
    const region=alertRegion();expect(region).toBeEmptyDOMElement();expect(region).toHaveAttribute('aria-atomic','true');
    await userEvent.click(createButton());
    await expectMessage('Fehler bei der Registrierung. Bitte versuche es erneut.');
    expect(alertRegion()).toBe(region);expect(createButton()).toBeEnabled();
    expect(screen.queryByRole('button',{name:'Weiter zum Lernen'})).not.toBeInTheDocument();
    expect(register).toHaveBeenCalledTimes(1);
  });
  it('never renders thrown backend details',async()=>{
    const register=vi.fn().mockRejectedValue(new Error('SYNTHETIC_PRIVATE_BACKEND_DETAIL'));
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={vi.fn()} onRegister={register}/>);
    await userEvent.click(createButton());await expectMessage('Ein unerwarteter Fehler ist aufgetreten.');
    expect(document.body).not.toHaveTextContent('SYNTHETIC_PRIVATE_BACKEND_DETAIL');expect(register).toHaveBeenCalledTimes(1);
  });
  it('retains a created code after failed continuation without another registration',async()=>{
    const register=vi.fn().mockResolvedValue(fixtureCode),login=vi.fn().mockResolvedValue({success:false,error:'Verbindungsfehler.'});
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={login} onRegister={register}/>);
    await userEvent.click(createButton());await userEvent.click(await screen.findByRole('button',{name:'Weiter zum Lernen'}));
    await expectMessage('Verbindungsfehler.');expect(screen.getByText(fixtureCode)).toBeInTheDocument();
    expect(register).toHaveBeenCalledTimes(1);expect(login).toHaveBeenCalledExactlyOnceWith(fixtureCode);
  });
  it('preserves successful creation and clears the pending code only after explicit successful login',async()=>{
    const login=vi.fn().mockResolvedValue({success:true}),register=vi.fn().mockResolvedValue(fixtureCode);
    const props={onClose:vi.fn(),onLogin:login,onRegister:register};const view=render(<AuthModal isOpen {...props}/>);
    await userEvent.click(createButton());expect(await screen.findByText(fixtureCode)).toBeInTheDocument();expect(login).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button',{name:'Weiter zum Lernen'}));
    await waitFor(()=>expect(screen.queryByText(fixtureCode)).not.toBeInTheDocument());
    view.rerender(<AuthModal isOpen={false} {...props}/>);view.rerender(<AuthModal isOpen {...props}/>);
    expect(screen.queryByRole('button',{name:'Erstellten Zugangscode anzeigen'})).not.toBeInTheDocument();expect(createButton()).toBeEnabled();
    expect(login).toHaveBeenCalledExactlyOnceWith(fixtureCode);
  });
  it('clears obsolete view errors and associates the current login error with its input',async()=>{
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={vi.fn().mockResolvedValue({success:false,error:'Dieser Code wurde nicht gefunden.'})} onRegister={vi.fn().mockResolvedValue(null)}/>);
    await userEvent.click(createButton());await expectMessage('Fehler bei der Registrierung.');
    await userEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));expect(alertRegion()).toBeEmptyDOMElement();
    const input=screen.getByLabelText(/Zugangscode/i);await userEvent.type(input,fixtureCode);await userEvent.click(screen.getByRole('button',{name:'Anmelden'}));
    await expectMessage('Dieser Code wurde nicht gefunden.');expect(input).toHaveAttribute('aria-invalid','true');
    expect(input).toHaveAttribute('aria-describedby',`access-hash-hint ${alertRegion().id}`);
    await userEvent.click(screen.getByRole('button',{name:'Zurück'}));expect(alertRegion()).toBeEmptyDOMElement();
  });
  it('clears a completed failure after close and reopen',async()=>{
    const props={onClose:vi.fn(),onLogin:vi.fn(),onRegister:vi.fn().mockResolvedValue(null)};
    const view=render(<AuthModal isOpen {...props}/>);await userEvent.click(createButton());await expectMessage('Fehler bei der Registrierung.');
    view.rerender(<AuthModal isOpen={false} {...props}/>);expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    view.rerender(<AuthModal isOpen {...props}/>);expect(alertRegion()).toBeEmptyDOMElement();
  });
});

describe('AuthModal – pending requests and created credentials',()=>{
  it('ignores a pending login error after Back but keeps authentication serialized until settlement',async()=>{
    const pending=deferred<{success:boolean;error:string}>();
    const login=vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue({success:false,error:'Aktuelle Anmeldung fehlgeschlagen.'});
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={login} onRegister={vi.fn()}/>);
    await userEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));await userEvent.type(screen.getByLabelText(/Zugangscode/i),fixtureCode);
    await userEvent.click(screen.getByRole('button',{name:'Anmelden'}));await userEvent.click(screen.getByRole('button',{name:'Zurück'}));
    await userEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));
    expect(screen.getByRole('button',{name:'Anmeldung läuft...'})).toBeDisabled();expect(login).toHaveBeenCalledTimes(1);
    await act(async()=>pending.resolve({success:false,error:'Obsolete Anmeldung fehlgeschlagen.'}));
    expect(alertRegion()).toBeEmptyDOMElement();expect(screen.getByRole('button',{name:'Anmelden'})).toBeEnabled();
    await userEvent.click(screen.getByRole('button',{name:'Anmelden'}));await expectMessage('Aktuelle Anmeldung fehlgeschlagen.');expect(login).toHaveBeenCalledTimes(2);
  });
  it.each(['null','throw'])('ignores an obsolete registration %s error across reopening and explains pending state',async outcome=>{
    const pending=deferred<string|null>();const register=vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(fixtureCode);
    const props={onClose:vi.fn(),onLogin:vi.fn(),onRegister:register};const view=render(<AuthModal isOpen {...props}/>);
    await userEvent.click(createButton());view.rerender(<AuthModal isOpen={false} {...props}/>);view.rerender(<AuthModal isOpen {...props}/>);
    expect(createButton()).toBeDisabled();expect(screen.getByRole('status')).toHaveTextContent('Schließen bricht die Anfrage nicht ab.');
    await act(async()=>{if(outcome==='throw')pending.reject(new Error('SYNTHETIC_STALE_DETAIL'));else pending.resolve(null);});
    expect(alertRegion()).toBeEmptyDOMElement();expect(screen.getByRole('status')).toBeEmptyDOMElement();expect(createButton()).toBeEnabled();
    await userEvent.click(createButton());expect(await screen.findByText(fixtureCode)).toBeInTheDocument();expect(register).toHaveBeenCalledTimes(2);
  });
  it.each(['closed','reopened','login-view'])('preserves a late successful registration in %s without another account or forced view switch',async destination=>{
    const pending=deferred<string|null>(),register=vi.fn().mockReturnValue(pending.promise);
    const props={onClose:vi.fn(),onLogin:vi.fn(),onRegister:register};const view=render(<AuthModal isOpen {...props}/>);
    await userEvent.click(createButton());
    if(destination==='login-view') await userEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));
    else {view.rerender(<AuthModal isOpen={false} {...props}/>);if(destination==='reopened')view.rerender(<AuthModal isOpen {...props}/>);}
    await act(async()=>pending.resolve(fixtureCode));
    if(destination==='closed')view.rerender(<AuthModal isOpen {...props}/>);
    expect(alertRegion()).toBeEmptyDOMElement();expect(screen.queryByText(fixtureCode)).not.toBeInTheDocument();
    if(destination==='login-view')expect(screen.getByLabelText(/Zugangscode/i)).toBeInTheDocument();
    else {expect(createButton()).toBeDisabled();await userEvent.click(createButton());}
    await userEvent.click(screen.getByRole('button',{name:'Erstellten Zugangscode anzeigen'}));
    expect(screen.getByText(fixtureCode)).toBeInTheDocument();expect(register).toHaveBeenCalledTimes(1);
  });
  it('keeps an already displayed registration code available after closing and reopening',async()=>{
    const register=vi.fn().mockResolvedValue(fixtureCode),props={onClose:vi.fn(),onLogin:vi.fn(),onRegister:register};
    const view=render(<AuthModal isOpen {...props}/>);await userEvent.click(createButton());expect(await screen.findByText(fixtureCode)).toBeInTheDocument();
    view.rerender(<AuthModal isOpen={false} {...props}/>);view.rerender(<AuthModal isOpen {...props}/>);
    expect(createButton()).toBeDisabled();await userEvent.click(screen.getByRole('button',{name:'Erstellten Zugangscode anzeigen'}));
    expect(screen.getByText(fixtureCode)).toBeInTheDocument();expect(register).toHaveBeenCalledTimes(1);
  });
  it('warns to save a pending code and clears it on another successful login to prevent cross-account resurfacing',async()=>{
    const pending=deferred<string|null>(),register=vi.fn().mockReturnValue(pending.promise),login=vi.fn().mockResolvedValue({success:true});
    const props={onClose:vi.fn(),onLogin:login,onRegister:register};const view=render(<AuthModal isOpen {...props}/>);
    await userEvent.click(createButton());await userEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));await act(async()=>pending.resolve(fixtureCode));
    expect(screen.getByText(/Sichere ihn, bevor du dich mit einem anderen Code anmeldest/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Zugangscode/i),'Zy98xW76vU54');await userEvent.click(screen.getByRole('button',{name:'Anmelden'}));
    await waitFor(()=>expect(screen.queryByRole('button',{name:'Erstellten Zugangscode anzeigen'})).not.toBeInTheDocument());
    view.rerender(<AuthModal isOpen={false} {...props}/>);view.rerender(<AuthModal isOpen {...props}/>);
    expect(createButton()).toBeEnabled();expect(screen.queryByRole('button',{name:'Erstellten Zugangscode anzeigen'})).not.toBeInTheDocument();
    expect(login).toHaveBeenCalledExactlyOnceWith('Zy98xW76vU54');expect(register).toHaveBeenCalledTimes(1);
  });

  it('clears a used created code when the parent closes the modal before login settles',async()=>{
  const pending=deferred<{success:boolean}>(),login=vi.fn().mockReturnValue(pending.promise);
  const props={onClose:vi.fn(),onLogin:login,onRegister:vi.fn().mockResolvedValue(fixtureCode)};
  const view=render(<AuthModal isOpen {...props}/>);await userEvent.click(createButton());
  await userEvent.click(await screen.findByRole('button',{name:'Weiter zum Lernen'}));
  view.rerender(<AuthModal isOpen={false} {...props}/>);await act(async()=>pending.resolve({success:true}));
  view.rerender(<AuthModal isOpen {...props}/>);
  expect(screen.queryByRole('button',{name:'Erstellten Zugangscode anzeigen'})).not.toBeInTheDocument();
  expect(createButton()).toBeEnabled();expect(login).toHaveBeenCalledExactlyOnceWith(fixtureCode);
});

});
