import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import SubnettingReplay from '../SubnettingReplay';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { createSubnettingSnapshot } from '../../lib/subnettingReplay';
import { GENERATORS } from '../../lib/generators/registry';

it('opens the exact saved question blank, latches reveal, and retries the same record', () => {
  const snapshot = createSubnettingSnapshot(GENERATORS.subnetting());
  const record = { id: 'record', sourceAttemptId: 'attempt', snapshot, createdAt: '2026-11-10T00:00:00Z', resolvedAt: null };
  const resolve = vi.fn();
  render(<SubnettingReplay records={[record]} status="ready" message={null} onRefresh={vi.fn()} onClear={vi.fn()} onResolve={resolve} onStart={fn => fn()} onReturn={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Aufgabe wiederholen/ }));
  expect(screen.getByText((text) => text.includes(`Gegeben: IP-Adresse ${snapshot.ip}/${snapshot.cidr}`))).toBeInTheDocument();
  for (const input of screen.getAllByRole('textbox')) expect(input).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Lösung anzeigen' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lösung ausblenden' }));
  const inputs = screen.getAllByRole('textbox');
  Object.values(snapshot.expectedAnswers).forEach((value, i) => fireEvent.change(inputs[i], { target: { value: String(value) } }));
  fireEvent.click(screen.getByRole('button', { name: /Antwort prüfen/ }));
  expect(screen.getByText(/mit Lösungshilfe/)).toBeInTheDocument();
  expect(resolve).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /Erneut versuchen/ }));
  expect(screen.getByText((text) => text.includes(`Gegeben: IP-Adresse ${snapshot.ip}/${snapshot.cidr}`))).toBeInTheDocument();
  for (const input of screen.getAllByRole('textbox')) expect(input).toHaveValue('');
  Object.values(snapshot.expectedAnswers).forEach((value, i) => fireEvent.change(screen.getAllByRole('textbox')[i], { target: { value: String(value) } }));
  fireEvent.click(screen.getByRole('button', { name: /Antwort prüfen/ }));
  expect(resolve).toHaveBeenCalledWith(record.id);
});

it('explains empty history and requires confirmation before clearing', () => {
  const clear = vi.fn();
  render(<SubnettingReplay records={[]} status="ready" message={null} onRefresh={vi.fn()} onClear={clear} onResolve={vi.fn()} onStart={fn => fn()} onReturn={vi.fn()} />);
  expect(screen.getByText(/Noch keine gespeicherten Fehler/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Gespeicherte Fehler löschen' }));
  expect(screen.getByRole('button', { name: 'Abbrechen' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
  expect(clear).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Gespeicherte Fehler löschen' }));
  fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));
  expect(clear).toHaveBeenCalledTimes(1);
});
it('disables replay shortcuts while a refresh is pending', () => {
 const snapshot=createSubnettingSnapshot(GENERATORS.subnetting());
 const record={id:'r',sourceAttemptId:'s',snapshot,createdAt:'2026-11-10T00:00:00Z',resolvedAt:null};
 const resolve=vi.fn(); const props={records:[record],message:null,onRefresh:vi.fn(),onClear:vi.fn(),onResolve:resolve,onStart:(fn:()=>void)=>fn(),onReturn:vi.fn()};
 const {rerender}=render(<SubnettingReplay {...props} status="ready"/>);
 fireEvent.click(screen.getByRole('button',{name:/Aufgabe wiederholen/}));
 Object.values(snapshot.expectedAnswers).forEach((value,i)=>fireEvent.change(screen.getAllByRole('textbox')[i],{target:{value:String(value)}}));
 rerender(<SubnettingReplay {...props} status="loading"/>);
 fireEvent.keyDown(window,{key:'Enter'});
 expect(resolve).not.toHaveBeenCalled();
});
it('groups resolved records and keeps wrong retries local to the session', () => {
 const snapshot=createSubnettingSnapshot(GENERATORS.subnetting());
 const base={sourceAttemptId:'s',snapshot,createdAt:'2026-11-10T00:00:00Z'};
 const records=[{...base,id:'a',resolvedAt:null},{...base,id:'b',resolvedAt:'2026-11-10T01:00:00Z'}]; const resolve=vi.fn();
 render(<SubnettingReplay records={records} status="ready" message={null} onRefresh={vi.fn()} onClear={vi.fn()} onResolve={resolve} onStart={fn=>fn()} onReturn={vi.fn()}/>);
 expect(screen.getByRole('heading',{name:'Noch nicht selbstständig gelöst'})).toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'In einer Wiederholung gelöst'})).toBeInTheDocument();
 fireEvent.click(screen.getAllByRole('button',{name:/Aufgabe wiederholen/})[0]);
 expect(screen.queryByRole('button',{name:'Überspringen'})).not.toBeInTheDocument();
 for(const field of screen.getAllByRole('textbox')) fireEvent.change(field,{target:{value:'1'}});
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/}));
 expect(screen.getByText(/Noch nicht richtig/)).toBeInTheDocument(); expect(resolve).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:/Erneut versuchen/}));
 expect(screen.getAllByRole('textbox')[0]).toHaveValue(''); expect(resolve).not.toHaveBeenCalled();
});
it('does not resolve an already resolved record again', () => {
 const snapshot=createSubnettingSnapshot(GENERATORS.subnetting()); const resolve=vi.fn();
 const record={id:'solved',sourceAttemptId:'s',snapshot,createdAt:'2026-11-10T00:00:00Z',resolvedAt:'2026-11-10T01:00:00Z'};
 render(<SubnettingReplay records={[record]} status="ready" message={null} onRefresh={vi.fn()} onClear={vi.fn()} onResolve={resolve} onStart={fn=>fn()} onReturn={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:/Aufgabe wiederholen/}));
 Object.values(snapshot.expectedAnswers).forEach((value,i)=>fireEvent.change(screen.getAllByRole('textbox')[i],{target:{value:String(value)}}));
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/})); expect(screen.getByText(/Richtig ohne/)).toBeInTheDocument(); expect(resolve).not.toHaveBeenCalled();
});
it('distinguishes identical snapshots and returns focus to the moved record or heading', () => {
 const snapshot=createSubnettingSnapshot(GENERATORS.subnetting()); const base={sourceAttemptId:'s',snapshot,createdAt:'2026-11-10T00:00:00Z'};
 const a={...base,id:'a',resolvedAt:null}, b={...base,id:'b',resolvedAt:'2026-11-10T01:00:00Z'};
 const props={message:null,onRefresh:vi.fn(),onClear:vi.fn(),onResolve:vi.fn(),onStart:(fn:()=>void)=>fn(),onReturn:vi.fn()};
 const {rerender}=render(<SubnettingReplay {...props} records={[a,b]} status="ready"/>);
 const buttons=screen.getAllByRole('button',{name:/Aufgabe wiederholen/}); expect(buttons[0].textContent).not.toBe(buttons[1].textContent);
 fireEvent.click(buttons[0]); rerender(<SubnettingReplay {...props} records={[{...a,resolvedAt:b.resolvedAt},b]} status="ready"/>);
 fireEvent.click(screen.getByRole('button',{name:'Zurück zur Fehlerliste'})); expect(screen.getAllByRole('button',{name:/Aufgabe wiederholen/})[0]).toHaveFocus();
 fireEvent.click(screen.getAllByRole('button',{name:/Aufgabe wiederholen/})[0]); rerender(<SubnettingReplay {...props} records={[b]} status="ready"/>);
 expect(screen.getByText(/nicht mehr verfügbar/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Zurück zur Fehlerliste'}));
 expect(screen.getByRole('heading',{name:'Gespeicherte Subnetting-Fehler'})).toHaveFocus();
});
it('focuses a visible heading on loading and distinguishes unavailable from removal', () => {
 const snapshot=createSubnettingSnapshot(GENERATORS.subnetting()); const record={id:'a',sourceAttemptId:'s',snapshot,createdAt:'2026-11-10T00:00:00Z',resolvedAt:null};
 const props={message:null,onRefresh:vi.fn(),onClear:vi.fn(),onResolve:vi.fn(),onStart:(fn:()=>void)=>fn(),onReturn:vi.fn()};
 const {rerender}=render(<SubnettingReplay {...props} records={[record]} status="ready"/>); fireEvent.click(screen.getByRole('button',{name:/Aufgabe wiederholen/}));
 screen.getAllByRole('textbox')[0].focus(); rerender(<SubnettingReplay {...props} records={[record]} status="loading"/>);
 expect(screen.getByRole('heading',{name:'Gespeicherte Subnetting-Fehler'})).toHaveFocus(); fireEvent.keyDown(window,{key:'Enter'}); fireEvent.keyDown(window,{key:'n'}); expect(props.onResolve).not.toHaveBeenCalled();
 rerender(<SubnettingReplay {...props} records={[]} status="unavailable"/>); expect(screen.queryByText(/nicht mehr verfügbar/)).not.toBeInTheDocument();
 rerender(<SubnettingReplay {...props} records={[record]} status="ready"/>); expect(screen.getAllByRole('textbox')).toHaveLength(6);
 rerender(<SubnettingReplay {...props} records={[]} status="ready"/>); expect(screen.getByText(/nicht mehr verfügbar/)).toBeInTheDocument(); expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

it('selects the correct ID for identical snapshots in different groups', () => {
 const snapshot=createSubnettingSnapshot(GENERATORS.subnetting()); const base={sourceAttemptId:'s',snapshot,createdAt:'2026-11-10T00:00:00Z'};
 const records=[{...base,id:'open-id',resolvedAt:null},{...base,id:'solved-id',resolvedAt:'2026-11-10T01:00:00Z'}]; const resolve=vi.fn();
 render(<SubnettingReplay records={records} status="ready" message={null} onRefresh={vi.fn()} onClear={vi.fn()} onResolve={resolve} onStart={fn=>fn()} onReturn={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:/Aufgabe wiederholen offen/}));
 Object.values(snapshot.expectedAnswers).forEach((value,i)=>fireEvent.change(screen.getAllByRole('textbox')[i],{target:{value:String(value)}}));
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/})); expect(resolve).toHaveBeenCalledExactlyOnceWith('open-id');
 fireEvent.click(screen.getByRole('button',{name:'Zurück zur Fehlerliste'})); fireEvent.click(screen.getByRole('button',{name:/Aufgabe wiederholen gelöst/}));
 Object.values(snapshot.expectedAnswers).forEach((value,i)=>fireEvent.change(screen.getAllByRole('textbox')[i],{target:{value:String(value)}}));
 fireEvent.click(screen.getByRole('button',{name:/Antwort prüfen/})); expect(screen.getByText(/Richtig ohne/)).toBeInTheDocument(); expect(resolve).toHaveBeenCalledTimes(1);
});
