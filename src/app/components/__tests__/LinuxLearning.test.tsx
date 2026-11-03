import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLayoutEffect } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import StudyCard from '../StudyCard';
import { COMMAND_DATABASE } from '../../lib/generators/linux';
import { GENERATORS } from '../../lib/generators/registry';
import { validateQuestionAnswers } from '../../lib/answerValidation';
import type { Question } from '../../types';
vi.mock('canvas-confetti',()=>({default:vi.fn()}));
beforeEach(()=>{localStorage.clear();sessionStorage.clear()});
afterEach(()=>vi.restoreAllMocks());
function fixture(command:string,id=command):Question{
 const index=COMMAND_DATABASE.findIndex(entry=>entry.command===command);
 vi.spyOn(Math,'random').mockReturnValue(0.25).mockReturnValueOnce(index/COMMAND_DATABASE.length).mockReturnValueOnce(0);
 return {...GENERATORS.linux(),id};
}
function checkWith(question:Question){return vi.fn((answers:Record<string,string>)=>validateQuestionAnswers(question,answers))}
function submit(answer:string){const input=screen.getByRole('textbox',{name:'Linux-Befehl eingeben'});fireEvent.change(input,{target:{value:answer}});fireEvent.keyDown(input,{key:'Enter'});return input}

describe('real Linux teaching feedback',()=>{
 it('announces an accepted alternative once and distinguishes the canonical example explanation',()=>{
  const question=fixture('nslookup'),check=checkWith(question);
  render(<StudyCard question={question} onCheckAnswer={check} onNextQuestion={()=>{}}/>);
  const status=screen.getByRole('status',{name:'Linux-Antwort'});expect(status).toBeEmptyDOMElement();
  const input=submit('host');
  expect(check).toHaveBeenCalledExactlyOnceWith({answer:'host'});
  expect(status).toHaveTextContent('Richtig');expect(status).toHaveTextContent('nslookup');expect(status).toHaveTextContent('dig');expect(status).toHaveTextContent('host');
  expect(within(status).getByText(/Erklärung zum Beispiel/)).toHaveTextContent('nslookup');
  expect(status).toHaveTextContent('Vorwärts- und Rückwärtsauflösung');
  expect(screen.getAllByRole('status')).toHaveLength(1);
  fireEvent.keyDown(input,{key:'Enter'});expect(check).toHaveBeenCalledTimes(1);
 });
 it('shows curated alternatives and capability explanation without claiming a single uniquely correct command',()=>{
  const question=fixture('who'),check=checkWith(question);
  render(<StudyCard question={question} onCheckAnswer={check} onNextQuestion={()=>{}}/>);
  submit('whoami');const status=screen.getByRole('status',{name:'Linux-Antwort'});
  expect(check).toHaveReturnedWith(false);expect(status).toHaveTextContent('nicht akzeptiert');
  for(const name of ['who','users','w'])expect(within(status).getByText(name,{selector:'code'})).toBeInTheDocument();
  expect(status).toHaveTextContent('angemeldeten Benutzer');expect(status).not.toHaveTextContent('Der richtige Befehl lautet');
 });
 it('rejects extra arguments, explains the recognition boundary and resets feedback for a replacement question',()=>{
  const first=fixture('ls'),second=fixture('nslookup'),check=checkWith(first);
  const {rerender}=render(<StudyCard question={first} onCheckAnswer={check} onNextQuestion={()=>{}}/>);
  submit('ls --unexpected');const status=screen.getByRole('status',{name:'Linux-Antwort'});
  expect(check).toHaveReturnedWith(false);expect(status).toHaveTextContent('keine vollständigen Kommandozeilen');
  rerender(<StudyCard question={second} onCheckAnswer={checkWith(second)} onNextQuestion={()=>{}}/>);
  expect(screen.getByRole('textbox',{name:'Linux-Befehl eingeben'})).toHaveValue('');
  expect(screen.getByRole('status',{name:'Linux-Antwort'})).toBeEmptyDOMElement();
  expect(screen.queryByText('Erklärung zum Beispiel ls:')).not.toBeInTheDocument();
 });
 it('associates recognition instructions and checks only once via the regular check button',()=>{
  const question=fixture('systemctl enable'),check=checkWith(question),next=vi.fn();
  render(<StudyCard question={question} onCheckAnswer={check} onNextQuestion={next}/>);
  const input=screen.getByRole('textbox',{name:'Linux-Befehl eingeben'});
  expect(input).toHaveAccessibleDescription(/Befehl \+ Unterbefehl/);expect(input).toHaveAccessibleDescription(/nichts ausgeführt/);
  fireEvent.change(input,{target:{value:' SYSTEMCTL\t enable '}});
  const button=screen.getByRole('button',{name:/Antwort prüfen/});fireEvent.click(button);fireEvent.click(button);
  expect(check).toHaveBeenCalledTimes(1);expect(check).toHaveReturnedWith(true);
  // The reused button becomes Next after the first click: the second advances, never regrades.
  expect(next).toHaveBeenCalledTimes(1);expect(screen.getByRole('status',{name:'Linux-Antwort'})).toBeEmptyDOMElement();
 });
});

it('never paints a previous verdict with the replacement question explanation',()=>{
 const first=fixture('who'),second=fixture('ls','fresh-linux');const painted:string[]=[];
 function Observe({question}:{question:Question}){
  useLayoutEffect(()=>{if(question.id==='fresh-linux')painted.push(screen.getByRole('status',{name:'Linux-Antwort'}).textContent??'')},[question.id]);
  return <StudyCard question={question} onCheckAnswer={checkWith(question)} onNextQuestion={()=>{}}/>;
 }
 const {rerender}=render(<Observe question={first}/>);submit('wrong');rerender(<Observe question={second}/>);
 expect(painted.length).toBeGreaterThan(0);expect(painted.every(text=>text==='')).toBe(true);
});
