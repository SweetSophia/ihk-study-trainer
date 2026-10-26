'use client';

import { useRef, useState, type ReactNode } from 'react';
import { SERVERS, THRESHOLD, PSEUDOCODE, BOUNDARY_CASES, traceServers, validateTrace, validateBoundary, type TraceAnswers, type Validation } from '../lib/algorithmTracing';

type Section = 'trace'|'boundary';
type Props = { isAuthenticated:boolean; onAttempt:(correct:boolean)=>void };
const inputClass='w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 p-2 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const buttonClass='rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const blank=():TraceAnswers=>({rows:{},output:''});
const RUBRIC=[
 'Ich begründe die Wartungsausnahme und berücksichtige, dass unterdrückte Warnungen nach der Wartung wieder aktiv werden müssen.',
 'Ich prüfe Ursache, betroffene Dienste und Entwicklung des freien Speichers; eine Warnung rechtfertigt kein automatisches Löschen von Daten.',
 'Ich berücksichtige weitere Messwerte und betriebliche Grenzwerte, dokumentiere die Beobachtung und informiere die zuständige Person.',
];
export default function AlgorithmTracingTrainer({isAuthenticated,onAttempt}:Props){
 const [answers,setAnswers]=useState(blank);const [comparator,setComparator]=useState('');const [testCase,setTestCase]=useState('');
 const [results,setResults]=useState<Partial<Record<Section,Validation>>>({});const [shown,setShown]=useState({trace:false,boundary:false});
 const attempted=useRef({trace:false,boundary:false});const revealed=useRef({trace:false,boundary:false});
 const [reasoning,setReasoning]=useState('');const [ticks,setTicks]=useState(RUBRIC.map(()=>false));const [reasonExample,setReasonExample]=useState(false);
 function clear(section:Section){setResults(old=>({...old,[section]:undefined}));}
 function check(section:Section){
  const result=section==='trace'?validateTrace(answers):validateBoundary(comparator,testCase);setResults(old=>({...old,[section]:result}));
  if(!attempted.current[section]){attempted.current[section]=true;if(isAuthenticated&&!revealed.current[section])onAttempt(result.valid);}
 }
 function field(section:Section,key:string,label:string,value:string,change:(v:string)=>void,options?:readonly {value:string;label:string}[]){
  const id=`algorithm-${section}-${key}`;const error=results[section]?.errors[key];const props={id,value,className:inputClass,'aria-invalid':!!error,'aria-describedby':error?`${id}-error`:undefined,onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>{change(e.target.value);clear(section);}};
  return <div key={key}><label htmlFor={id} className="block text-sm text-slate-300">{label}</label>{options?<select {...props}><option value="">Bitte wählen</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<input {...props} inputMode={key==='output'?'text':'numeric'}/>} {error&&<p id={`${id}-error`} className="text-sm text-rose-200">{error}</p>}</div>;
 }
 function objective(section:Section,title:string,children:ReactNode,solution:ReactNode){
  const name=section==='trace'?'Ablauf':'Grenzfall';const result=results[section];
  return <section aria-labelledby={`algorithm-${section}-title`} className="space-y-3 rounded-lg border border-slate-700 p-4"><h3 id={`algorithm-${section}-title`} className="font-semibold">{title}</h3>
   <form noValidate className="space-y-4" onSubmit={e=>{e.preventDefault();check(section);}}>{children}
    <p role="status" className={result?(result.valid?'text-emerald-200':'text-rose-200'):'text-slate-400'}>{result?`${name}: ${result.valid?'Korrekt.':'Bitte die markierten Eingaben prüfen.'}`:'Noch keine aktuelle Prüfung.'}</p>
    <div className="flex flex-wrap gap-3"><button type="submit" className={buttonClass}>{name} prüfen</button><button type="button" className={buttonClass} aria-expanded={shown[section]} aria-controls={`algorithm-${section}-solution`} onClick={()=>{revealed.current[section]=true;setShown(old=>({...old,[section]:!old[section]}));}}>{name}: Lösung {shown[section]?'verbergen':'anzeigen'}</button></div>
    {shown[section]&&<div id={`algorithm-${section}-solution`} className="space-y-2 text-sm text-slate-300">{solution}</div>}
   </form>
  </section>;
 }
 const reference=traceServers(SERVERS,THRESHOLD);
 return <section aria-labelledby="algorithm-title" className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-200 sm:p-6">
  <h2 id="algorithm-title" className="text-xl font-bold">AP2 Algorithmen: Speicherüberwachung</h2>
  <p>Eigene Übungsaufgabe · Schwerpunkt Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
  <p>Ein fiktives IT-Service-Team prüft fünf Server. Während einer Wartung wird ein Server übersprungen. Sonst wird bei höchstens {THRESHOLD} GiB freiem Speicher seine ID gemeldet. Die Grenze ist {THRESHOLD} GiB.</p>
  <ul className="space-y-1">{SERVERS.map(s=><li key={s.id}>{s.id}: {s.freeGiB} GiB frei · Wartung: {s.maintenance?'WAHR':'FALSCH'}</li>)}</ul>
  <p className="text-sm">Die Liste wird in der gezeigten Reihenfolge genau einmal durchlaufen. Einrückung definiert die Blöcke; ← weist zu, = vergleicht und ≤ schließt Gleichheit ein. Zähler und leere Meldungsliste werden einmal vor der Schleife initialisiert. Eingaben bleiben unverändert; Zahlen sind nichtnegative ganze Zahlen, Wartung ist ein Wahrheitswert. Ein übersprungener Server ändert weder Zähler noch Meldungen. Es gibt keine impliziten Typumwandlungen. Es wird kein eingegebener Code ausgeführt.</p>
  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-slate-950 p-3 text-sm"><code>{PSEUDOCODE}</code></pre>
  <p className="text-sm">Nur die erste abgeschlossene Prüfung je Abschnitt zählt pro Durchlauf (maximal zwei), auch eine leere oder falsche Abgabe. Weitere Prüfungen geben Rückmeldung ohne Punkte. Eine vorher angezeigte Lösung macht nur den betreffenden Abschnitt ungewertet. Begründung und Häkchen vergeben nie Punkte.</p>
  <p className="text-sm text-amber-200">Beim Anmelden oder Kontowechsel wird dieser Durchlauf zurückgesetzt. Eingaben, Häkchen und Lösungen bleiben nur in dieser Sitzung und gehen auch beim Verlassen verloren. {isAuthenticated?'Nur objektive Versuche werden als Fortschritt gespeichert.':'Als Gast wird kein Fortschritt gespeichert. Melde dich vor dem Bearbeiten an, wenn du Fortschritt speichern möchtest.'}</p>
  {objective('trace','1. Ablauf nachvollziehen',<>
   <p>Gib die beiden Zähler jeweils nach der gesamten Iteration dieses Servers an, auch bei Wartung. Anfangswerte: jeweils 0.</p>
   {SERVERS.map(s=><fieldset key={s.id} className="rounded border border-slate-700 p-3"><legend>Nach Server {s.id}</legend><div className="grid gap-3 sm:grid-cols-2">{(['checked','warnings'] as const).map(key=>field('trace',`${s.id}.${key}`,`${s.id}: ${key==='checked'?'geprüft':'warnungen'}`,answers.rows[s.id]?.[key]??'',value=>setAnswers(old=>({...old,rows:{...old.rows,[s.id]:{checked:old.rows[s.id]?.checked??'',warnings:old.rows[s.id]?.warnings??'',[key]:value}}}))))}</div></fieldset>)}
   <p className="text-sm">Endgültige Meldungsliste: IDs mit Kommas trennen, zum Beispiel A, B. Großschreibung und Reihenfolge zählen; Leerzeichen um IDs werden ignoriert. Keine Sortierung und keine doppelten Einträge. Eine leere Liste wird als [] geschrieben.</p>
   {field('trace','output','Geordnete Meldungsliste',answers.output,value=>setAnswers(old=>({...old,output:value})))}
  </>,<>{reference.rows.map(r=><p key={r.id}>Nach {r.id}: geprüft = {r.checked}, warnungen = {r.warnings}</p>)}<p>Meldungen: {reference.output.join(', ')}. B wird vollständig übersprungen; A löst bei Gleichheit eine Warnung aus.</p></>)}
  {objective('boundary','2. Grenzfehler finden',<>
   <p>Eine fehlerhafte Variante verwendet server.freiGiB &lt; grenze. Die Anforderung bleibt „höchstens {THRESHOLD} GiB“. Wähle die Korrektur und einen Testfall, bei dem die fehlerhafte und die korrekte Variante unterschiedliche Meldungen erzeugen.</p>
   {field('boundary','comparator','Korrigierter Vergleich',comparator,setComparator,[{value:'<',label:'< (kleiner)'},{value:'<=',label:'≤ (kleiner oder gleich)'},{value:'=',label:'= (gleich)'},{value:'>=',label:'≥ (größer oder gleich)'}])}
   {field('boundary','testCase','Entscheidender Testfall',testCase,setTestCase,BOUNDARY_CASES.map(c=>({value:c.id,label:c.label})))}
  </>,<p>Richtig ist ≤. Ein Server ohne Wartung mit genau {THRESHOLD} GiB wird bei ≤ gemeldet, bei &lt; nicht. Oberhalb melden beide nicht, unterhalb melden beide; Wartung überspringt beide Vergleiche.</p>)}
  <section aria-labelledby="algorithm-reasoning-title" className="space-y-3"><h3 id="algorithm-reasoning-title" className="font-semibold">3. Betrieblich einordnen · Selbstbewertung</h3><label htmlFor="algorithm-reasoning">Sichere betriebliche Reaktion</label><textarea id="algorithm-reasoning" rows={5} className={inputClass} value={reasoning} onChange={e=>setReasoning(e.target.value)} aria-describedby="algorithm-self-note"/><p id="algorithm-self-note">Keine automatische Bewertung: Begründe die Wartungsausnahme, sichere Reaktionen auf Warnungen und ergänzende Prüfungen. Andere sinnvolle Antworten sind willkommen.</p>
   <fieldset className="space-y-3"><legend>Selbstbewertung</legend>{RUBRIC.map((text,i)=><label key={text} className="flex gap-2"><input type="checkbox" checked={ticks[i]} onChange={e=>setTicks(old=>old.map((v,j)=>i===j?e.target.checked:v))}/>{text}</label>)}</fieldset>
   <button className={buttonClass} aria-expanded={reasonExample} aria-controls="algorithm-reason-example" onClick={()=>setReasonExample(!reasonExample)}>Begründungsbeispiel {reasonExample?'verbergen':'anzeigen'}</button>{reasonExample&&<p id="algorithm-reason-example">Eine Möglichkeit: Wartungsalarme gezielt unterdrücken und anschließend wieder aktivieren. Bei einer Warnung Trend, Gesamtgröße und betroffene Dienste prüfen, Verantwortliche informieren und Maßnahmen abstimmen. Keine Daten ohne Freigabe löschen; weitere Grenzwerte hängen vom Betrieb ab.</p>}
  </section>
  <button className={buttonClass} onClick={()=>{setAnswers(blank());setComparator('');setTestCase('');setResults({});setShown({trace:false,boundary:false});attempted.current={trace:false,boundary:false};revealed.current={trace:false,boundary:false};setReasoning('');setTicks(RUBRIC.map(()=>false));setReasonExample(false);}}>Neuer Durchlauf</button>
 </section>;
}
