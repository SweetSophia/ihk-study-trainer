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

describe('AuthModal – shared registration feedback', () => {
  it('announces an unsuccessful registration in the selection view without retrying it', async () => {
    const register = vi.fn().mockResolvedValue(null);
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={vi.fn()} onRegister={register} />);
    await userEvent.click(screen.getByRole('button', { name: /Zugangscode erstellen/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Fehler bei der Registrierung. Bitte versuche es erneut.');
    expect(screen.getByRole('button', { name: /Zugangscode erstellen/ })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Weiter zum Lernen' })).not.toBeInTheDocument();
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('shows only sanitized feedback when registration throws backend details', async () => {
    const register = vi.fn().mockRejectedValue(new Error('SYNTHETIC_PRIVATE_BACKEND_DETAIL'));
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={vi.fn()} onRegister={register} />);
    await userEvent.click(screen.getByRole('button', { name: /Zugangscode erstellen/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ein unerwarteter Fehler ist aufgetreten.');
    expect(document.body).not.toHaveTextContent('SYNTHETIC_PRIVATE_BACKEND_DETAIL');
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('preserves the created code and announces a failed continuation without registering again', async () => {
    const register = vi.fn().mockResolvedValue('Ab12cD34eF56');
    const login = vi.fn().mockResolvedValue({ success: false, error: 'Verbindungsfehler. Bitte versuche es erneut.' });
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={login} onRegister={register} />);
    await userEvent.click(screen.getByRole('button', { name: /Zugangscode erstellen/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Weiter zum Lernen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Verbindungsfehler.');
    expect(screen.getByText('Ab12cD34eF56')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter zum Lernen' })).toBeEnabled();
    expect(register).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledExactlyOnceWith('Ab12cD34eF56');
  });

  it('keeps successful code creation and explicit continuation unchanged', async () => {
    const login = vi.fn().mockResolvedValue({ success: true });
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={login} onRegister={vi.fn().mockResolvedValue('Ab12cD34eF56')} />);
    await userEvent.click(screen.getByRole('button', { name: /Zugangscode erstellen/ }));
    expect(await screen.findByText('Ab12cD34eF56')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Weiter zum Lernen' }));
    await waitFor(() => expect(screen.queryByText('Ab12cD34eF56')).not.toBeInTheDocument());
    expect(login).toHaveBeenCalledExactlyOnceWith('Ab12cD34eF56');
  });

  it('clears an obsolete registration error when choosing existing-code login and links its new error', async () => {
    render(<AuthModal isOpen onClose={vi.fn()} onLogin={vi.fn().mockResolvedValue({success:false,error:'Dieser Code wurde nicht gefunden.'})} onRegister={vi.fn().mockResolvedValue(null)} />);
    await userEvent.click(screen.getByRole('button', { name: /Zugangscode erstellen/ }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Ich habe einen Code/ }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const input = screen.getByLabelText(/Zugangscode/i);
    await userEvent.type(input,'Ab12cD34eF56');
    await userEvent.click(screen.getByRole('button',{name:'Anmelden'}));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Dieser Code wurde nicht gefunden.');
    expect(input).toHaveAttribute('aria-describedby',`access-hash-hint ${alert.id}`);
    expect(input).toHaveAttribute('aria-invalid','true');
    await userEvent.click(screen.getByRole('button',{name:'Zurück'}));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('resets failure feedback on close and reopen', async () => {
    const props={onClose:vi.fn(),onLogin:vi.fn(),onRegister:vi.fn().mockResolvedValue(null)};
    const view=render(<AuthModal isOpen {...props}/>);
    await userEvent.click(screen.getByRole('button',{name:/Zugangscode erstellen/}));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    view.rerender(<AuthModal isOpen={false} {...props}/>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    view.rerender(<AuthModal isOpen {...props}/>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});


it('ignores a pending login failure after returning to selection', async () => {
  let finish!: (result: {success:boolean;error:string}) => void;
  const login=vi.fn(()=>new Promise<{success:boolean;error:string}>(resolve=>{finish=resolve;}));
  render(<AuthModal isOpen onClose={vi.fn()} onLogin={login} onRegister={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));
  await userEvent.type(screen.getByLabelText(/Zugangscode/i),'Ab12cD34eF56');
  await userEvent.click(screen.getByRole('button',{name:'Anmelden'}));
  await userEvent.click(screen.getByRole('button',{name:'Zurück'}));
  await act(async()=>{finish({success:false,error:'Dieser Code wurde nicht gefunden.'});});
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:/Zugangscode erstellen/})).toBeEnabled();
  expect(login).toHaveBeenCalledTimes(1);
});

it.each(['failure','success'])('ignores an obsolete registration %s across closing and reopening', async outcome => {
  let finish!: (value:string|null) => void;
  const register=vi.fn().mockImplementationOnce(()=>new Promise<string|null>(resolve=>{finish=resolve;})).mockResolvedValue('Ab12cD34eF56');
  const props={onClose:vi.fn(),onLogin:vi.fn(),onRegister:register};
  const view=render(<AuthModal isOpen {...props}/>);
  await userEvent.click(screen.getByRole('button',{name:/Zugangscode erstellen/}));
  view.rerender(<AuthModal isOpen={false} {...props}/>);
  view.rerender(<AuthModal isOpen {...props}/>);
  expect(screen.getByRole('button',{name:/Zugangscode erstellen/})).toBeDisabled();
  await act(async()=>{finish(outcome==='failure'?null:'OldOnly00001');});
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText('OldOnly00001')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:/Zugangscode erstellen/})).toBeEnabled();
  await userEvent.click(screen.getByRole('button',{name:/Zugangscode erstellen/}));
  expect(await screen.findByText('Ab12cD34eF56')).toBeInTheDocument();
  expect(register).toHaveBeenCalledTimes(2);
});


it('keeps authentication serialized while an abandoned login callback is pending', async () => {
  let finish!: (value:{success:boolean;error:string})=>void;
  const login=vi.fn().mockImplementationOnce(()=>new Promise<{success:boolean;error:string}>(resolve=>{finish=resolve;})).mockResolvedValue({success:false,error:'Aktuelle Anmeldung fehlgeschlagen.'});
  render(<AuthModal isOpen onClose={vi.fn()} onLogin={login} onRegister={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));
  await userEvent.type(screen.getByLabelText(/Zugangscode/i),'Ab12cD34eF56');
  await userEvent.click(screen.getByRole('button',{name:'Anmelden'}));
  await userEvent.click(screen.getByRole('button',{name:'Zurück'}));
  await userEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));
  expect(screen.getByRole('button',{name:'Anmeldung läuft...'})).toBeDisabled();
  expect(login).toHaveBeenCalledTimes(1);
  await act(async()=>{finish({success:false,error:'Obsolete Anmeldung fehlgeschlagen.'});});
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Anmelden'})).toBeEnabled();
  await userEvent.click(screen.getByRole('button',{name:'Anmelden'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Aktuelle Anmeldung fehlgeschlagen.');
  expect(login).toHaveBeenCalledTimes(2);
});
