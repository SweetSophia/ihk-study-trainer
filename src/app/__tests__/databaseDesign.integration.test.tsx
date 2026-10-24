import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

it('ignores older progress replies and replies after logout', async () => {
 vi.mocked(checkDatabaseTask).mockResolvedValue({correct:true});
 render(<Home />);
 fireEvent.click((await screen.findAllByRole('button',{name:/AP2 Datenbank/}))[0]);
 let old!: (v: Awaited<ReturnType<typeof getAllProgress>>) => void;
 let newest!: (v: Awaited<ReturnType<typeof getAllProgress>>) => void;
 vi.mocked(getAllProgress).mockImplementationOnce(()=>new Promise(r=>{old=r})).mockImplementationOnce(()=>new Promise(r=>{newest=r}));
 for(const n of [1,2]) {
  fireEvent.change(screen.getByLabelText(`SQL für Aufgabe ${n}`),{target:{value:'SELECT 1'}});
  fireEvent.click(screen.getByRole('button',{name:`Aufgabe ${n} prüfen`}));
  await waitFor(()=>expect(getAllProgress).toHaveBeenCalledTimes(n+1));
 }
 const row=(n:number)=>[{module:'ap2DatabaseDesign',questions_attempted:n,questions_correct:n,streak_days:1,last_session:null}];
 await act(async()=>newest(row(2)));await act(async()=>old(row(1)));
 expect(screen.getByTestId('progress')).toHaveTextContent('"questions_attempted":2');
 let late!: (v: Awaited<ReturnType<typeof getAllProgress>>) => void;
 vi.mocked(getAllProgress).mockImplementationOnce(()=>new Promise(r=>{late=r}));
 fireEvent.change(screen.getByLabelText('SQL für Aufgabe 3'),{target:{value:'UPDATE geraet'}});
 fireEvent.click(screen.getByRole('button',{name:'Aufgabe 3 prüfen'}));
 await waitFor(()=>expect(getAllProgress).toHaveBeenCalledTimes(4));
 fireEvent.click(screen.getByRole('button',{name:'Abmelden'}));
 vi.mocked(getAllProgress).mockResolvedValue(row(9));
 fireEvent.click(screen.getByRole('button',{name:'Test login'}));
 await waitFor(()=>expect(screen.getByTestId('progress')).toHaveTextContent('"questions_attempted":9'));
 await act(async()=>late(row(3)));
 expect(screen.getByTestId('progress')).toHaveTextContent('"questions_attempted":9');
});
