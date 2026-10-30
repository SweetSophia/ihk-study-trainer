import { beforeEach, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Home from '../page';
vi.mock('../lib/databaseWorkerClient', () => ({ checkDatabaseTask: vi.fn() }));
import { getAllProgress, getUserByHash, updateProgress } from '../lib/auth';

// Exercise real page navigation and progress wiring with worker results isolated.
vi.mock('../lib/auth', () => ({
  getUserByHash: vi.fn(), getAllProgress: vi.fn(), updateProgress: vi.fn(), generateUniqueUser: vi.fn(),
}));
vi.mock('../components/SqlTrainer', () => ({ default: () => <div>SQL trainer</div> }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../components/ProgressDashboard', () => ({default: ({progress,streakDays,onPracticeMistakes}: {progress: unknown;streakDays:number;onPracticeMistakes:()=>void}) => <div data-testid="progress" data-streak={streakDays}>{JSON.stringify(progress)}<button onClick={onPracticeMistakes}>Practice mistakes</button></div>}));
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


it('skips retired mixed history when choosing an active mistake target, including stored backward alias', async () => {
 vi.mocked(getAllProgress).mockResolvedValue([
  {module:'handelskalkulation',questions_attempted:100,questions_correct:0,streak_days:0,last_session:null},
  {module:'handelskalkulation-rueckwaerts',questions_attempted:4,questions_correct:1,streak_days:0,last_session:null},
  {module:'handelskalkulationDifferenz',questions_attempted:2,questions_correct:0,streak_days:0,last_session:null},
 ]);
 render(<Home/>);
 fireEvent.click(await screen.findByRole('button',{name:'Practice mistakes'}));
 expect(await screen.findByText(/^Berechne die Rückwärtskalkulation!/)).toBeInTheDocument();
 expect(screen.queryByText(/^Berechne die Differenzkalkulation!/)).not.toBeInTheDocument();
 expect(updateProgress).not.toHaveBeenCalled();
},15000);

it('routes differential mistakes to the dedicated module and records only one check per question', async () => {
 vi.mocked(getAllProgress).mockResolvedValue([{module:'handelskalkulationDifferenz',questions_attempted:2,questions_correct:0,streak_days:0,last_session:null}]);
 render(<Home/>);
 fireEvent.click(await screen.findByRole('button',{name:'Practice mistakes'}));
 expect(await screen.findByText(/^Berechne die Differenzkalkulation!/)).toBeInTheDocument();
 for(const input of screen.getAllByRole('textbox')) fireEvent.change(input,{target:{value:'0'}});
 const check=screen.getByRole('button',{name:/Antwort prüfen/});
 expect(check).toBeEnabled();
 fireEvent.click(check);fireEvent.click(check);
 await waitFor(()=>expect(updateProgress).toHaveBeenCalledTimes(1));
 expect(updateProgress).toHaveBeenCalledWith('test-user-hash','handelskalkulationDifferenz',false);
},15000);

it('does not resume mixed exercises from legacy-only history', async () => {
 vi.mocked(getAllProgress).mockResolvedValue([{module:'handelskalkulation',questions_attempted:100,questions_correct:0,streak_days:0,last_session:null}]);
 render(<Home/>);
 fireEvent.click(await screen.findByRole('button',{name:'Practice mistakes'}));
 expect(screen.queryByRole('button',{name:/Antwort prüfen/})).not.toBeInTheDocument();
 expect(updateProgress).not.toHaveBeenCalled();
});
