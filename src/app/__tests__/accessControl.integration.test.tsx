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


it('writes permissions attempts once under its own ID and resets completed guest work on login',async()=>{
 localStorage.clear();render(<Home/>);
 fireEvent.click((await screen.findAllByRole('button',{name:/AP2 Rechte/}))[0]);
 const fill=()=>{for(const[label,value]of [['Lea · Aufträge','edit'],['Lea · Personalakten','none'],['Tom · Aufträge','read'],['Tom · Personalakten','edit'],['Mira · Aufträge','none'],['Mira · Personalakten','edit']]) fireEvent.change(screen.getByLabelText(label),{target:{value}});};
 fill();fireEvent.click(screen.getByRole('button',{name:'Zugriffe prüfen'}));expect(screen.getAllByRole('status')[0]).toHaveTextContent('Korrekt');expect(updateProgress).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Zugriffe: Lösung anzeigen'}));
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Gastnotiz'}});
 fireEvent.click(screen.getByRole('button',{name:'Test login'}));
 await waitFor(()=>expect(screen.getByLabelText('Lea · Aufträge')).toHaveValue(''));
 expect(screen.getByRole('textbox')).toHaveValue('');expect(screen.getByRole('button',{name:'Zugriffe: Lösung anzeigen'})).toHaveAttribute('aria-expanded','false');
 fill();fireEvent.click(screen.getByRole('button',{name:'Zugriffe prüfen'}));
 await waitFor(()=>expect(updateProgress).toHaveBeenCalledExactlyOnceWith('other-user-hash','ap2AccessControl',true));
 fireEvent.click(screen.getByRole('button',{name:'Zugriffe prüfen'}));expect(updateProgress).toHaveBeenCalledTimes(1);
 expect(screen.getByTestId('progress')).toHaveTextContent('subnetting');
 fireEvent.click(screen.getAllByRole('button',{name:/Subnetting/})[0]);expect(screen.getByText(/Gegeben: IP-Adresse/)).toBeInTheDocument();
},20000);
it('keeps the shared write-failure warning without retry and leaves the curated run unchanged',async()=>{
 vi.mocked(updateProgress).mockRejectedValueOnce(new Error('synthetic storage failure'));
 render(<Home/>);fireEvent.click((await screen.findAllByRole('button',{name:/AP2 Rechte/}))[0]);
 fireEvent.click(screen.getByRole('button',{name:'Korrektur prüfen'}));expect(await screen.findByRole('alert')).toHaveTextContent('Fortschritt konnte nicht gespeichert werden');
 fireEvent.click(screen.getByRole('button',{name:'Korrektur prüfen'}));expect(updateProgress).toHaveBeenCalledExactlyOnceWith('test-user-hash','ap2AccessControl',false);
 fireEvent.click(screen.getAllByRole('button',{name:/AP2-Lauf/})[0]);
 expect(screen.getByRole('navigation',{name:'Aufgaben im Trainingslauf'})).toHaveTextContent('1. Wirtschaftlichkeit');
 expect(screen.getByRole('navigation',{name:'Aufgaben im Trainingslauf'})).toHaveTextContent('2. Fehlersuche');
 expect(screen.getByRole('navigation',{name:'Aufgaben im Trainingslauf'})).toHaveTextContent('3. Datensicherung');
 expect(screen.queryByRole('button',{name:'Zugriffe prüfen'})).not.toBeInTheDocument();
},15000);
