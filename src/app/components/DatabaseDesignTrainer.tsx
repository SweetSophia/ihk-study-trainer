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
const inputClass = 'w-full min-w-0 rounded-lg border border-control bg-canvas p-3 text-ink focus-visible:outline-2 focus-visible:outline-accent';
const buttonClass = 'rounded-lg border border-control px-4 py-2 text-sm text-ink disabled:bg-subtle disabled:text-muted disabled:border-line focus-visible:outline-2 focus-visible:outline-accent';

function SqlTask({ index, isAuthenticated, onAttempt }: { index: number; isAuthenticated: boolean; onAttempt: (correct: boolean) => void }) {
  const task = DATABASE_TASKS[index];
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('Noch keine aktuelle Prüfung.');
  const [feedbackKind, setFeedbackKind] = useState<'info' | 'correct' | 'incorrect' | 'unscored'>('info');
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const attempted = useRef(false);
  const exampleSeen = useRef(false);
  useEffect(() => () => { controller.current?.abort(); controller.current = null; }, []);
  function cancel(message = 'Abgebrochen. Ohne Wertung.') {
    controller.current?.abort(); controller.current = null;
    setBusy(false); setFeedbackKind('info'); setFeedback(message);
  }
  async function check() {
    if (controller.current || !query.trim()) return;
    const active = new AbortController(); controller.current = active;
    setBusy(true); setFeedbackKind('info'); setFeedback('Prüfung läuft … Abbruch nach etwa 30 Sekunden, sobald der Browser den Timer ausführt.');
    try {
      const result = await checkDatabaseTask(index, query, active.signal);
      if (controller.current !== active || active.signal.aborted) return;
      setFeedbackKind(result.correct ? 'correct' : 'incorrect');
      setFeedback(result.correct ? 'Beide Testdatensätze bestanden. Dies ist kein Beweis für alle möglichen Daten.' : `Nicht korrekt: ${result.message ?? 'Das Ergebnis oder der Datenbestand weicht ab. Prüfe Bedingungen, Spaltennamen, Reihenfolge und unveränderte Daten.'}`);
      if (!attempted.current) {
        attempted.current = true;
        if (!exampleSeen.current && isAuthenticated) onAttempt(result.correct);
      }
    } catch (error) {
      if (controller.current === active && !active.signal.aborted) {
        setFeedbackKind('unscored');
        setFeedback(`Ohne Wertung: ${error instanceof Error ? error.message : 'Prüfung fehlgeschlagen.'} Versuch nicht gewertet.`);
      }
    } finally {
      if (controller.current === active) { controller.current = null; setBusy(false); }
    }
  }
  return <section aria-labelledby={`db-task-${index}`} className="min-w-0 space-y-3 rounded-lg border border-line p-4">
    <h3 id={`db-task-${index}`} className="font-semibold text-ink">Aufgabe {index + 1}: {task.title}</h3>
    <p className="text-sm text-ink">{task.question}</p>
    <label htmlFor={`db-query-${index}`} className="block text-sm text-ink">SQL für Aufgabe {index + 1}</label>
    <textarea id={`db-query-${index}`} rows={5} spellCheck={false} className={`${inputClass} font-mono text-sm`} value={query}
      aria-describedby={`db-feedback-${index}`} onChange={event => { cancel('Noch keine aktuelle Prüfung. Nach Änderungen erneut prüfen.'); setQuery(event.target.value); }} />
    <div className="flex flex-wrap gap-3">
      <button className={buttonClass} disabled={busy || !query.trim()} onClick={check}>Aufgabe {index + 1} prüfen</button>
      {busy && <button className={buttonClass} onClick={() => cancel()}>Aufgabe {index + 1} abbrechen</button>}
      <button className={buttonClass} aria-expanded={revealed} aria-controls={`db-solution-${index}`} onClick={() => { exampleSeen.current = true; setRevealed(true); }}>Lösung für Aufgabe {index + 1} anzeigen (ohne Wertung)</button>
    </div>
    <p id={`db-feedback-${index}`} role="status" aria-live="polite" aria-atomic="true" className={`text-sm ${feedbackKind === 'correct' ? 'text-accent' : feedbackKind === 'incorrect' ? 'text-danger' : feedbackKind === 'unscored' ? 'text-warning' : 'text-ink'}`}>{feedback}</p>
    {revealed && <div id={`db-solution-${index}`} className="space-y-2">
      <p className="text-sm text-warning">Eine mögliche Query. Diese Aufgabe bleibt für den restlichen Durchlauf ohne weitere Wertung.</p>
      <pre className="whitespace-pre-wrap break-words text-sm text-ink"><code>{task.solution}</code></pre>
    </div>}
  </section>;
}

export default function DatabaseDesignTrainer({ isAuthenticated, onAttempt }: { isAuthenticated: boolean; onAttempt: (correct: boolean) => void }) {
  const [run, setRun] = useState(0);
  const [reasoning, setReasoning] = useState('');
  const [ticks, setTicks] = useState<boolean[]>(RUBRIC.map(() => false));
  const [example, setExample] = useState(false);
  return <section aria-labelledby="db-title" className="min-w-0 space-y-6 rounded-xl border border-line bg-surface p-4 sm:p-6">
    <header className="space-y-3">
      <h2 id="db-title" className="text-xl font-bold text-ink">AP2 Datenbankentwurf & SQL</h2>
      <p className="text-sm text-muted">Eigene Übungsaufgabe · Handwerksbetrieb in Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
      <p className="text-ink">Ein fiktiver Betrieb verwaltet Standorte, Geräte und Wartungsdatensätze. Jedes Gerät besitzt eine eindeutige Inventarnummer, einen Status und ein Anschaffungsdatum und gehört genau einem Standort. Standorte haben einen Namen, der nicht eindeutig sein muss, und können leer sein. Jede Wartung mit Datum und Notiz betrifft genau ein Gerät. Geräte können noch keine Wartung haben; mehrere Wartungen am selben Tag sind erlaubt.</p>
    </header>
    <section className="space-y-3" aria-labelledby="db-model-title">
      <h3 id="db-model-title" className="font-semibold text-ink">1. Relationales Modell entwerfen · Selbstbewertung</h3>
      <p className="text-sm text-ink">Beschreibe Tabellen, Attribute, Primär- und Fremdschlüssel sowie minimale und maximale Kardinalitäten. Begründe deine Entscheidungen. Andere sinnvolle Namen, Schlüssel und normalisierte Modelle sind willkommen.</p>
      <label htmlFor="db-model" className="block text-sm text-ink">Dein relationales Modell und deine Begründung</label>
      <textarea id="db-model" rows={6} className={inputClass} value={reasoning} onChange={event => setReasoning(event.target.value)} aria-describedby="db-self-note" />
      <p id="db-self-note" className="text-sm text-muted">Keine automatische Bewertung: Text und Häkchen bleiben nur in dieser Sitzung und werden beim Neustart oder Verlassen verworfen. Sie vergeben keine Punkte.</p>
      <fieldset className="space-y-3"><legend className="mb-2 text-ink">Prüfe dein Modell</legend>
        {RUBRIC.map((criterion, index) => <label key={criterion} className="flex items-start gap-3 text-sm text-ink"><input type="checkbox" checked={ticks[index]} onChange={event => setTicks(previous => previous.map((v, i) => i === index ? event.target.checked : v))} /><span>{criterion}</span></label>)}
      </fieldset>
      <button className={buttonClass} aria-expanded={example} aria-controls="db-model-example" onClick={() => setExample(!example)}>{example ? 'Modellbeispiel verbergen' : 'Modellbeispiel anzeigen'}</button>
      {example && <p id="db-model-example" className="text-sm text-ink">Eine Möglichkeit: Standort(id PK, name), Gerät(id PK, inventarnummer UNIQUE, standort_id FK NOT NULL, status, angeschafft_am), Wartung(id PK, geraet_id FK NOT NULL, datum, notiz). Die Fremdschlüssel verhindern verwaiste Zuordnungen; ohne Löschkaskade bleiben referenzierte Datensätze geschützt. Alternativ kann etwa die Inventarnummer als Geräteschlüssel dienen, wenn ihre Stabilität gesichert ist. Dieses Beispiel bewertet dein eigenes Modell nicht.</p>}
    </section>
    <section className="space-y-3" aria-labelledby="db-sql-title">
      <h3 id="db-sql-title" className="font-semibold text-ink">2. SQL auf einem vorgegebenen Übungsschema</h3>
      <p className="text-sm text-ink">Für vergleichbare SQL-Prüfungen verwenden alle dieses Schema, unabhängig vom eigenen Entwurf. PostgreSQL läuft nur mit synthetischen Daten in deinem Browser. Jede Prüfung beginnt frisch; das UPDATE beeinflusst keine spätere Aufgabe.</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-canvas p-3 text-xs text-ink"><code>{DATABASE_SCHEMA}</code></pre>
      <p className="text-sm text-ink">Zwei feste Testdatensätze prüfen alternative Queries. Nutze die geforderten Spaltennamen; ihre Spaltenreihenfolge ist frei. Duplikate zählen. Bei Aufgabe 1 zählt auch die Zeilenreihenfolge, bei Aufgabe 3 der gesamte Datenbestand. Genau eine SQL-Anweisung je Prüfung. Der Abbruch-Timer kann bei pausierten oder im Hintergrund laufenden Browsern verzögert sein; er begrenzt nicht den Speicherbedarf einer Query.</p>
      <p className="text-sm text-ink">Nur die erste abgeschlossene Prüfung jeder SQL-Aufgabe zählt pro Durchlauf (maximal drei). Weitere Prüfungen geben Rückmeldung ohne Punkte. Eine zuvor geöffnete SQL-Lösung macht diese Aufgabe ungewertet. Abbruch, Zeitlimit und technische Fehler zählen nicht.</p>
      {!isAuthenticated && <p className="text-sm text-warning">Als Gast übst du ohne gespeicherten Fortschritt. Beim Anmelden wird dieser Durchlauf zurückgesetzt: Modelltext, Häkchen und SQL-Eingaben gehen verloren. Melde dich vor dem Bearbeiten an, wenn du Fortschritt speichern möchtest.</p>}
      {DATABASE_TASKS.map((_, index) => <SqlTask key={`${run}-${index}`} index={index} isAuthenticated={isAuthenticated} onAttempt={onAttempt} />)}
    </section>
    <button className={buttonClass} onClick={() => { setRun(value => value + 1); setReasoning(''); setTicks(RUBRIC.map(() => false)); setExample(false); }}>Neuer Durchlauf</button>
  </section>;
}
