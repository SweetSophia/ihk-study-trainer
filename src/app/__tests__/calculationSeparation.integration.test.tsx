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
vi.mock('../actions/generate-sql-exercise', () => ({ generateSqlExercise: vi.fn() }));
import { generateSqlExercise } from '../actions/generate-sql-exercise';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
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


it('skips retired mixed history when choosing an active mistake target, using canonical progress returned by auth', async () => {
 vi.mocked(getAllProgress).mockResolvedValue([
  {module:'handelskalkulation',questions_attempted:100,questions_correct:0,streak_days:0,last_session:null},
  {module:'handelskalkulationRueckwaerts',questions_attempted:4,questions_correct:1,streak_days:0,last_session:null},
  {module:'handelskalkulationDifferenz',questions_attempted:2,questions_correct:0,streak_days:0,last_session:null},
 ]);
 render(<Home/>);
 fireEvent.click(await screen.findByRole('button',{name:'Fehler üben'}));
 expect(await screen.findByText(/^Berechne die Rückwärtskalkulation!/)).toBeInTheDocument();
 expect(screen.queryByText(/^Berechne die Differenzkalkulation!/)).not.toBeInTheDocument();
 expect(updateProgress).not.toHaveBeenCalled();
},15000);

it('routes differential mistakes to the dedicated module and records only one check per question', async () => {
 vi.mocked(getAllProgress).mockResolvedValue([{module:'handelskalkulationDifferenz',questions_attempted:2,questions_correct:0,streak_days:0,last_session:null}]);
 render(<Home/>);
 fireEvent.click(await screen.findByRole('button',{name:'Fehler üben'}));
 expect(await screen.findByText(/^Berechne die Differenzkalkulation!/)).toBeInTheDocument();
 for(const input of screen.getAllByRole('textbox')) fireEvent.change(input,{target:{value:'0'}});
 const check=screen.getByRole('button',{name:/Antwort prüfen/});
 expect(check).toBeEnabled();
 fireEvent.click(check);fireEvent.click(check);
 await waitFor(()=>expect(updateProgress).toHaveBeenCalledTimes(1));
 expect(updateProgress).toHaveBeenCalledWith('test-user-hash','handelskalkulationDifferenz',false);
},15000);

it('keeps the selected forward draft when legacy-only history disables the real mistake action', async () => {
 vi.mocked(getAllProgress).mockResolvedValue([{module:'handelskalkulation',questions_attempted:100,questions_correct:0,streak_days:0,last_session:null}]);
 render(<Home/>);
 const practice=await screen.findByRole('button',{name:'Fehler üben'});
 expect(practice).toBeDisabled();
 fireEvent.click(screen.getAllByRole('button',{name:/Vorwärtskalk\./})[0]);
 const question=await screen.findByText(/^Berechne die Vorwärtskalkulation!/);
 const text=question.textContent;
 const firstInput=screen.getAllByRole('textbox')[0];fireEvent.change(firstInput,{target:{value:'123,45'}});
 await act(async()=>{fireEvent.click(practice);});
 expect(practice).toBeDisabled();
 expect(screen.getByText(/^Berechne die Vorwärtskalkulation!/).textContent).toBe(text);
 expect(firstInput).toHaveValue('123,45');
 expect(updateProgress).not.toHaveBeenCalled();
});

it('disables mistake practice for an active module with no incorrect attempts', async () => {
 vi.mocked(getAllProgress).mockResolvedValue([{module:'subnetting',questions_attempted:5,questions_correct:5,streak_days:0,last_session:null}]);
 render(<Home/>);
 expect(await screen.findByRole('button',{name:'Fehler üben'})).toBeDisabled();
});

it.each([false,true])('keeps SQL weak-topic navigation supported, with a competing drill: %s', async competing => {
 vi.mocked(getAllProgress).mockResolvedValue([
  {module:'sql',questions_attempted:10,questions_correct:0,streak_days:0,last_session:null},
  ...(competing?[{module:'handelskalkulationDifferenz',questions_attempted:2,questions_correct:1,streak_days:0,last_session:null}]:[]),
 ]);
 render(<Home/>);
 const practice=await screen.findByRole('button',{name:'Fehler üben'});expect(practice).toBeEnabled();fireEvent.click(practice);
 expect(await screen.findByRole('heading',{name:'SQL-Übungen (PostgreSQL)'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Neue Übung'})).toBeEnabled();
 expect(screen.queryByText(/^Berechne die Differenzkalkulation!/)).not.toBeInTheDocument();
 expect(generateSqlExercise).not.toHaveBeenCalled();expect(updateProgress).not.toHaveBeenCalled();
});

it('keeps AP2 weak-topic navigation supported through its dedicated trainer', async () => {
 vi.mocked(getAllProgress).mockResolvedValue([{module:'ap2ProjectPlanning',questions_attempted:5,questions_correct:1,streak_days:0,last_session:null}]);
 render(<Home/>);
 const practice=await screen.findByRole('button',{name:'Fehler üben'});expect(practice).toBeEnabled();fireEvent.click(practice);
 expect(await screen.findByRole('heading',{name:'AP2 Projektplanung'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Basisplan prüfen'})).toBeEnabled();
 expect(updateProgress).not.toHaveBeenCalled();
});
