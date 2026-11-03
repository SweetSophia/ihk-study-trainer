'use client';
import { useEffect, useRef, type RefObject } from 'react';

/** Remember focus before a responsive CSS rule hides its control. Body focus
 * caused by hiding is not a new destination; an outside click/focus is. */
export function useLastFocusWithin(root:RefObject<HTMLElement|null>) {
 const last=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  const remember=(event:FocusEvent)=>{
   const target=event.target;
   if(!(target instanceof HTMLElement)||target===document.body||target===document.documentElement) return;
   last.current=root.current?.contains(target)?target:null;
  };
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))last.current=null};
  const initial=document.activeElement;
  if(initial instanceof HTMLElement&&root.current?.contains(initial))last.current=initial;
  document.addEventListener('focusin',remember);
  document.addEventListener('pointerdown',outside,true);
  return ()=>{document.removeEventListener('focusin',remember);document.removeEventListener('pointerdown',outside,true)};
 },[root]);
 return last;
}
