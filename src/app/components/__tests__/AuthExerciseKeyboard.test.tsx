import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StudyCard from '../StudyCard';
import AuthModal from '../AuthModal';
import type { Question } from '../../types';
vi.mock('canvas-confetti',()=>({default:vi.fn()}));

it('keeps Enter in the real account dialog separate from an answered exercise',()=>{
 const question:Question={id:'auth-keyboard',module:'binary',theme:'Zahlensysteme',questionText:'Wandle 11 in Dezimal um.',expectedAnswers:{decimal:'3'},solutionSteps:['11₂ = 3₁₀'],difficulty:'easy'};
 const check=vi.fn(()=>true);const login=vi.fn(async()=>({success:false}));
 const view=(open:boolean)=><><StudyCard question={question} onCheckAnswer={check} onNextQuestion={()=>{}}/><AuthModal isOpen={open} onClose={()=>{}} onLogin={login} onRegister={async()=>null}/></>;
 const {rerender}=render(view(false));
 const answer=screen.getByRole('textbox');fireEvent.change(answer,{target:{value:'3'}});
 rerender(view(true));fireEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));
 const code=screen.getByLabelText(/^Zugangscode/);fireEvent.change(code,{target:{value:'test'}});fireEvent.keyDown(code,{key:'Enter'});
 expect(check).not.toHaveBeenCalled();expect(login).not.toHaveBeenCalled();expect(answer).toBeEnabled();
 rerender(view(false));fireEvent.keyDown(answer,{key:'Enter'});
 expect(check).toHaveBeenCalledExactlyOnceWith({decimal:'3'});
});
it('allows Escape to close the account dialog without starting a backend request',()=>{
 const close=vi.fn(),login=vi.fn(async()=>({success:false})),register=vi.fn(async()=>null);
 render(<AuthModal isOpen onClose={close} onLogin={login} onRegister={register}/>);
 fireEvent.click(screen.getByRole('button',{name:/Ich habe einen Code/}));
 fireEvent.keyDown(screen.getByLabelText(/^Zugangscode/),{key:'Escape'});
 expect(close).toHaveBeenCalledTimes(1);expect(login).not.toHaveBeenCalled();expect(register).not.toHaveBeenCalled();
});
it('places and contains focus on opening so Escape works immediately and returns to its trigger',()=>{
 const close=vi.fn();
 const view=(open:boolean)=><><button>Kontodialog öffnen</button><AuthModal isOpen={open} onClose={close} onLogin={async()=>({success:false})} onRegister={async()=>null}/></>;
 const {rerender}=render(view(false));const trigger=screen.getByRole('button',{name:'Kontodialog öffnen'});trigger.focus();
 rerender(view(true));const dismiss=screen.getByRole('button',{name:'Schließen'});expect(dismiss).toHaveFocus();
 trigger.focus();expect(dismiss).toHaveFocus();
 fireEvent.keyDown(dismiss,{key:'Tab',shiftKey:true});const login=screen.getByRole('button',{name:/Ich habe einen Code/});expect(login).toHaveFocus();
 fireEvent.keyDown(login,{key:'Tab'});expect(dismiss).toHaveFocus();
 login.focus();fireEvent.click(login);expect(screen.getByLabelText(/^Zugangscode/)).toHaveFocus();
 fireEvent.keyDown(screen.getByLabelText(/^Zugangscode/),{key:'Escape'});expect(close).toHaveBeenCalledTimes(1);
 rerender(view(false));expect(trigger).toHaveFocus();
});
