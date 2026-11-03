'use client';
import { useEffect, useId, useSyncExternalStore } from 'react';
import { APPEARANCE_EVENT, APPEARANCE_KEY, applyAppearance, readAppearance, type AppearancePreference } from '../lib/appearance';
function snapshot():AppearancePreference {
 const value=document.documentElement.dataset.appearancePreference;
 return value==='light'||value==='dark'||value==='system'?value:readAppearance();
}
function subscribe(callback:()=>void) {
 window.addEventListener(APPEARANCE_EVENT,callback);
 return ()=>window.removeEventListener(APPEARANCE_EVENT,callback);
}
export default function AppearanceSelector() {
 const id=useId();
 const preference=useSyncExternalStore(subscribe,snapshot,()=>'system' as const);
 useEffect(()=>{
  applyAppearance(preference);
  const media=window.matchMedia?.('(prefers-color-scheme: dark)');
  const update=()=>{if(preference==='system') applyAppearance(preference)};
  media?.addEventListener('change',update);
  return ()=>media?.removeEventListener('change',update);
 },[preference]);
 return <div className="flex items-center gap-2 text-sm text-muted">
  <label htmlFor={id} className="sr-only sm:not-sr-only">Darstellung</label>
  <select id={id} value={preference} onChange={event=>{
   const next=event.target.value as AppearancePreference;
   applyAppearance(next);
   try {localStorage.setItem(APPEARANCE_KEY,next)} catch {/* session selection remains usable */}
   window.dispatchEvent(new Event(APPEARANCE_EVENT));
  }} className="min-h-11 rounded-lg border border-control bg-surface px-2 text-ink">
   <option value="system">System</option><option value="light">Hell</option><option value="dark">Dunkel</option>
  </select>
 </div>;
}
