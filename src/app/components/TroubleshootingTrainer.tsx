'use client';

import { useRef, useState, type ReactNode } from 'react';
import { CLAIMS, DIAGNOSES, CORRECTIONS, VERIFICATIONS, validateDiagnosis, validateCorrection, type Validation } from '../lib/troubleshooting';

type Section = 'diagnosis'|'action';
type Props = { isAuthenticated:boolean; onAttempt:(correct:boolean)=>void };
const inputClass='w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 p-2 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const buttonClass='rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const blank=()=>({diagnosis:'', classifications:{} as Record<string,string>, correction:'', verification:''});
const RUBRIC=[
 'Ich trenne Beobachtung und Vermutung: Ein DNS-Timeout erklärt seine Ursache nicht, fehlende ICMP-Antworten beweisen keine allgemeine Unerreichbarkeit.',
 'Ich begründe die begrenzte Profilkorrektur, dokumentiere den Ausgangszustand und stimme Änderung und Rücknahme mit der zuständigen Person ab.',
 'Ich prüfe nach der Änderung den normalen DNS- und HTTPS-Pfad, dokumentiere das tatsächliche Ergebnis und eskaliere bei fortbestehendem Fehler statt Erfolg zu unterstellen.',
];
export default function TroubleshootingTrainer({isAuthenticated,onAttempt}:Props){
 const [answers,setAnswers]=useState(blank);
 const [results,setResults]=useState<Partial<Record<Section,Validation>>>({});const [shown,setShown]=useState({diagnosis:false,action:false});
 const attempted=useRef({diagnosis:false,action:false});const revealed=useRef({diagnosis:false,action:false});
 const [reasoning,setReasoning]=useState('');const [ticks,setTicks]=useState(RUBRIC.map(()=>false));const [reasonExample,setReasonExample]=useState(false);
 function clear(section:Section){setResults(old=>({...old,[section]:undefined}));}
 function check(section:Section){
  const result=section==='diagnosis'?validateDiagnosis(answers.diagnosis,answers.classifications):validateCorrection(answers.correction,answers.verification);setResults(old=>({...old,[section]:result}));
  if(!attempted.current[section]){attempted.current[section]=true;if(isAuthenticated&&!revealed.current[section])onAttempt(result.valid);}
 }
 function field(section:Section,key:string,label:string,value:string,change:(v:string)=>void,options:readonly {value:string;label:string}[]){
  const id=`troubleshooting-${section}-${key}`;const error=results[section]?.errors[key];const selected=options.find(option=>option.value===value);
  return <div key={key}><label htmlFor={id} className="block text-sm text-slate-300">{label}</label><select id={id} value={value} className={inputClass} aria-invalid={!!error} aria-describedby={error?`${id}-error`:selected?`${id}-selected`:undefined} onChange={e=>{change(e.target.value);clear(section);}}><option value="">Bitte wählen</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>{selected&&<p id={`${id}-selected`} className="mt-1 break-words text-sm text-slate-300">Auswahl: {selected.label}</p>}{error&&<p id={`${id}-error`} className="text-sm text-rose-200">{error}</p>}</div>;
 }
 function objective(section:Section,title:string,children:ReactNode,solution:ReactNode){
  const name=section==='diagnosis'?'Diagnose':'Maßnahme';const result=results[section];
  return <section aria-labelledby={`troubleshooting-${section}-title`} className="space-y-3 rounded-lg border border-slate-700 p-4"><h3 id={`troubleshooting-${section}-title`} className="font-semibold">{title}</h3>
   <form noValidate className="space-y-4" onSubmit={e=>{e.preventDefault();check(section);}}>{children}
    <p role="status" className={result?(result.valid?'text-emerald-200':'text-rose-200'):'text-slate-400'}>{result?`${name}: ${result.valid?'Korrekt.':'Bitte die markierten Eingaben prüfen.'}`:'Noch keine aktuelle Prüfung.'}</p>
    <div className="flex flex-wrap gap-3"><button type="submit" className={buttonClass}>{name} prüfen</button><button type="button" className={buttonClass} aria-expanded={shown[section]} aria-controls={`troubleshooting-${section}-solution`} onClick={()=>{revealed.current[section]=true;setShown(old=>({...old,[section]:!old[section]}));}}>{name}: Lösung {shown[section]?'verbergen':'anzeigen'}</button></div>
    {shown[section]&&<div id={`troubleshooting-${section}-solution`} className="space-y-2 text-sm text-slate-300">{solution}</div>}
   </form>
  </section>;
 }
 return <section aria-labelledby="troubleshooting-title" className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-200 sm:p-6">
  <h2 id="troubleshooting-title" className="text-xl font-bold">AP2 Fehlersuche: Namensauflösung oder Verbindung?</h2>
  <p>Eigene Übungsaufgabe · Schwerpunkt Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
  <p>Ein Client eines fiktiven Handwerksbetriebs kann nach einer lokalen Netzwerkprofil-Änderung das interne Portal portal.werkstatt.test nicht öffnen. Ordne die vorliegenden Beobachtungen ein und plane eine begrenzte Korrektur.</p>
  <section aria-labelledby="troubleshooting-evidence" className="space-y-3"><h3 id="troubleshooting-evidence" className="font-semibold">Vorgegebene Diagnosezusammenfassung</h3>
   <p>Alle Angaben sind synthetisch und stammen im Szenario vom selben Client zum selben Zeitpunkt. Genau eine aktive Schnittstelle, kein VPN, kein Proxy und kein alternativer Browser-DNS: Der gewöhnliche Zugriff nutzt den angezeigten Resolver. Dies ist nur eine feste Momentaufnahme, keine Aussage über alle Netzwerkdienste.</p>
   <dl className="space-y-3 break-words">
    <div><dt className="font-semibold">Freigegebenes Clientprofil</dt><dd>Adresse 10.20.30.24/24 · Gateway 10.20.30.1 · interner DNS 10.20.30.53</dd></div>
    <div><dt className="font-semibold">Aktuelle Konfiguration</dt><dd>Adresse und Gateway entsprechen dem Profil. Lokale DNS-Überschreibung: 10.20.30.99.</dd></div>
    <div><dt className="font-semibold">Gewöhnlicher Portalaufruf über den Namen</dt><dd>Namensauflösung fehlgeschlagen; keine HTTPS-Verbindung aufgebaut.</dd></div>
    <div><dt className="font-semibold">DNS-Anfrage an den konfigurierten Resolver .99</dt><dd>Keine Antwort innerhalb der Wartezeit (Timeout).</dd></div>
    <div><dt className="font-semibold">Explizite DNS-Anfrage an den freigegebenen Resolver .53</dt><dd>Erfolgreich: portal.werkstatt.test → 10.20.40.10.</dd></div>
    <div><dt className="font-semibold">HTTPS-Kontrollprüfung mit festgelegter Zieladresse 10.20.40.10</dt><dd>Der Portalhostname und SNI bleiben erhalten; die Zertifikatsprüfung ist aktiv und erfolgreich. Ergebnis: HTTP 200. Nur die Namensauflösung wird für diese Kontrolle umgangen.</dd></div>
    <div><dt className="font-semibold">ICMP-Echo an 10.20.40.10</dt><dd>Vier Anfragen, keine Antworten innerhalb der Wartezeit.</dd></div>
   </dl>
   <p>Es werden keine Befehle ausgeführt und keine Netzwerk- oder Sicherheitseinstellungen verändert. Nach einer Korrektur liegen noch keine Messergebnisse vor.</p>
  </section>
  <p className="text-sm">Nur die erste abgeschlossene Prüfung je Abschnitt zählt pro Durchlauf (maximal zwei), auch eine leere oder falsche Abgabe. Weitere Prüfungen geben Rückmeldung ohne Punkte. Eine vorher angezeigte Lösung macht nur den betreffenden Abschnitt ungewertet. Begründung und Häkchen vergeben nie Punkte.</p>
  <p className="text-sm text-amber-200">Beim Anmelden oder Kontowechsel wird dieser Durchlauf zurückgesetzt. Eingaben, Häkchen und Lösungen bleiben nur in dieser Sitzung und gehen auch beim Verlassen verloren. {isAuthenticated?'Nur objektive Versuche werden als Fortschritt gespeichert.':'Als Gast wird kein Fortschritt gespeichert. Melde dich vor dem Bearbeiten an, wenn du Fortschritt speichern möchtest.'}</p>
  {objective('diagnosis','1. Evidenz und Diagnose',<>
   {field('diagnosis','diagnosis','Am besten gestützte Diagnose',answers.diagnosis,value=>setAnswers(old=>({...old,diagnosis:value})),DIAGNOSES)}
   <p>Ordne jede Aussage ein: „Gestützt“ bedeutet durch die vorliegenden Beobachtungen belegt. „Nicht belegt“ bedeutet nicht bewiesen, nicht zwingend falsch. Die Reihenfolge deiner Eingaben ist unerheblich.</p>
   {CLAIMS.map(claim=>field('diagnosis',claim.id,claim.label,answers.classifications[claim.id]??'',value=>setAnswers(old=>({...old,classifications:{...old.classifications,[claim.id]:value}})),[{value:'supported',label:'Gestützt'},{value:'unproven',label:'Nicht belegt'}]))}
  </>,<><p>Der Profilvergleich zeigt die falsche lokale DNS-Überschreibung als ersten begründeten Korrekturpunkt. Die Ursache des Timeouts von .99 ist offen.</p>{CLAIMS.map(c=><p key={c.id}>{c.label} — {c.expected==='supported'?'Gestützt':'Nicht belegt'}: {c.explanation}</p>)}</>)}
  {objective('action','2. Korrektur und Verifikation planen',<>
   <p>Wähle die eng begrenzte Korrektur für diesen Client und die anschließend nötige Prüfung. Die Auswahl plant Maßnahmen; sie belegt noch keine erfolgreiche Behebung.</p>
   {field('action','correction','Begründete Korrektur',answers.correction,value=>setAnswers(old=>({...old,correction:value})),CORRECTIONS)}
   {field('action','verification','Anschließende Verifikation',answers.verification,value=>setAnswers(old=>({...old,verification:value})),VERIFICATIONS)}
  </>,<p>Lokale Überschreibung entfernen und freigegebenes Profil mit DNS .53 wiederherstellen. Danach normale Namensauflösung und gewöhnlichen HTTPS-Aufruf über portal.werkstatt.test prüfen. Eine erfolgreiche Kontrolle mit festgelegter IP ersetzt diese Verifikation nicht. Das Ergebnis nach der Änderung ist hier noch unbekannt.</p>)}
  <section aria-labelledby="troubleshooting-reasoning-title" className="space-y-3"><h3 id="troubleshooting-reasoning-title" className="font-semibold">3. Begründung · Selbstbewertung</h3><label htmlFor="troubleshooting-reasoning">Begründung und Betriebsplan</label><textarea id="troubleshooting-reasoning" rows={5} className={inputClass} value={reasoning} onChange={e=>setReasoning(e.target.value)} aria-describedby="troubleshooting-self-note"/><p id="troubleshooting-self-note">Keine automatische Bewertung: Erkläre die Evidenzkette, verbleibende Unsicherheiten, Freigabe, Rücknahme und Verifikation. Andere sinnvolle Diagnosewerkzeuge und Begründungen sind willkommen.</p>
   <fieldset className="space-y-3"><legend>Selbstbewertung</legend>{RUBRIC.map((text,i)=><label key={text} className="flex gap-2"><input type="checkbox" checked={ticks[i]} onChange={e=>setTicks(old=>old.map((v,j)=>i===j?e.target.checked:v))}/>{text}</label>)}</fieldset>
   <button className={buttonClass} aria-expanded={reasonExample} aria-controls="troubleshooting-reason-example" onClick={()=>setReasonExample(!reasonExample)}>Begründungsbeispiel {reasonExample?'verbergen':'anzeigen'}</button>{reasonExample&&<p id="troubleshooting-reason-example">Eine Möglichkeit: Profilabweichung dokumentieren und die lokale Wiederherstellung mit der zuständigen Person abstimmen. Die erfolgreiche HTTPS-Kontrolle spricht gegen eine allgemeine Unerreichbarkeit; sie erklärt den ICMP-Ausfall nicht. Nach der Änderung normale Namensauflösung und Portalzugriff prüfen, tatsächliche Ergebnisse dokumentieren und bei Problemen abgestimmt zurücknehmen oder weiter untersuchen.</p>}
  </section>
  <button className={buttonClass} onClick={()=>{setAnswers(blank());setResults({});setShown({diagnosis:false,action:false});attempted.current={diagnosis:false,action:false};revealed.current={diagnosis:false,action:false};setReasoning('');setTicks(RUBRIC.map(()=>false));setReasonExample(false);}}>Neuer Durchlauf</button>
 </section>;
}
