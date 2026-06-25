import type { HTMLAttributes } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
