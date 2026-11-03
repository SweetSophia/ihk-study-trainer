import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import ThemeSelector from '../ThemeSelector';

beforeEach(()=>vi.restoreAllMocks());
function setup(authenticated=true,currentModule:string|null=null) {
 const onSelectModule=vi.fn();
 render(<ThemeSelector currentModule={currentModule} isAuthenticated={authenticated} onSelectModule={onSelectModule}/>);
 return onSelectModule;
}
it('shows exactly five topics and a separate run without the old wall of exercise buttons',()=>{
 const select=setup();
 expect(screen.getAllByRole('button',{expanded:false})).toHaveLength(6); // mobile switcher plus five groups
 expect(screen.getByRole('button',{name:/AP2-Trainingslauf/})).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Vorwärtskalkulation'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Wirtschaft & Projekt'}));
 expect(screen.getByRole('button',{name:'Vorwärtskalkulation'})).toBeInTheDocument();
 expect(select).not.toHaveBeenCalled();
});
it.each([false,true])('keeps SQL gated but AP2 database available, authenticated %s',auth=>{
 const select=setup(auth);
 fireEvent.click(screen.getByRole('button',{name:'Daten & Algorithmen'}));
 expect(screen.queryByRole('button',{name:'SQL'})).toBe(auth ? screen.getByRole('button',{name:'SQL'}):null);
 fireEvent.click(screen.getByRole('button',{name:/AP2 Datenbankentwurf & SQL/}));
 expect(select).toHaveBeenCalledWith('ap2DatabaseDesign');
});
it('opens the active topic and keeps its marker when browsing another topic',()=>{
 const select=setup(true,'handelskalkulationDifferenz');
 expect(screen.getByRole('button',{name:'Differenzkalkulation'})).toHaveAttribute('aria-current','page');
 fireEvent.click(screen.getByRole('button',{name:'Netzwerke'}));
 expect(screen.getByRole('button',{name:/^Wirtschaft & Projekt/})).toHaveTextContent('Aktiv');
 expect(screen.queryByRole('button',{name:'Differenzkalkulation'})).not.toBeInTheDocument();
 expect(select).not.toHaveBeenCalled();
});
it('uses one mobile tree, preserves selection while browsing, and restores focus on Escape',()=>{
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
 const select=setup(false);
 const toggle=screen.getByRole('button',{name:/Aufgabe wechseln/});
 expect(screen.queryByRole('button',{name:'Netzwerke'})).not.toBeInTheDocument();
 fireEvent.click(toggle);
 fireEvent.click(screen.getByRole('button',{name:'Netzwerke'}));
 const subnet=screen.getByRole('button',{name:'Subnetting'});subnet.focus();
 fireEvent.keyDown(subnet,{key:'Escape'});
 expect(toggle).toHaveFocus();
 expect(toggle).toHaveAttribute('aria-expanded','false');
 expect(select).not.toHaveBeenCalled();
 fireEvent.click(toggle);
 fireEvent.click(screen.getByRole('button',{name:'Subnetting'}));
 expect(select).toHaveBeenCalledTimes(1);
 expect(toggle).toHaveAttribute('aria-expanded','false');
 expect(within(screen.getByRole('navigation')).getAllByRole('button',{name:/Aufgabe wechseln/})).toHaveLength(1);
 vi.unstubAllGlobals();
});
it('restores breakpoint focus to the visible active group when its current exercise is collapsed',()=>{
 let desktop=false;let notify=()=>{};
 vi.stubGlobal('matchMedia',vi.fn(()=>({get matches(){return desktop},addEventListener:(_event:string,callback:()=>void)=>{notify=callback},removeEventListener:vi.fn()})));
 setup(false,'subnetting');
 const toggle=screen.getByRole('button',{name:/^Aufgabe wechseln/});fireEvent.click(toggle);
 const group=screen.getByRole('button',{name:/^Netzwerke/});fireEvent.click(group);fireEvent.click(toggle);toggle.focus();
 act(()=>{desktop=true;notify()});
 expect(group).toHaveFocus();
 vi.unstubAllGlobals();
});
