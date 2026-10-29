'use client';

import { useRef, useState } from 'react';
import type { TrainingRunContext } from '../lib/trainingRun';
import { BACKUPS, RECOVERY, TIMELINE_FIELDS, validateTimeline, validateRestoreChain, type RecoveryResult } from '../lib/backupRecovery';

type Props = { isAuthenticated: boolean; onAttempt: (correct: boolean) => void; trainingRun?: TrainingRunContext };
const inputClass = 'w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 p-2 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const buttonClass = 'rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';

function ObjectiveSection({ chain, isAuthenticated, onAttempt, trainingRun }: Props & { chain: boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const [example, setExample] = useState(false);
  const attempted = useRef(false);
  const revealed = useRef(false);
  const section = chain ? 'chain' : 'time';
  const action = chain ? 'Sicherungskette' : 'Zeitziele';
  const prefix = chain ? 'recovery-chain' : 'recovery-time';
  function edit(key: string, value: string) {
    setAnswers(old => ({ ...old, [key]: value }));
    setResult(null);
    trainingRun?.onEvent({ type: 'edit', section });
  }
  function field(key: string, label: string) {
    const error = result?.errors[key];
    const id = `${prefix}-${key}`;
    return <div key={key}>
      <label htmlFor={id} className="block text-sm">{label}</label>
      <input id={id} className={inputClass} inputMode={chain ? 'text' : 'numeric'} value={answers[key] ?? ''}
        onChange={e => edit(key, e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
      {error && <p id={`${id}-error`} className="text-sm text-rose-200">{error}</p>}
    </div>;
  }
  return <section aria-labelledby={`${prefix}-title`} className="space-y-4 rounded-lg border border-slate-700 p-4">
    <h3 id={`${prefix}-title`} className="font-semibold">{chain ? '2. Sicherungskette auswählen' : '1. Wiederherstellungsziele prüfen'}</h3>
    <p>{chain
      ? 'Gib eine vollständige Kette zum neuesten rekonstruierbaren Datenstand in Abspielreihenfolge an. Trenne die unveränderten IDs mit Kommas, ohne doppelte oder zusätzliche Images. Mehrere gültige Lösungen sind möglich. Ein älterer nutzbarer Stand erfüllt diese Aufgabenstellung nicht.'
      : 'Bestimme das mögliche Datenverlustfenster und die gesamte Ausfalldauer. Vergleiche anschließend beide Zeitspannen mit den zugehörigen Höchstwerten. Gleichheit erfüllt das Ziel. Ganze Minuten ohne Einheiten, Vorzeichen, Dezimalstellen oder Exponenten eingeben.'}</p>
    <form noValidate className="space-y-4" onSubmit={event => {
      event.preventDefault();
      const next = chain ? validateRestoreChain(answers.chain) : validateTimeline(answers);
      setResult(next);
      trainingRun?.onEvent({ type: 'check', section, correct: next.valid });
      if (!attempted.current) {
        attempted.current = true;
        if (isAuthenticated && !revealed.current) onAttempt(next.valid);
      }
    }}>
      {chain ? field('chain', 'Sicherungskette') : <>
        <div className="grid gap-4 sm:grid-cols-2">{TIMELINE_FIELDS.map(item => field(item.key, item.label))}</div>
        <div className="grid gap-4 sm:grid-cols-2">{(['rpo', 'rto'] as const).map(key => {
          const id = `${prefix}-${key}`;
          const error = result?.errors[key];
          return <div key={key}>
            <label htmlFor={id} className="block text-sm">{key.toUpperCase()}-Ziel</label>
            <select id={id} className={inputClass} value={answers[key] ?? ''} onChange={e => edit(key, e.target.value)}
              aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}>
              <option value="">Bitte wählen</option><option value="met">Erfüllt</option><option value="missed">Nicht erfüllt</option>
            </select>
            {error && <p id={`${id}-error`} className="text-sm text-rose-200">{error}</p>}
          </div>;
        })}</div>
      </>}
      <p role="status" className={result ? (result.valid ? 'text-emerald-200' : 'text-rose-200') : 'text-slate-400'}>
        {`${action}: ${result ? (result.valid ? 'Korrekt für die vorgegebenen Annahmen.' : 'Bitte die markierten Eingaben prüfen.') : 'Noch keine aktuelle Prüfung.'}`}
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={buttonClass}>{action} prüfen</button>
        <button type="button" className={buttonClass} aria-expanded={example} aria-controls={`${prefix}-solution`}
          onClick={() => { revealed.current = true; trainingRun?.onEvent({ type: 'reveal', section }); setExample(!example); }}>{action}: Lösung {example ? 'verbergen' : 'anzeigen'}</button>
      </div>
      {example && <div id={`${prefix}-solution`} className="space-y-2 text-sm text-slate-300">
        {chain ? <><p>Zwei mögliche Ketten: F1,I1,I2 oder F2,I4. Beide enden bei 09:40. Jede inkrementelle Sicherung benötigt ihre angegebene Vorgängerkette; I3 scheitert am fehlenden X.</p><p>Die Anzahl der Images beweist keine Wiederherstellungsdauer.</p></>
          : <><p>Mögliches Datenverlustfenster: 20 Minuten (10:00 − 09:40). Ausfalldauer: 70 Minuten (11:10 − 10:00). RPO: erfüllt, da 20 ≤ 30. RTO: erfüllt, da 70 ≤ 90.</p><p>Der Zeitabstand beweist keine tatsächlich verlorenen Datensätze und garantiert keine zukünftige Wiederherstellung.</p></>}
        <p>Eine vor der ersten Prüfung angezeigte Lösung macht diesen Abschnitt für den restlichen Durchlauf ungewertet, auch nach dem Verbergen.</p>
      </div>}
    </form>
  </section>;
}

const RUBRIC = [
  'Ich beschreibe eine isolierte Wiederherstellung und prüfe Datenintegrität, Anwendungsfunktion und Zugriffsrechte vor der Freigabe.',
  'Ich benenne eine verantwortliche Rolle für dokumentierte Abnahmekriterien und tatsächliche Testergebnisse.',
  'Ich unterscheide mögliche Datenverluste von nachgewiesenen Verlusten und plane bei Abweichungen Analyse, Korrektur und erneuten Test.',
];
export default function BackupRecoveryTrainer(props: Props) {
  const [run, setRun] = useState(0);
  const [reasoning, setReasoning] = useState('');
  const [ticks, setTicks] = useState<boolean[]>(RUBRIC.map(() => false));
  const [example, setExample] = useState(false);
  return <section aria-labelledby="recovery-title" className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-200 sm:p-6">
    <h2 id="recovery-title" className="text-xl font-bold">AP2 Datensicherung</h2>
    <p>Wiederherstellung und RPO/RTO · eigene Übungsaufgabe · Schwerpunkt Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
    <p>Eine fiktive Werkstatt wertet einen abgeschlossenen Wiederherstellungstest ihres Dateidienstes aus. Alle Zeiten liegen am selben Tag und bezeichnen verstrichene Minuten, ohne Zeitzonenwechsel. Es werden keine Befehle ausgeführt und keine echten Sicherungen verändert.</p>
    <ul className="space-y-2">
      <li>Ausfallbeginn: {RECOVERY.outageAt}. Abgenommener Wiederanlauf einschließlich Funktionsprüfungen: {RECOVERY.restoredAt}.</li>
      <li>RPO (Recovery Point Objective): höchstens {RECOVERY.rpoMinutes} Minuten möglicher Datenverlust. RTO (Recovery Time Objective): höchstens {RECOVERY.rtoMinutes} Minuten vom Ausfall bis zum abgenommenen Wiederanlauf.</li>
    </ul>
    <p>Alle gelisteten Sicherungsdateien sind vorhanden und integritätsgeprüft. X fehlt; zusätzliche Protokolle, Snapshots oder andere Wiederherstellungswege stehen nicht zur Verfügung. Die Zeiten im Katalog bezeichnen den enthaltenen Datenstand, keine Laufzeit der Sicherung.</p>
    <ul aria-label="Sicherungskatalog" className="space-y-2">{BACKUPS.map(backup => <li key={backup.id} className="rounded-lg border border-slate-700 p-3">
      <strong>{backup.id}</strong>: {backup.kind === 'full' ? 'Vollsicherung' : 'Inkrementelle Sicherung'} · Datenstand {backup.state} · {backup.parent ? `benötigt ${backup.parent} und dessen vollständige Vorgängerkette` : 'unabhängig, kein Vorgänger'}
    </li>)}</ul>
    <p>Eine inkrementelle Sicherung ist nur mit genau ihrer angegebenen Vorgängerkette nutzbar. Eine andere Vollsicherung ersetzt diesen Vorgänger nicht. RAID-Ausfallsicherheit ersetzt keine Datensicherung. Aus den Datenständen folgt weder die Zahl tatsächlich verlorener Datensätze noch die Dauer einer künftigen Wiederherstellung.</p>
    <p className="text-sm">Nur die erste abgeschlossene Prüfung je Abschnitt zählt pro Durchlauf (maximal zwei), auch eine leere oder fehlerhafte Abgabe. Wiederholungen geben Rückmeldung ohne zusätzliche Punkte. Eine zuvor angezeigte Lösung macht nur den betreffenden Abschnitt ungewertet. Begründung und Selbstbewertung vergeben nie Punkte.</p>
    <p className="text-sm text-amber-200">Beim Anmelden oder Wechseln des Kontos wird dieser Durchlauf zurückgesetzt. {props.trainingRun ? 'Beim Aufgabenwechsel innerhalb des Trainingslaufs bleiben Eingaben, Häkchen und Lösungen erhalten; beim Verlassen des Trainingslaufs gehen sie verloren.' : 'Eingaben, Häkchen und Lösungen bleiben nur in dieser Sitzung; auch beim Verlassen gehen sie verloren.'} {props.isAuthenticated ? 'Nur objektive Versuche werden als Fortschritt gespeichert.' : 'Als Gast wird kein Fortschritt gespeichert. Melde dich vor dem Bearbeiten an, wenn du Fortschritt speichern möchtest.'}</p>
    <ObjectiveSection key={`time-${run}`} chain={false} {...props} />
    <ObjectiveSection key={`chain-${run}`} chain {...props} />
    <section aria-labelledby="recovery-reasoning-title" className="space-y-3">
      <h3 id="recovery-reasoning-title" className="font-semibold">3. Betriebsfreigabe begründen · Selbstbewertung</h3>
      <label htmlFor="recovery-reasoning">Prüfung und Freigabe</label>
      <textarea id="recovery-reasoning" rows={5} className={inputClass} value={reasoning} onChange={e => setReasoning(e.target.value)} aria-describedby="recovery-self-note" />
      <p id="recovery-self-note">Keine automatische Bewertung. Andere fachlich begründete Prüfungen und Verantwortlichkeiten sind möglich.</p>
      <fieldset className="space-y-3"><legend>Selbstbewertung</legend>{RUBRIC.map((text, i) => <label key={text} className="flex gap-2"><input type="checkbox" checked={ticks[i]} onChange={e => setTicks(old => old.map((v, j) => i === j ? e.target.checked : v))} />{text}</label>)}</fieldset>
      <button className={buttonClass} aria-expanded={example} aria-controls="recovery-reasoning-example" onClick={() => setExample(!example)}>Begründungsbeispiel {example ? 'verbergen' : 'anzeigen'}</button>
      {example && <p id="recovery-reasoning-example">Eine Möglichkeit: In isolierter Umgebung repräsentative Dateien und Anwendungsfunktionen prüfen, Integrität und Zugriffsrechte dokumentieren und die zuständige Rolle über die Freigabe entscheiden lassen. Bei Abweichungen erst Ursachen klären, korrigieren und erneut testen. Tatsächliche Ergebnisse dokumentieren statt aus einem Sicherungszeitplan Erfolg zu versprechen.</p>}
    </section>
    {!props.trainingRun && <button className={buttonClass} onClick={() => { setRun(v => v + 1); setReasoning(''); setTicks(RUBRIC.map(() => false)); setExample(false); }}>Neuer Durchlauf</button>}
  </section>;
}
