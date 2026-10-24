'use client';

import { useEffect, useRef, useState } from 'react';
import { DATABASE_SCHEMA, DATABASE_TASKS } from '../lib/databaseScenario';
import { checkDatabaseTask } from '../lib/databaseWorkerClient';

const RUBRIC = [
  'Ich trenne Standorte, Geräte und Wartungen und ordne die Attribute sinnvoll zu, ohne Standortnamen in jedem Gerät zu wiederholen.',
  'Jede Tabelle hat einen eindeutigen Schlüssel. Natürliche Schlüssel oder künstliche IDs mit passenden UNIQUE-Regeln sind möglich.',
  'Ein Gerät gehört genau einem Standort; ein Standort hat 0 bis viele Geräte. Eine Wartung gehört genau einem Gerät; ein Gerät hat 0 bis viele Wartungen.',
  'Fremdschlüssel sichern die Beziehungen. Ich begründe Pflichtfelder, Eindeutigkeit und den Umgang mit Löschungen.',
];
const inputClass = 'w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 p-3 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const buttonClass = 'rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-400';

function SqlTask({ index, isAuthenticated, onAttempt }: { index: number; isAuthenticated: boolean; onAttempt: (correct: boolean) => void }) {
  const task = DATABASE_TASKS[index];
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('Noch keine aktuelle Prüfung.');
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const attempted = useRef(false);
  const exampleSeen = useRef(false);
  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, []);
  function cancel(message = 'Abgebrochen. Ohne Wertung.') {
    controller.current?.abort(); controller.current = null;
    setBusy(false); setFeedback(message);
  }
  async function check() {
    if (controller.current || !query.trim()) return;
    const active = new AbortController(); controller.current = active;
    setBusy(true); setFeedback('Prüfung läuft … maximal 30 Sekunden.');
    try {
      const result = await checkDatabaseTask(index, query, active.signal);
      if (controller.current !== active || active.signal.aborted) return;
      setFeedback(result.correct ? 'Beide Testdatensätze bestanden. Dies ist kein Beweis für alle möglichen Daten.' : result.message ?? 'Das Ergebnis oder der Datenbestand weicht ab. Prüfe Bedingungen, Spaltennamen, Reihenfolge und unveränderte Daten.');
      if (!attempted.current) {
        attempted.current = true;
        if (!exampleSeen.current && isAuthenticated) onAttempt(result.correct);
      }
    } catch (error) {
      if (controller.current === active && !active.signal.aborted) setFeedback(`${error instanceof Error ? error.message : 'Prüfung fehlgeschlagen.'} Versuch nicht gewertet.`);
    } finally {
      if (controller.current === active) { controller.current = null; setBusy(false); }
    }
  }
  return <section aria-labelledby={`db-task-${index}`} className="min-w-0 space-y-3 rounded-lg border border-slate-700 p-4">
    <h3 id={`db-task-${index}`} className="font-semibold text-slate-100">Aufgabe {index + 1}: {task.title}</h3>
    <p className="text-sm text-slate-300">{task.question}</p>
    <label htmlFor={`db-query-${index}`} className="block text-sm text-slate-200">SQL für Aufgabe {index + 1}</label>
    <textarea id={`db-query-${index}`} rows={5} spellCheck={false} className={`${inputClass} font-mono text-sm`} value={query}
      aria-describedby={`db-feedback-${index}`} onChange={event => { cancel('Noch keine aktuelle Prüfung. Nach Änderungen erneut prüfen.'); setQuery(event.target.value); }} />
    <div className="flex flex-wrap gap-3">
      <button className={buttonClass} disabled={busy || !query.trim()} onClick={check}>Aufgabe {index + 1} prüfen</button>
      {busy && <button className={buttonClass} onClick={() => cancel()}>Aufgabe {index + 1} abbrechen</button>}
      <button className={buttonClass} aria-expanded={revealed} aria-controls={`db-solution-${index}`} onClick={() => { exampleSeen.current = true; setRevealed(true); }}>Lösung für Aufgabe {index + 1} anzeigen (ohne Wertung)</button>
    </div>
    <p id={`db-feedback-${index}`} role="status" aria-live="polite" aria-atomic="true" className="text-sm text-emerald-200">{feedback}</p>
    {revealed && <div id={`db-solution-${index}`} className="space-y-2">
      <p className="text-sm text-amber-200">Eine mögliche Query. Diese Aufgabe bleibt für den restlichen Durchlauf ohne weitere Wertung.</p>
      <pre className="whitespace-pre-wrap break-words text-sm text-slate-200"><code>{task.solution}</code></pre>
    </div>}
  </section>;
}

export default function DatabaseDesignTrainer({ isAuthenticated, onAttempt }: { isAuthenticated: boolean; onAttempt: (correct: boolean) => void }) {
  const [run, setRun] = useState(0);
  const [reasoning, setReasoning] = useState('');
  const [ticks, setTicks] = useState<boolean[]>(RUBRIC.map(() => false));
  const [example, setExample] = useState(false);
  return <section aria-labelledby="db-title" className="min-w-0 space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
    <header className="space-y-3">
      <h2 id="db-title" className="text-xl font-bold text-slate-100">AP2 Datenbankentwurf & SQL</h2>
      <p className="text-sm text-slate-400">Eigene Übungsaufgabe · Handwerksbetrieb in Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
      <p className="text-slate-200">Ein fiktiver Betrieb verwaltet Standorte, Geräte und Wartungsdatensätze. Jedes Gerät besitzt eine eindeutige Inventarnummer, einen Status und ein Anschaffungsdatum und gehört genau einem Standort. Standorte haben einen Namen, der nicht eindeutig sein muss, und können leer sein. Jede Wartung mit Datum und Notiz betrifft genau ein Gerät. Geräte können noch keine Wartung haben; mehrere Wartungen am selben Tag sind erlaubt.</p>
    </header>
    <section className="space-y-3" aria-labelledby="db-model-title">
      <h3 id="db-model-title" className="font-semibold text-slate-100">1. Relationales Modell entwerfen · Selbstbewertung</h3>
      <p className="text-sm text-slate-300">Beschreibe Tabellen, Attribute, Primär- und Fremdschlüssel sowie minimale und maximale Kardinalitäten. Begründe deine Entscheidungen. Andere sinnvolle Namen, Schlüssel und normalisierte Modelle sind willkommen.</p>
      <label htmlFor="db-model" className="block text-sm text-slate-200">Dein relationales Modell und deine Begründung</label>
      <textarea id="db-model" rows={6} className={inputClass} value={reasoning} onChange={event => setReasoning(event.target.value)} aria-describedby="db-self-note" />
      <p id="db-self-note" className="text-sm text-slate-400">Keine automatische Bewertung: Text und Häkchen bleiben nur in dieser Sitzung und werden beim Neustart oder Verlassen verworfen. Sie vergeben keine Punkte.</p>
      <fieldset className="space-y-3"><legend className="mb-2 text-slate-200">Prüfe dein Modell</legend>
        {RUBRIC.map((criterion, index) => <label key={criterion} className="flex items-start gap-3 text-sm text-slate-300"><input type="checkbox" checked={ticks[index]} onChange={event => setTicks(previous => previous.map((v, i) => i === index ? event.target.checked : v))} /><span>{criterion}</span></label>)}
      </fieldset>
      <button className={buttonClass} aria-expanded={example} onClick={() => setExample(!example)}>Modellbeispiel anzeigen</button>
      {example && <p className="text-sm text-slate-300">Eine Möglichkeit: Standort(id PK, name), Gerät(id PK, inventarnummer UNIQUE, standort_id FK NOT NULL, status, angeschafft_am), Wartung(id PK, geraet_id FK NOT NULL, datum, notiz). Die Fremdschlüssel verhindern verwaiste Zuordnungen; ohne Löschkaskade bleiben referenzierte Datensätze geschützt. Alternativ kann etwa die Inventarnummer als Geräteschlüssel dienen, wenn ihre Stabilität gesichert ist. Dieses Beispiel bewertet dein eigenes Modell nicht.</p>}
    </section>
    <section className="space-y-3" aria-labelledby="db-sql-title">
      <h3 id="db-sql-title" className="font-semibold text-slate-100">2. SQL auf einem vorgegebenen Übungsschema</h3>
      <p className="text-sm text-slate-300">Für vergleichbare SQL-Prüfungen verwenden alle dieses Schema, unabhängig vom eigenen Entwurf. PostgreSQL läuft nur mit synthetischen Daten in deinem Browser. Jede Prüfung beginnt frisch; das UPDATE beeinflusst keine spätere Aufgabe.</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-xs text-slate-300"><code>{DATABASE_SCHEMA}</code></pre>
      <p className="text-sm text-slate-300">Zwei feste Testdatensätze prüfen alternative Queries. Nutze die geforderten Spaltennamen; ihre Spaltenreihenfolge ist frei. Duplikate zählen. Bei Aufgabe 1 zählt auch die Zeilenreihenfolge, bei Aufgabe 3 der gesamte Datenbestand. Genau eine SQL-Anweisung je Prüfung.</p>
      <p className="text-sm text-slate-300">Nur die erste abgeschlossene Prüfung jeder SQL-Aufgabe zählt pro Durchlauf (maximal drei). Weitere Prüfungen geben Rückmeldung ohne Punkte. Eine zuvor geöffnete SQL-Lösung macht diese Aufgabe ungewertet. Abbruch, Zeitlimit und technische Fehler zählen nicht.</p>
      {!isAuthenticated && <p className="text-sm text-amber-200">Als Gast übst du ohne gespeicherten Fortschritt.</p>}
      {DATABASE_TASKS.map((_, index) => <SqlTask key={`${run}-${index}`} index={index} isAuthenticated={isAuthenticated} onAttempt={onAttempt} />)}
    </section>
    <button className={buttonClass} onClick={() => { setRun(value => value + 1); setReasoning(''); setTicks(RUBRIC.map(() => false)); setExample(false); }}>Neuer Durchlauf</button>
  </section>;
}
