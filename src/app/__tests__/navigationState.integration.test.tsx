import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Home from '../page';
import { chooseModule } from '../../test/navigation';
vi.mock('../lib/databaseWorkerClient', () => ({ checkDatabaseTask: vi.fn() }));
import { getAllProgress, getUserByHash, updateProgress } from '../lib/auth';

// Exercise real page navigation and progress wiring with worker results isolated.
vi.mock('../lib/auth', () => ({
  getUserByHash: vi.fn(), getAllProgress: vi.fn(), updateProgress: vi.fn(), generateUniqueUser: vi.fn(),
}));
vi.mock('../actions/generate-sql-exercise', () => ({ generateSqlExercise: vi.fn() }));
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

afterEach(()=>vi.unstubAllGlobals());

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('ihk_access_hash', 'test-user-hash');
  vi.mocked(getUserByHash).mockResolvedValue({ id: 'user-1', access_hash: 'test-user-hash', created_at: '', last_login: null });
  vi.mocked(getAllProgress).mockResolvedValue([
    { module: 'subnetting', questions_attempted: 8, questions_correct: 6, streak_days: 1, last_session: null },
  ]);
  vi.mocked(updateProgress).mockResolvedValue(null);
},15000);



it('retains draft and checked state across group browsing, appearance and active-module selection',async()=>{
 render(<Home/>);await screen.findByRole('button',{name:'Fehler üben'});
 await chooseModule('handelskalkulationVorwaerts');
 await waitFor(()=>expect(screen.getByRole('heading',{name:'Vorwärtskalkulation'})).toHaveFocus());
 const first=screen.getAllByRole('textbox')[0];fireEvent.change(first,{target:{value:'123,45'}});
 fireEvent.click(screen.getByRole('button',{name:'Netzwerke'}));
 const appearance=screen.getByRole('combobox',{name:'Darstellung'});
 fireEvent.change(appearance,{target:{value:'dark'}});appearance.focus();
 await chooseModule('handelskalkulationVorwaerts');
 expect(screen.getByRole('heading',{name:'Vorwärtskalkulation'})).toHaveFocus();
 expect(first).toHaveValue('123,45');expect(updateProgress).not.toHaveBeenCalled();
 for(const input of screen.getAllByRole('textbox')) fireEvent.change(input,{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 await waitFor(()=>expect(updateProgress).toHaveBeenCalledTimes(1));
 await chooseModule('handelskalkulationVorwaerts');
 expect(screen.getByRole('button',{name:/Nächste Frage/})).toBeInTheDocument();
 expect(updateProgress).toHaveBeenCalledTimes(1);
},15000);
it('protects all run state when cancelling a module or mistake transition; confirms only actual departure',async()=>{
 render(<Home/>);await screen.findByRole('button',{name:'Fehler üben'});
 await chooseModule('ap2TrainingRun');
 const first=screen.getAllByRole('textbox')[0];fireEvent.change(first,{target:{value:'123'}});
 fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 await chooseModule('ap2TrainingRun');expect(screen.queryByText(/Trainingslauf verlassen\?/)).not.toBeInTheDocument();
 await chooseModule('subnetting');
 expect(screen.getByText(/Trainingslauf verlassen\?/)).toBeInTheDocument();expect(first).toHaveValue('123');
 expect(screen.getByRole('button',{name:'Weiterarbeiten'})).toHaveFocus();
 await chooseModule('ap2TrainingRun');
 expect(screen.queryByText(/Trainingslauf verlassen\?/)).not.toBeInTheDocument();expect(first).toHaveValue('123');
 await chooseModule('subnetting');
 fireEvent.click(screen.getByRole('button',{name:/^Netzwerke/}));
 fireEvent.click(screen.getByRole('button',{name:'Weiterarbeiten'}));
 expect(screen.getByRole('button',{name:/^AP2-Trainingslauf/})).toHaveFocus();expect(first).toHaveValue('123');
 fireEvent.click(screen.getByRole('button',{name:'Fehler üben'}));
 fireEvent.click(screen.getByRole('button',{name:'Trainingslauf verlassen'}));
 expect(screen.getByText(/Gegeben: IP-Adresse/)).toBeInTheDocument();
 expect(updateProgress).toHaveBeenCalledTimes(1);
 await chooseModule('ap2TrainingRun');expect(screen.getAllByRole('textbox')[0]).toHaveValue('');
},15000);
it('keeps the guest AP2 database and run available without progress writes',async()=>{
 localStorage.clear();render(<Home/>);await screen.findByRole('button',{name:'Anmelden'});
 await chooseModule('ap2DatabaseDesign');expect(screen.getByRole('heading',{name:/AP2 Datenbank/})).toBeInTheDocument();
 await chooseModule('ap2TrainingRun');fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 fireEvent.change(screen.getByRole('combobox',{name:'Darstellung'}),{target:{value:'light'}});
 await chooseModule('ap2TrainingRun');fireEvent.click(screen.getByRole('button',{name:'Kostenvergleich prüfen'}));
 expect(updateProgress).not.toHaveBeenCalled();
},15000);
it('keeps module-navigation focus on the heading after a checked question resets, but next-question focuses input',async()=>{
 render(<Home/>);await screen.findByRole('button',{name:'Fehler üben'});
 await chooseModule('handelskalkulationVorwaerts');
 for(const input of screen.getAllByRole('textbox')) fireEvent.change(input,{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 await chooseModule('binary');
 await act(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))});
 expect(screen.getByRole('heading',{name:'Binär'})).toHaveFocus();
 for(const input of screen.getAllByRole('textbox')) fireEvent.change(input,{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 fireEvent.click(screen.getByRole('button',{name:/Nächste Frage/}));
 await waitFor(()=>expect(screen.getAllByRole('textbox')[0]).toHaveFocus());
},15000);
it('does not route chrome keyboard input to the checked exercise next-question shortcut',async()=>{
 render(<Home/>);await screen.findByRole('button',{name:'Fehler üben'});await chooseModule('handelskalkulationVorwaerts');
 for(const input of screen.getAllByRole('textbox')) fireEvent.change(input,{target:{value:'0'}});
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 const oldQuestion=screen.getByText(/^Berechne die Vorwärtskalkulation!/).textContent;
 const appearance=screen.getByRole('combobox',{name:'Darstellung'});appearance.focus();fireEvent.keyDown(appearance,{key:'n'});
 expect(screen.getByRole('button',{name:/Nächste Frage/})).toBeInTheDocument();
 expect(screen.getByText(/^Berechne die Vorwärtskalkulation!/).textContent).toBe(oldQuestion);
 expect(updateProgress).toHaveBeenCalledTimes(1);
},15000);
it('moves focus between the progress disclosure and its visible actions at the breakpoint',async()=>{
 let desktop=true;const listeners=new Set<()=>void>();
 vi.stubGlobal('matchMedia',vi.fn((query:string)=>({get matches(){return query.includes('min-width')?desktop:false},addEventListener:(_event:string,callback:()=>void)=>{if(query.includes('min-width'))listeners.add(callback)},removeEventListener:(_event:string,callback:()=>void)=>listeners.delete(callback)})));
 render(<Home/>);const details=await screen.findByRole('button',{name:'Details anzeigen'});details.focus();
 act(()=>{desktop=false;listeners.forEach(listener=>listener())});
 const toggle=screen.getByRole('button',{name:'Fortschritt'});expect(toggle).toHaveFocus();
 act(()=>{desktop=true;listeners.forEach(listener=>listener())});
 expect(screen.getByRole('button',{name:'Fehler üben'})).toHaveFocus();
 vi.unstubAllGlobals();
},15000);

it('refocuses an existing mobile departure confirmation when the same pending target is selected again',async()=>{
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
 render(<Home/>);await chooseModule('ap2TrainingRun');
 const first=screen.getAllByRole('textbox')[0];fireEvent.change(first,{target:{value:'123'}});
 await chooseModule('subnetting');const proceed=screen.getByRole('button',{name:'Weiterarbeiten'});expect(proceed).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:/^Aufgabe wechseln/}));
 const target=screen.getByRole('button',{name:'Subnetting'});target.focus();fireEvent.click(target);
 expect(proceed).toHaveFocus();expect(first).toHaveValue('123');expect(updateProgress).not.toHaveBeenCalled();
},15000);
