'use client';

import { useRef, useState } from 'react';
import CostComparisonTrainer from './CostComparisonTrainer';
import TroubleshootingTrainer from './TroubleshootingTrainer';
import BackupRecoveryTrainer from './BackupRecoveryTrainer';
import { observeObjective, RUN_TOPICS, type ObjectiveEvent, type RunResults, type RunTopic } from '../lib/trainingRun';

type Props = { isAuthenticated: boolean; onAttempt: (module: RunTopic, correct: boolean) => void };
const buttonClass = 'rounded-lg border border-slate-600 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-emerald-400';

export default function TrainingRun(props: Props) {
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0);
  const [results, setResults] = useState<RunResults>({});
  const [confirmReset, setConfirmReset] = useState(false);
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);
  function navigate(index: number) {
    setActive(index);
    setConfirmReset(false);
    // The heading is mounted even while hidden. Focus only after React reveals it.
    requestAnimationFrame(() => headings.current[index]?.focus());
  }
  function context(topic: RunTopic) {
    return { onEvent: (event: ObjectiveEvent) => setResults(old => observeObjective(old, topic, event)) };
  }
  const observations = Object.values(results);
  const graded = observations.filter(item => item?.first && !item.first.unscored);
  const correct = graded.filter(item => item?.first?.correct).length;
  const checked = observations.filter(item => item?.first).length;
  return <section aria-labelledby="training-run-title" className="space-y-5 text-slate-200">
    <h2 id="training-run-title" className="text-2xl font-bold">AP2-Trainingslauf: IT-Service betreiben</h2>
    <p>Drei bestehende, voneinander unabhängige Übungsszenarien: Wirtschaftlichkeit, Fehlersuche und Datensicherung. Kein Prüfungssimulator, keine Zeitvorgabe und keine offizielle Gleichwertigkeit mit einer IHK- oder Baden-Württemberg-Prüfung.</p>
    <p className="text-sm text-amber-200">Aufgabenwechsel und Auswertung innerhalb dieses Trainingslaufs erhalten Antworten, Rückmeldungen, Lösungen und Selbstbewertung. Neuladen, Verlassen dieses Moduls, Anmelden oder Kontowechsel setzen den laufenden Trainingslauf zurück. Es gibt keine gespeicherten Aufgabenentwürfe und keine geräteübergreifende Fortsetzung.</p>
    <p className="text-sm">Nur die erste abgeschlossene Prüfung je Abschnitt zählt, auch eine falsche oder leere Abgabe (maximal sechs). Vorher angezeigte Lösungen machen den Abschnitt ungewertet. Korrekturen und Wiederholungen verändern die Erstprüfung nicht. {props.isAuthenticated ? 'Versuche werden nur bei den ursprünglichen Themen gespeichert, nicht zusätzlich als Trainingslauf. Die Auswertung bestätigt keine erfolgreiche Speicherung.' : 'Als Gast werden Ergebnisse nur hier angezeigt und nicht gespeichert.'}</p>
    <nav aria-label="Aufgaben im Trainingslauf" className="flex flex-wrap gap-2">
      {[...RUN_TOPICS.map((topic, i) => `${i + 1}. ${topic.label}`), 'Auswertung'].map((label, index) =>
        <button key={label} className={buttonClass} aria-current={active === index ? 'step' : undefined} aria-controls={`run-panel-${index}`} onClick={() => navigate(index)}>{label}</button>)}
    </nav>
    {RUN_TOPICS.map((topic, index) => <div key={`${run}-${topic.id}`} id={`run-panel-${index}`} hidden={active !== index}>
      <h3 ref={node => { headings.current[index] = node; }} tabIndex={-1} className="mb-3 font-semibold focus-visible:outline-2 focus-visible:outline-emerald-400">Aufgabe {index + 1}: {topic.label}</h3>
      {topic.id === 'ap2CostComparison' ? <CostComparisonTrainer isAuthenticated={props.isAuthenticated} onAttempt={value => props.onAttempt(topic.id, value)} trainingRun={context(topic.id)} />
        : topic.id === 'ap2Troubleshooting' ? <TroubleshootingTrainer isAuthenticated={props.isAuthenticated} onAttempt={value => props.onAttempt(topic.id, value)} trainingRun={context(topic.id)} />
          : <BackupRecoveryTrainer isAuthenticated={props.isAuthenticated} onAttempt={value => props.onAttempt(topic.id, value)} trainingRun={context(topic.id)} />}
    </div>)}
    <section id="run-panel-3" hidden={active !== 3} aria-labelledby="run-summary-title" className="space-y-4 rounded-xl border border-slate-700 p-4">
      <h3 id="run-summary-title" ref={node => { headings.current[3] = node; }} tabIndex={-1} className="text-xl font-semibold">Gemeinsame Auswertung</h3>
      <p>{checked} von 6 Abschnitten geprüft · {6 - checked} noch offen.</p>
      <p>{correct} von {graded.length} gewerteten Erstprüfungen korrekt. {observations.filter(item => item?.first?.unscored).length} geprüfte Abschnitte nach Lösungshinweis ungewertet.</p>
      {RUN_TOPICS.map((topic, index) => <section key={topic.id} aria-label={`${topic.label}: Ergebnisse`} className="space-y-3">
        <h4 className="font-semibold">{topic.label}</h4>
        {topic.sections.map(section => {
          const observation = results[`${topic.id}:${section.id}`];
          return <section key={section.id} aria-label={section.label} className="rounded-lg border border-slate-700 p-3">
            <h5 className="font-medium">{section.label}</h5>
            <p>{observation?.first ? `Erste Prüfung: ${observation.first.correct ? 'korrekt' : 'nicht korrekt'}.` : 'Noch keine erste Prüfung.'} {observation?.first?.unscored ? 'Ungewertet: Lösung vor der ersten Prüfung.' : !observation?.first && observation?.revealed ? 'Lösung bereits angezeigt: erste Prüfung wird ungewertet.' : ''}</p>
            <p>Aktuell: {observation?.latest === undefined ? (observation?.first ? 'nach Änderung ungeprüft' : 'ungeprüft') : observation.latest ? 'korrekt' : 'nicht korrekt'}.</p>
          </section>;
        })}
        <p>{topic.sections.some(section => { const item = results[`${topic.id}:${section.id}`]; return !item?.first || !item.first.correct || item.first.unscored || item.latest !== true; })
          ? 'Wiederholung empfohlen: offene, ungewertete oder fehlerhafte Abschnitte nacharbeiten. Bereits verbrauchte Erstprüfungen bleiben unverändert.'
          : 'Alle Erstprüfungen dieses Themas waren korrekt. Weitere Wiederholung ist ohne zusätzliche Punkte möglich.'}</p>
        <button className={buttonClass} onClick={() => navigate(index)}>{topic.label} weiterüben</button>
      </section>)}
      <p>Selbstbewertung: Begründungen und Rubrik-Häkchen bleiben in den Aufgaben erhalten; keine automatische Bewertung und keine Punkte. Vergleiche deine Überlegungen dort selbst mit der Rubrik.</p>
    </section>
    <button className={buttonClass} onClick={() => setConfirmReset(true)}>Neuen Trainingslauf starten</button>
    {confirmReset && <div role="group" aria-label="Trainingslauf neu starten" className="space-y-3 rounded-lg border border-amber-500 p-4">
      <p>Alle Sitzungseingaben und Ergebnisse dieses Trainingslaufs verwerfen? Bereits gespeicherter Themenfortschritt bleibt erhalten.</p>
      <div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => { setRun(old => old + 1); setResults({}); navigate(0); }}>Trainingslauf verwerfen und neu starten</button>
        <button className={buttonClass} onClick={() => setConfirmReset(false)}>Weiterarbeiten</button></div>
    </div>}
  </section>;
}
