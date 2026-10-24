import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Home from '../page';
import { checkDatabaseTask } from '../lib/databaseWorkerClient';
vi.mock('../lib/databaseWorkerClient', () => ({ checkDatabaseTask: vi.fn() }));
import { getAllProgress, getUserByHash, updateProgress } from '../lib/auth';

// Exercise real page navigation and progress wiring with worker results isolated.
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


describe('AP2 database module integration', () => {
 it('records its own progress once and preserves navigation to existing drills', async () => {
  vi.mocked(checkDatabaseTask).mockResolvedValue({correct:true});
  render(<Home />);
  fireEvent.click((await screen.findAllByRole('button',{name:/AP2 Datenbank/}))[0]);
  fireEvent.change(screen.getByLabelText('SQL für Aufgabe 1'),{target:{value:'SELECT 1'}});
  fireEvent.click(screen.getByRole('button',{name:'Aufgabe 1 prüfen'}));
  await waitFor(()=>expect(updateProgress).toHaveBeenCalledExactlyOnceWith('test-user-hash','ap2DatabaseDesign',true));
  fireEvent.click(screen.getByRole('button',{name:'Aufgabe 1 prüfen'}));
  await waitFor(()=>expect(checkDatabaseTask).toHaveBeenCalledTimes(2));
  expect(updateProgress).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getAllByRole('button',{name:/Subnetting/})[0]);
  expect(screen.getByText(/Gegeben: IP-Adresse/)).toBeInTheDocument();
 });
});
