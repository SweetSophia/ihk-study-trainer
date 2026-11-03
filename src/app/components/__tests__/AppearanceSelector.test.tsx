import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AppearanceSelector from '../AppearanceSelector';
import { APPEARANCE_BOOTSTRAP, APPEARANCE_KEY } from '../../lib/appearance';
let dark=false;
let changed:()=>void;
beforeEach(()=>{
 localStorage.clear();delete document.documentElement.dataset.theme;delete document.documentElement.dataset.appearancePreference;
 vi.stubGlobal('matchMedia',vi.fn(()=>({get matches(){return dark},addEventListener:(_name:string,callback:()=>void)=>{changed=callback},removeEventListener:vi.fn()})));
 dark=false;
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()});
it('resolves system changes but retains an explicit preference and focus',()=>{
 render(<AppearanceSelector/>);
 const select=screen.getByRole('combobox',{name:'Darstellung'});select.focus();
 expect(select).toHaveValue('system');expect(document.documentElement.dataset.theme).toBe('light');
 dark=true;act(()=>changed());expect(document.documentElement.dataset.theme).toBe('dark');
 fireEvent.change(select,{target:{value:'light'}});
 expect(localStorage.getItem(APPEARANCE_KEY)).toBe('light');expect(select).toHaveFocus();
 act(()=>changed());expect(document.documentElement.dataset.theme).toBe('light');
});
it('restores a saved choice before hydration and the selector reflects it',()=>{
 localStorage.setItem(APPEARANCE_KEY,'dark');
 new Function(APPEARANCE_BOOTSTRAP)();
 expect(document.documentElement.dataset.theme).toBe('dark');
 render(<AppearanceSelector/>);expect(screen.getByRole('combobox',{name:'Darstellung'})).toHaveValue('dark');
});
it('defaults an invalid value to system without changing other storage',()=>{
 localStorage.setItem(APPEARANCE_KEY,'bad');localStorage.setItem('ihk_progress','retained');dark=true;
 new Function(APPEARANCE_BOOTSTRAP)();render(<AppearanceSelector/>);
 expect(screen.getByRole('combobox',{name:'Darstellung'})).toHaveValue('system');
 expect(document.documentElement.dataset.theme).toBe('dark');expect(localStorage.getItem('ihk_progress')).toBe('retained');
});
it('keeps an in-session preference when storage reads and writes throw',()=>{
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked')});
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked')});
 new Function(APPEARANCE_BOOTSTRAP)();render(<AppearanceSelector/>);
 const select=screen.getByRole('combobox',{name:'Darstellung'});
 fireEvent.change(select,{target:{value:'dark'}});
 expect(select).toHaveValue('dark');expect(document.documentElement.style.colorScheme).toBe('dark');
 act(()=>changed());expect(select).toHaveValue('dark');
});
