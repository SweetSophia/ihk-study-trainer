'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { ALL_MODULES, MODULE_NAMES, type ModuleId } from '../lib/modules';
import { getModuleTopic, MODULE_TOPICS } from '../lib/moduleTopics';

interface ThemeSelectorProps {
 currentModule:string|null;
 onSelectModule:(module:string)=>void;
 isAuthenticated:boolean;
 onDismiss?:()=>void;
}
const query='(min-width: 1024px)';
function subscribe(callback:()=>void) {
 const media=window.matchMedia?.(query);
 media?.addEventListener('change',callback);
 return ()=>media?.removeEventListener('change',callback);
}
function desktopSnapshot() { return window.matchMedia?.(query).matches??true; }

export function useDesktopNavigation() {return useSyncExternalStore(subscribe,desktopSnapshot,()=>false)}

/** Historical export name retained; this selects exercises, not appearance. */
export default function ThemeSelector({currentModule,onSelectModule,isAuthenticated,onDismiss}:ThemeSelectorProps) {
 const id=useId();
 const desktop=useDesktopNavigation();
 const previousDesktop=useRef(desktop);
 const [mobileOpen,setMobileOpen]=useState(false);
 const activeTopic=getModuleTopic(currentModule);
 const [browsing,setBrowsing]=useState<{module:string|null;group:string|null}>({module:currentModule,group:activeTopic?.id??null});
 // External selection (e.g. mistake practice) reveals the selected topic without an effect/reset.
 const openGroup=browsing.module===currentModule?browsing.group:activeTopic?.id??null;
 const root=useRef<HTMLElement>(null);
 const toggle=useRef<HTMLButtonElement>(null);
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(previousDesktop.current!==desktop) {
   const focused=document.activeElement;
   if(!desktop&&panel.current?.contains(focused)) toggle.current?.focus();
   if(desktop&&focused===toggle.current) {
    const current=panel.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const group=activeTopic?panel.current?.querySelector<HTMLElement>(`[aria-controls="${id}-${activeTopic.id}"]`):null;
    const target=current&&!current.closest('[hidden]')?current:group??panel.current?.querySelector<HTMLElement>('button');
    target?.focus();target?.scrollIntoView?.({block:'nearest'});
   }
   previousDesktop.current=desktop;
  }
 },[desktop,activeTopic,id]);
 function dismiss() {setMobileOpen(false);onDismiss?.();toggle.current?.focus();}
 function select(module:ModuleId) {onSelectModule(module);setMobileOpen(false);}
 const currentName=ALL_MODULES.find(module=>module.id===currentModule)?.name;
 return <nav ref={root} aria-label="Lernmodule" onKeyDown={event=>{
  if(event.key==='Escape'&&!desktop&&mobileOpen) {event.preventDefault();event.stopPropagation();dismiss();}
 }}>
  <button ref={toggle} type="button" aria-expanded={mobileOpen} aria-controls={`${id}-topics`} onClick={()=>mobileOpen?dismiss():setMobileOpen(true)} className="lg:hidden w-full rounded-xl border border-line bg-surface p-4 text-left min-h-11">
   <span className="flex items-center justify-between gap-2 font-semibold">Aufgabe wechseln <ChevronDown aria-hidden="true" className={`size-4 shrink-0 transition-transform ${mobileOpen?'rotate-180':''}`}/></span>
   <span className="mt-1 block text-sm text-muted">{currentName?`${activeTopic?`${activeTopic.label} · `:''}${currentName}`:'Thema und Aufgabe wählen'}</span>
  </button>
  <div ref={panel} id={`${id}-topics`} hidden={!desktop&&!mobileOpen} className="navigation-panel mt-2 lg:mt-0">
   <button type="button" onClick={()=>select('ap2TrainingRun')} aria-current={currentModule==='ap2TrainingRun'?'page':undefined} className={`mb-4 flex min-h-11 w-full items-center gap-3 rounded-xl border p-3 text-left font-semibold ${currentModule==='ap2TrainingRun'?'bg-accent-soft border-accent text-accent':'bg-surface border-line text-ink hover:bg-subtle'}`}>
    <Layers aria-hidden="true" className="size-5 shrink-0"/><span>AP2-Trainingslauf<span className="block text-xs font-normal text-muted">Drei Szenarien verbinden</span></span>
   </button>
   <ul className="space-y-2">
    {MODULE_TOPICS.map(topic=><li key={topic.id}>
     <button type="button" aria-expanded={openGroup===topic.id} aria-controls={`${id}-${topic.id}`} onClick={()=>setBrowsing({module:currentModule,group:openGroup===topic.id?null:topic.id})} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-subtle">
      <span className="min-w-0 flex-1">{topic.label}</span>{activeTopic?.id===topic.id&&<span className="text-xs font-normal text-accent">Aktiv</span>}<ChevronDown aria-hidden="true" className={`size-4 shrink-0 ${openGroup===topic.id?'rotate-180':''}`}/>
     </button>
     <ul id={`${id}-${topic.id}`} hidden={openGroup!==topic.id} className="mt-1 space-y-1 border-l border-line pl-2 ml-3">
      {topic.modules.filter(module=>module!=='sql'||isAuthenticated).map(module=>{
       const descriptor=ALL_MODULES.find(item=>item.id===module)!;
       const Icon=descriptor.icon;
       return <li key={module}><button type="button" aria-current={currentModule===module?'page':undefined} onClick={()=>select(module)} className={`flex min-h-11 w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm ${currentModule===module?'bg-accent-soft text-accent font-semibold':'text-muted hover:bg-subtle hover:text-ink'}`}>
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0"/><span className="min-w-0 flex-1">{MODULE_NAMES[module]}</span>{module.startsWith('ap2')&&<span aria-hidden="true" className="rounded bg-accent-soft px-1 text-[10px] text-accent">AP2</span>}
       </button></li>;
      })}
     </ul>
    </li>)}
   </ul>
  </div>
 </nav>;
}
