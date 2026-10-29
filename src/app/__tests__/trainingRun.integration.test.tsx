import { beforeEach, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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


it('routes run checks to original topics only and resets completed guest work after login', async () => {
 localStorage.clear(); render(<Home/>);
 fireEvent.click((await screen.findAllByRole('button',{name:/AP2-Lauf/}))[0]);
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 fireEvent.click(screen.getByRole('button',{name:'Auswertung'}));
 expect(screen.getByText(/0 von 1 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
 expect(updateProgress).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Test login'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'1. Wirtschaftlichkeit'})).toHaveAttribute('aria-current','step'));
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 await waitFor(()=>expect(updateProgress).toHaveBeenCalledExactlyOnceWith('other-user-hash','ap2CostComparison',false));
 fireEvent.click(screen.getByRole('button',{name:'2. Fehlersuche'}));
 fireEvent.click(screen.getByRole('button',{name:'Diagnose prüfen'}));
 fireEvent.click(screen.getByRole('button',{name:'3. Datensicherung'}));
 fireEvent.click(screen.getByRole('button',{name:'Sicherungskette prüfen'}));
 await waitFor(()=>expect(updateProgress).toHaveBeenCalledTimes(3));
 expect(vi.mocked(updateProgress).mock.calls.map(call=>call[1])).toEqual(['ap2CostComparison','ap2Troubleshooting','ap2BackupRecovery']);
 fireEvent.click(screen.getByRole('button',{name:'Auswertung'}));
 fireEvent.click(screen.getByRole('button',{name:'Datensicherung weiterüben'}));
 fireEvent.click(screen.getByRole('button',{name:'Sicherungskette prüfen'}));expect(updateProgress).toHaveBeenCalledTimes(3);
 expect(screen.getByTestId('progress')).toHaveTextContent('subnetting');
 fireEvent.click(screen.getAllByRole('button',{name:/Subnetting/})[0]);
 fireEvent.click(screen.getAllByRole('button',{name:/AP2-Lauf/})[0]);
 fireEvent.click(screen.getByRole('button',{name:'Auswertung'}));
 expect(screen.getByText(/0 von 0 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
},20000);
it('retains local summary on storage failure without retrying or counting the wrapper',async()=>{
 vi.mocked(updateProgress).mockRejectedValueOnce(new Error('synthetic storage failure'));
 render(<Home/>);fireEvent.click((await screen.findAllByRole('button',{name:/AP2-Lauf/}))[0]);
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Fortschritt konnte nicht gespeichert werden');
 fireEvent.click(screen.getByRole('button',{name:'Auswertung'}));
 expect(screen.getByText(/0 von 1 gewerteten Erstprüfungen korrekt/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Wirtschaftlichkeit weiterüben'}));
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 expect(updateProgress).toHaveBeenCalledExactlyOnceWith('test-user-hash','ap2CostComparison',false);
},15000);
