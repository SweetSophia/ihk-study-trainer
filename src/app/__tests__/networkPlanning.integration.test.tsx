import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Home from '../page';
import { getAllProgress, getUserByHash, updateProgress } from '../lib/auth';

// Isolate network/auth services. Exercise the real page, navigation, trainer,
// validator and progress dashboard together.
vi.mock('../lib/auth', () => ({
  getUserByHash: vi.fn(), getAllProgress: vi.fn(), updateProgress: vi.fn(), generateUniqueUser: vi.fn(),
}));
vi.mock('../components/SqlTrainer', () => ({ default: () => <div>SQL trainer</div> }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../components/AuthModal', () => ({ default: () => null }));
// Animation frames are not part of the integration contract. Keep the actual
// navigation and form DOM, without running dozens of motion timers in jsdom.
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
  motion: {
    div: ({ children, className }: HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
    p: ({ children, className }: HTMLAttributes<HTMLParagraphElement>) => <p className={className}>{children}</p>,
    section: ({ children, className }: HTMLAttributes<HTMLElement>) => <section className={className}>{children}</section>,
    button: ({ children, className, onClick }: ButtonHTMLAttributes<HTMLButtonElement>) => <button className={className} onClick={onClick}>{children}</button>,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('ihk_access_hash', 'test-user-hash');
  vi.mocked(getUserByHash).mockResolvedValue({ id: 'user-1', access_hash: 'test-user-hash', created_at: '', last_login: null });
  vi.mocked(getAllProgress).mockResolvedValue([
    { module: 'subnetting', questions_attempted: 8, questions_correct: 6, streak_days: 1, last_session: null },
  ]);
  vi.mocked(updateProgress).mockResolvedValue(null);
});

async function selectPlanning() {
  const buttons = await screen.findAllByRole('button', { name: /AP2 Netzwerk/ });
  fireEvent.click(buttons[0]);
}

function fillAlternative() {
  ['192.168.40.0', '192.168.40.128', '192.168.40.192'].forEach((network, index) => {
    fireEvent.change(screen.getAllByLabelText('Netzadresse')[index], { target: { value: network } });
    fireEvent.change(screen.getAllByLabelText('Präfixlänge')[index], { target: { value: String(25 + index) } });
    fireEvent.change(screen.getAllByLabelText('VLAN-ID')[index], { target: { value: String(101 + index) } });
  });
}

describe('AP2 module integration', () => {
  it('records objective progress once under the new ID and keeps existing drills reachable', async () => {
    render(<Home />);
    await selectPlanning();
    expect(screen.getByRole('heading', { name: 'AP2 Netzwerkplanung' })).toBeInTheDocument();
    fillAlternative();
    fireEvent.click(screen.getByRole('button', { name: 'Netzplan prüfen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Netzplan prüfen' }));
    await waitFor(() => expect(updateProgress).toHaveBeenCalledExactlyOnceWith('test-user-hash', 'ap2NetworkPlanning', true));
    expect(getAllProgress).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getAllByRole('button', { name: /Subnetting/ })[0]);
    expect(screen.queryByRole('heading', { name: 'AP2 Netzwerkplanung' })).not.toBeInTheDocument();
    expect(screen.getByText(/Gegeben: IP-Adresse/)).toBeInTheDocument();
  });

  it('records invalid allocations as incorrect and never records rubric/example actions', async () => {
    render(<Home />);
    await selectPlanning();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Begründung der Verkehrsregeln' }), { target: { value: 'private notes' } });
    expect(updateProgress).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Netzplan prüfen' }));
    await waitFor(() => expect(updateProgress).toHaveBeenCalledExactlyOnceWith('test-user-hash', 'ap2NetworkPlanning', false));
    fireEvent.click(screen.getByRole('button', { name: /Beispiel anzeigen/ }));
    expect(updateProgress).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole('button', { name: /Subnetting/ })[0]);
    await selectPlanning();
    expect(screen.getByRole('textbox', { name: 'Begründung der Verkehrsregeln' })).toHaveValue('');
    expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
  });
});
