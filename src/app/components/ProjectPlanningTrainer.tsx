'use client';

import { useRef, useState } from 'react';
import { ACTIVITIES, FIELDS, calculateSchedule, validateProjectAnswers, type ProjectAnswers } from '../lib/projectPlanning';

const inputClass='w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 p-2 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const buttonClass='rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const emptyAnswers=():ProjectAnswers=>({rows:{},duration:'',critical:[]});
type Props={isAuthenticated:boolean;onAttempt:(correct:boolean)=>void};
function ScheduleSection({changed,isAuthenticated,onAttempt}:Props&{changed:boolean}){
 const title=changed?'Änderung':'Basisplan';const prefix=changed?'project-change':'project-base';
 const [answers,setAnswers]=useState(emptyAnswers);const [result,setResult]=useState<ReturnType<typeof validateProjectAnswers>|null>(null);
 const [example,setExample]=useState(false);const attempted=useRef(false);const revealed=useRef(false);
 function edit(next:ProjectAnswers){setAnswers(next);setResult(null);}
 function numberInput(key:string,label:string,value:string,onChange:(v:string)=>void){
  const error=result?.errors[key];const id=`${prefix}-${key}`;
  return <div key={key}><label htmlFor={id} className="block text-sm text-slate-300">{label}</label><input id={id} aria-label={`${title}: ${label}`} inputMode="numeric" className={inputClass} value={value} onChange={e=>onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error?`${id}-error`:undefined}/>{error&&<p id={`${id}-error`} className="text-sm text-rose-200">{error}</p>}</div>;
 }
 const solution=calculateSchedule(ACTIVITIES.map(a=>changed&&a.id==='C'?{...a,duration:5}:a));
 return <section aria-labelledby={`${prefix}-title`} className="space-y-4 rounded-lg border border-slate-700 p-4">
  <h3 id={`${prefix}-title`} className="text-lg font-semibold">{changed?'2. Änderung: C dauert jetzt 5 Arbeitstage':'1. Basisplan berechnen'}</h3>
  {changed&&<p>Alle anderen Dauern und Abhängigkeiten bleiben gleich. Bestimme die neue Projektdauer und alle kritischen Vorgänge.</p>}
  <form noValidate className="space-y-4" onSubmit={e=>{e.preventDefault();const next=validateProjectAnswers(answers,changed);setResult(next);if(!attempted.current){attempted.current=true;if(isAuthenticated&&!revealed.current) onAttempt(next.valid);}}}>
   {!changed&&ACTIVITIES.map(a=><fieldset key={a.id} className="rounded border border-slate-700 p-3"><legend>{a.id}: {a.label}</legend><div className="grid gap-3 sm:grid-cols-5">{(Object.keys(FIELDS) as (keyof typeof FIELDS)[]).map(key=>numberInput(`${a.id}.${key}`,`${a.id} ${FIELDS[key]}`,answers.rows[a.id]?.[key]??'',value=>edit({...answers,rows:{...answers.rows,[a.id]:{...answers.rows[a.id],[key]:value}}})))}</div></fieldset>)}
   {numberInput('duration','Projektdauer',answers.duration,value=>edit({...answers,duration:value}))}
   <fieldset aria-describedby={result?.errors.critical?`${prefix}-critical-error`:undefined}><legend>Alle kritischen Vorgänge (Gesamtpuffer 0)</legend><div className="flex flex-wrap gap-4">{ACTIVITIES.map(a=><label key={a.id} className="flex items-center gap-2"><input type="checkbox" aria-label={`${title}: ${a.id} kritisch`} checked={answers.critical.includes(a.id)} aria-invalid={!!result?.errors.critical} aria-describedby={result?.errors.critical?`${prefix}-critical-error`:undefined} onChange={e=>edit({...answers,critical:e.target.checked?[...answers.critical,a.id]:answers.critical.filter(id=>id!==a.id)})}/>{a.id}</label>)}</div>{result?.errors.critical&&<p id={`${prefix}-critical-error`} className="text-sm text-rose-200">{result.errors.critical}</p>}</fieldset>
   <p role="status" className={result?(result.valid?'text-emerald-200':'text-rose-200'):'text-slate-400'}>{result?`${title}: ${result.valid?'Korrekt für das vorgegebene Modell.':'Bitte die markierten Eingaben prüfen.'}`:'Noch keine aktuelle Prüfung.'}</p>
   <div className="flex flex-wrap gap-3"><button type="submit" className={buttonClass}>{title} prüfen</button><button type="button" className={buttonClass} aria-expanded={example} aria-controls={`${prefix}-solution`} onClick={()=>{revealed.current=true;setExample(!example);}}>{title}: Lösung {example?'verbergen':'anzeigen'}</button></div>
   {example&&<div id={`${prefix}-solution`} className="space-y-2 text-sm text-slate-300"><p>Lösung für diese festen Annahmen: {solution.duration} Arbeitstage; kritisch: {solution.critical.join(', ')}.</p>{!changed&&ACTIVITIES.map(a=><p key={a.id}>{a.id}: {(Object.keys(FIELDS) as (keyof typeof FIELDS)[]).map(key=>`${FIELDS[key]} ${solution.rows[a.id][key]}`).join(' · ')}</p>)}<p>{changed?'Die zusätzlichen zwei Tage bei C verbrauchen einen Tag Puffer und verlängern das Projekt um einen Tag.':'Vorwärts: FAZ = größtes FEZ der Vorgänger; FEZ = FAZ + Dauer. Rückwärts: SEZ = kleinstes SAZ der Nachfolger (am Ende Projektdauer); SAZ = SEZ − Dauer. Gesamtpuffer = SAZ − FAZ.'}</p></div>}
  </form>
 </section>;
}
const RUBRIC=[
 'Ich definiere messbare Wiederherstellungsziele: ausgewählte Daten, Integrität und benötigte Zeit sowie dokumentierte Testergebnisse.',
 'Ich benenne eine verantwortliche Person oder Rolle, die die Ergebnisse anhand der vereinbarten Kriterien abnimmt.',
 'Bei fehlgeschlagenem Test plane ich Fehleranalyse, Korrektur und erneuten Test vor Freigabe; Terminfolgen werden abgestimmt.',
];
export default function ProjectPlanningTrainer(props:Props){
 const [run,setRun]=useState(0);const [reasoning,setReasoning]=useState('');const [ticks,setTicks]=useState<boolean[]>(RUBRIC.map(()=>false));const [example,setExample]=useState(false);
 return <section aria-labelledby="project-title" className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-200 sm:p-6">
  <h2 id="project-title" className="text-xl font-bold">AP2 Projektplanung</h2>
  <p>Eigene Übungsaufgabe · Schwerpunkt Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
  <p>Ein fiktiver Handwerksbetrieb führt ein zentrales Backup-System ein. Plane die Einführung und die Abnahme der Wiederherstellung.</p>
  <p>Startzeitpunkt 0; alle Dauern in ganzen Arbeitstagen. Ende-Anfang-Beziehungen: Ein Vorgang beginnt frühestens nach dem Ende aller Vorgänger. Parallele Arbeit ist erlaubt. Ressourcen und Kalender werden nicht berücksichtigt. Zeitpunkt 2 bedeutet zwei verstrichene Arbeitstage, keine inklusive Tageszählung.</p>
  <ul className="space-y-1">{ACTIVITIES.map(a=><li key={a.id}>{a.id}: {a.label} · {a.duration} Arbeitstage · Vorgänger: {a.predecessors.join(', ')||'keine'}</li>)}</ul>
  <p className="text-sm">FAZ/FEZ = frühester Anfang/Ende; SAZ/SEZ = spätester Anfang/Ende ohne Verlängerung des Projekts. Gesamtpuffer = SAZ − FAZ. Gefragt sind die frühesten/spätesten Zeitpunkte dieses Modells, kein beliebiger zulässiger Ablaufplan.</p>
  <p className="text-sm">Nur die erste abgeschlossene Prüfung je Abschnitt zählt pro Durchlauf (maximal zwei). Weitere Prüfungen geben Rückmeldung ohne Punkte. Eine zuvor angezeigte Lösung macht den betreffenden Abschnitt ungewertet. Auch fehlerhafte oder leere Abgaben zählen als erste Prüfung. Begründung und Selbstbewertung vergeben nie Punkte.</p>
  <p className="text-sm text-amber-200">Beim Anmelden oder Wechseln des Kontos wird dieser Durchlauf zurückgesetzt. Eingaben, Häkchen und Lösungen bleiben nur in dieser Sitzung; auch beim Verlassen gehen sie verloren. {props.isAuthenticated?'Nur objektive Versuche werden als Fortschritt gespeichert.':'Als Gast wird kein Fortschritt gespeichert. Melde dich vor dem Bearbeiten an, wenn du Fortschritt speichern möchtest.'}</p>
  <ScheduleSection key={`base-${run}`} changed={false} {...props}/><ScheduleSection key={`change-${run}`} changed {...props}/>
  <section aria-labelledby="project-reasoning-title" className="space-y-3"><h3 id="project-reasoning-title" className="font-semibold">3. Abnahme begründen · Selbstbewertung</h3>
   <label htmlFor="project-reasoning">Abnahme und Umgang mit Fehlern</label><textarea id="project-reasoning" rows={5} className={inputClass} value={reasoning} onChange={e=>setReasoning(e.target.value)} aria-describedby="project-self-note"/>
   <p id="project-self-note">Keine automatische Bewertung. Andere sinnvolle Kriterien und Verantwortlichkeiten sind möglich.</p>
   <fieldset className="space-y-3"><legend>Selbstbewertung</legend>{RUBRIC.map((text,i)=><label key={text} className="flex gap-2"><input type="checkbox" checked={ticks[i]} onChange={e=>setTicks(old=>old.map((v,j)=>i===j?e.target.checked:v))}/>{text}</label>)}</fieldset>
   <button className={buttonClass} aria-expanded={example} aria-controls="project-reasoning-example" onClick={()=>setExample(!example)}>Begründungsbeispiel {example?'verbergen':'anzeigen'}</button>
   {example&&<p id="project-reasoning-example">Eine Möglichkeit: Die IT-Verantwortliche nimmt einen dokumentierten Restore ausgewählter Dateien ab, nachdem Prüfsummen und Zugriffsrechte stimmen und das vereinbarte Zeitlimit eingehalten wurde. Bei Abweichungen: Ursache analysieren, korrigieren, erneut testen und Terminfolgen mit der Betriebsleitung abstimmen. Die konkreten Grenzwerte müssen zum Betrieb passen.</p>}
  </section>
  <button className={buttonClass} onClick={()=>{setRun(v=>v+1);setReasoning('');setTicks(RUBRIC.map(()=>false));setExample(false);}}>Neuer Durchlauf</button>
 </section>;
}
