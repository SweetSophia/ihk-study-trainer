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
vi.mock('../components/ProgressDashboard', () => ({default: ({progress,streakDays}: {progress: unknown;streakDays:number}) => <div data-testid="progress" data-streak={streakDays}>{JSON.stringify(progress)}</div>}));
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


it('reports a failed progress write and clears it after a successful attempt',async()=>{
 vi.mocked(updateProgress).mockRejectedValueOnce(new Error('Lokaler Fortschritt konnte nicht gespeichert werden.'));
 render(<Home/>);fireEvent.click((await screen.findAllByRole('button',{name:/AP2 Projekt/}))[0]);
 fireEvent.click(screen.getByRole('button',{name:'Basisplan prüfen'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Fortschritt konnte nicht gespeichert werden');
 expect(screen.getByTestId('progress')).toHaveTextContent('subnetting');
 fireEvent.click(screen.getByRole('button',{name:'Neuer Durchlauf'}));fireEvent.click(screen.getByRole('button',{name:'Basisplan prüfen'}));
 await waitFor(()=>expect(screen.queryByRole('alert')).not.toBeInTheDocument());
},15000);
it('does not display an old account write failure after logout',async()=>{
 let reject!:(e:Error)=>void;vi.mocked(updateProgress).mockReturnValueOnce(new Promise((_,r)=>{reject=r;}));
 render(<Home/>);fireEvent.click((await screen.findAllByRole('button',{name:/AP2 Projekt/}))[0]);
 fireEvent.click(screen.getByRole('button',{name:'Basisplan prüfen'}));
 fireEvent.click(screen.getByRole('button',{name:'Abmelden'}));reject(new Error('old failure'));
 await waitFor(()=>expect(screen.queryByRole('alert')).not.toBeInTheDocument());
 fireEvent.click(screen.getByRole('button',{name:'Test login'}));
 await waitFor(()=>expect(screen.getByTestId('progress')).toHaveTextContent('subnetting'));
 expect(screen.queryByRole('alert')).not.toBeInTheDocument();
},15000);

it('clears prior account counters and streak even when the next account cannot load',async()=>{
 vi.mocked(getAllProgress).mockResolvedValueOnce([{module:'ports',questions_attempted:4,questions_correct:3,streak_days:7,last_session:null}]);
 render(<Home/>);await waitFor(()=>expect(screen.getByTestId('progress')).toHaveAttribute('data-streak','7'));
 fireEvent.click(screen.getByRole('button',{name:'Abmelden'}));
 expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
 vi.mocked(getAllProgress).mockRejectedValueOnce(new Error('Lokaler Fortschritt konnte nicht geladen werden.'));
 fireEvent.click(screen.getByRole('button',{name:'Test login'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Fortschritt konnte nicht geladen werden');
 expect(screen.getByTestId('progress')).toHaveAttribute('data-streak','0');expect(screen.getByTestId('progress')).toHaveTextContent('[]');
},15000);
