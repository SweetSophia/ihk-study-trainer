import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Home from '../page';
import * as replayApi from '../lib/subnettingReplayApi';
vi.mock('../lib/subnettingReplayApi', () => ({ isSubnettingReplayConfigured: vi.fn(() => true), loadSubnettingReplays: vi.fn(), saveSubnettingReplay: vi.fn(), resolveSubnettingReplay: vi.fn(), clearSubnettingReplays: vi.fn() }));
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

afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks()});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('ihk_access_hash', 'test-user-hash');
  vi.mocked(getUserByHash).mockResolvedValue({ id: 'user-1', access_hash: 'test-user-hash', created_at: '', last_login: null });
  vi.mocked(getAllProgress).mockResolvedValue([
    { module: 'subnetting', questions_attempted: 8, questions_correct: 6, streak_days: 1, last_session: null },
  ]);
  vi.mocked(updateProgress).mockResolvedValue(null);
  vi.mocked(replayApi.isSubnettingReplayConfigured).mockReturnValue(true);
  vi.mocked(replayApi.loadSubnettingReplays).mockResolvedValue({ generation: '11111111-1111-4111-8111-111111111111', records: [] });
},15000);



it('preserves a normal draft and disables its shortcuts during queue inspection', async () => {
 render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'});
 await chooseModule('subnetting');
 const inputs = screen.getAllByRole('textbox');
 for (const input of inputs) fireEvent.change(input,{target:{value:'1'}});
 fireEvent.click(screen.getByRole('button',{name:'Gespeicherte Subnetting-Fehler'}));
 expect(await screen.findByText(/Noch keine gespeicherten Fehler/)).toBeInTheDocument();
 fireEvent.keyDown(window,{key:'Enter'}); fireEvent.keyDown(window,{key:'n'});
 expect(updateProgress).not.toHaveBeenCalled(); expect(replayApi.saveSubnettingReplay).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Fehlerliste schließen'}));
 expect(screen.getAllByRole('textbox')[0]).toHaveValue('1');
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 await waitFor(()=>expect(updateProgress).toHaveBeenCalledTimes(1));
 expect(replayApi.saveSubnettingReplay).toHaveBeenCalledTimes(1);
},15000);

it('replays saved snapshots without progress writes and confirms AP2 departure', async () => {
 const {createSubnettingSnapshot} = await import('../lib/subnettingReplay');
 const {GENERATORS} = await import('../lib/generators/registry');
 const snapshot = createSubnettingSnapshot(GENERATORS.subnetting());
 const record = { id:'22222222-2222-4222-8222-222222222222', sourceAttemptId:'33333333-3333-4333-8333-333333333333', snapshot, createdAt:'2026-11-10T00:00:00Z', resolvedAt:null };
 vi.mocked(replayApi.loadSubnettingReplays).mockResolvedValue({generation:'11111111-1111-4111-8111-111111111111',records:[record]});
 vi.mocked(replayApi.resolveSubnettingReplay).mockResolvedValue({ status:'resolved', generation:'11111111-1111-4111-8111-111111111111', record:{...record, resolvedAt:'2026-11-10T01:00:00Z'} });
 render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'});
 await chooseModule('ap2TrainingRun');
 const draft=screen.getAllByRole('textbox')[0]; fireEvent.change(draft,{target:{value:'123'}});
 fireEvent.click(screen.getByRole('button',{name:'Gespeicherte Subnetting-Fehler'}));
 fireEvent.click(await screen.findByRole('button',{name:/Aufgabe wiederholen/}));
 expect(screen.getByText(/Trainingslauf verlassen\?/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Weiterarbeiten'}));
 fireEvent.click(screen.getByRole('button',{name:'Fehlerliste schließen'}));
 expect(draft).toHaveValue('123');
 fireEvent.click(screen.getByRole('button',{name:'Gespeicherte Subnetting-Fehler'}));
 fireEvent.click(await screen.findByRole('button',{name:/Aufgabe wiederholen/}));
 fireEvent.click(screen.getByRole('button',{name:'Trainingslauf verlassen'}));
 expect(screen.getByText('Wiederholung · ohne Wertung')).toBeInTheDocument();
 const fields=screen.getAllByRole('textbox');
 Object.values(snapshot.expectedAnswers).forEach((value,i)=>fireEvent.change(fields[i],{target:{value:String(value)}}));
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 await waitFor(()=>expect(replayApi.resolveSubnettingReplay).toHaveBeenCalledTimes(1));
 expect(updateProgress).not.toHaveBeenCalled(); expect(replayApi.saveSubnettingReplay).not.toHaveBeenCalled();
 await screen.findByRole('button',{name:/Erneut versuchen/});
 fireEvent.click(screen.getByRole('button',{name:/Erneut versuchen/}));
 expect(screen.getAllByRole('textbox')[0]).toHaveValue('');
 fireEvent.click(screen.getByRole('button',{name:'Zurück zur Fehlerliste'}));
 fireEvent.click(screen.getByRole('button',{name:'Zurück zur normalen Übung'}));
 expect(screen.queryByText('Wiederholung · ohne Wertung')).not.toBeInTheDocument();
 expect(screen.getAllByRole('textbox')[0]).toHaveValue('');
 expect(updateProgress).not.toHaveBeenCalled();
},20000);
it('does not bypass AP2 departure confirmation when returning from the list to normal practice', async () => {
 render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'}); await chooseModule('ap2TrainingRun');
 const draft=screen.getAllByRole('textbox')[0]; fireEvent.change(draft,{target:{value:'987'}});
 fireEvent.click(screen.getByRole('button',{name:'Gespeicherte Subnetting-Fehler'}));
 await screen.findByText(/Noch keine gespeicherten Fehler/);
 fireEvent.click(screen.getByRole('button',{name:'Zurück zur normalen Übung'}));
 expect(screen.getByText(/Trainingslauf verlassen\?/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Weiterarbeiten'}));
 fireEvent.click(screen.getByRole('button',{name:'Fehlerliste schließen'}));
 expect(draft).toHaveValue('987');
},15000);
it('moves focus into the queue and restores its entry on repeated open and close', async () => {
 render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'});
 const entry=screen.getByRole('button',{name:'Gespeicherte Subnetting-Fehler'});
 for(let i=0;i<2;i++) {
   fireEvent.click(entry); await screen.findByText(/Noch keine gespeicherten Fehler/);
   await waitFor(()=>expect(screen.getByRole('heading',{name:'Gespeicherte Subnetting-Fehler'})).toHaveFocus());
   fireEvent.click(screen.getByRole('button',{name:'Fehlerliste schließen'}));
   await waitFor(()=>expect(entry).toHaveFocus());
 }
},15000);
it.each(['Überspringen', 'Nächste Frage'])('restores entry focus and the draft after %s, then focuses a new question', async action => {
 render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'}); await chooseModule('subnetting');
 if (action === 'Nächste Frage') {
   for (const field of screen.getAllByRole('textbox')) fireEvent.change(field,{target:{value:'1'}});
   fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 }
 fireEvent.click(screen.getByRole('button',{name:action === 'Nächste Frage' ? /Nächste Frage/ : action}));
 const field=screen.getAllByRole('textbox')[0];
 await waitFor(()=>expect(field).toHaveFocus());
 fireEvent.change(field,{target:{value:'draft'}});
 const entry=screen.getByRole('button',{name:'Gespeicherte Subnetting-Fehler'});
 for (let i=0;i<2;i++) {
   fireEvent.click(entry); await screen.findByText(/Noch keine gespeicherten Fehler/);
   await waitFor(()=>expect(screen.getByRole('heading',{name:'Gespeicherte Subnetting-Fehler'})).toHaveFocus());
   fireEvent.click(screen.getByRole('button',{name:'Fehlerliste schließen'}));
   expect(field).toHaveValue('draft');
   await waitFor(()=>expect(entry).toHaveFocus());
 }
 fireEvent.click(screen.getByRole('button',{name:'Überspringen'}));
 await waitFor(()=>expect(screen.getAllByRole('textbox')[0]).toHaveFocus());
 expect(screen.getAllByRole('textbox')[0]).toHaveValue('');
},20000);
it('separately warns when progress returns null even if replay history saves', async () => {
 vi.mocked(replayApi.saveSubnettingReplay).mockImplementation(async (_hash,generation,sourceAttemptId,snapshot)=>({status:'saved',generation,record:{id:'22222222-2222-4222-8222-222222222222',sourceAttemptId,snapshot,createdAt:'2026-11-10T00:00:00Z',resolvedAt:null}}));
 render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'}); await chooseModule('subnetting');
 await waitFor(()=>expect(replayApi.loadSubnettingReplays).toHaveBeenCalled());
 for(const input of screen.getAllByRole('textbox')) fireEvent.change(input,{target:{value:'1'}});
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 await waitFor(()=>expect(replayApi.saveSubnettingReplay).toHaveBeenCalledTimes(1));
 expect(await screen.findByRole('alert')).toHaveTextContent('Speicherung des Fortschritts konnte nicht bestätigt werden');
},15000);
it('does not capture correct answers, skipped questions, or guest mistakes', async () => {
 const {GENERATORS}=await import('../lib/generators/registry'); const q=GENERATORS.subnetting();
 vi.spyOn(GENERATORS,'subnetting').mockReturnValue(q);
 const {unmount}=render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'}); await chooseModule('subnetting');
 Object.values(q.expectedAnswers).forEach((value,i)=>fireEvent.change(screen.getAllByRole('textbox')[i],{target:{value:String(value)}}));
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 expect(replayApi.saveSubnettingReplay).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:/Nächste Frage/})); fireEvent.click(screen.getByRole('button',{name:'Überspringen'}));
 expect(replayApi.saveSubnettingReplay).not.toHaveBeenCalled();
 unmount(); localStorage.clear(); render(<Home/>); await screen.findByRole('button',{name:'Anmelden'}); await chooseModule('subnetting');
 for(const field of screen.getAllByRole('textbox')) fireEvent.change(field,{target:{value:'1'}});
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 expect(replayApi.saveSubnettingReplay).not.toHaveBeenCalled();
},20000);
it('returns focus to the preserved AP2 heading when selecting it from the queue', async () => {
 render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'}); await chooseModule('ap2TrainingRun');
 fireEvent.click(screen.getByRole('button',{name:'Gespeicherte Subnetting-Fehler'})); await screen.findByText(/Noch keine gespeicherten Fehler/);
 await chooseModule('ap2TrainingRun');
 await waitFor(()=>expect(screen.getByRole('heading',{name:/AP2-Trainingslauf/})).toHaveFocus());
},15000);
it('keeps normal training and queue usable without randomUUID and saves with secure random bytes', async () => {
 vi.stubGlobal('crypto',{getRandomValues:(bytes:Uint8Array)=>{bytes.fill(7);return bytes;}});
 render(<Home/>); await screen.findByRole('button',{name:'Gezielt üben'}); await chooseModule('subnetting');
 fireEvent.click(screen.getByRole('button',{name:'Gespeicherte Subnetting-Fehler'})); await screen.findByText(/Noch keine gespeicherten Fehler/);
 fireEvent.click(screen.getByRole('button',{name:'Fehlerliste schließen'}));
 for(const field of screen.getAllByRole('textbox')) fireEvent.change(field,{target:{value:'1'}});
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 await waitFor(()=>expect(replayApi.saveSubnettingReplay).toHaveBeenCalledTimes(1));
 expect(vi.mocked(replayApi.saveSubnettingReplay).mock.calls[0][2]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
},15000);
