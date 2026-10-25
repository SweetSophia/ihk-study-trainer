import { beforeEach, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Home from '../page';
vi.mock('../lib/databaseWorkerClient', () => ({ checkDatabaseTask: vi.fn() }));
import { getAllProgress, getUserByHash, updateProgress } from '../lib/auth';

// Exercise real page navigation and progress wiring with worker results isolated.
vi.mock('../lib/auth', () => ({
  getUserByHash: vi.fn(), getAllProgress: vi.fn(), updateProgress: vi.fn(), generateUniqueUser: vi.fn(),
}));
vi.mock('../components/SqlTrainer', () => ({ default: () => <div>SQL trainer</div> }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../components/ProgressDashboard', () => ({default: ({progress}: {progress: unknown}) => <div data-testid="progress">{JSON.stringify(progress)}</div>}));
vi.mock('../components/AuthModal', () => ({ default: ({isOpen,onLogin}: {isOpen:boolean;onLogin:(hash:string)=>Promise<unknown>}) => isOpen ? <button onClick={()=>onLogin('other-user-hash')}>Test login</button> : null }));
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


it('wires project progress, protects repeats and resets guest work on login', async()=>{
 localStorage.clear();render(<Home/>);
 fireEvent.click((await screen.findAllByRole('button',{name:/AP2 Projekt/}))[0]);
 fireEvent.change(screen.getByLabelText('Änderung: Projektdauer'),{target:{value:'12'}});
 fireEvent.click(within(screen.getByRole('region',{name:'AP2 Projektplanung'})).getByRole('button',{name:'Änderung prüfen'}));expect(updateProgress).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Test login'}));
 await waitFor(()=>expect(screen.getByLabelText('Änderung: Projektdauer')).toHaveValue(''));
 fireEvent.change(screen.getByLabelText('Änderung: Projektdauer'),{target:{value:'12'}});
 for(const id of ['A','C','D','E','F']) fireEvent.click(screen.getByLabelText(`Änderung: ${id} kritisch`));
 fireEvent.click(within(screen.getByRole('region',{name:'AP2 Projektplanung'})).getByRole('button',{name:'Änderung prüfen'}));
 await waitFor(()=>expect(updateProgress).toHaveBeenCalledExactlyOnceWith('other-user-hash','ap2ProjectPlanning',true));
 fireEvent.click(within(screen.getByRole('region',{name:'AP2 Projektplanung'})).getByRole('button',{name:'Änderung prüfen'}));expect(updateProgress).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getAllByRole('button',{name:/Subnetting/})[0]);expect(screen.getByText(/Gegeben: IP-Adresse/)).toBeInTheDocument();
}, 15000);
