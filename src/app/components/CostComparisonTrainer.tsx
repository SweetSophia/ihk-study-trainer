'use client';

import { useRef, useState } from 'react';
import type { TrainingRunContext } from '../lib/trainingRun';
import { COST_FIELDS, validateCostAnswers, type CostAnswers, type CostSection } from '../lib/costComparison';

type Props = { isAuthenticated: boolean; onAttempt: (correct: boolean) => void; trainingRun?: TrainingRunContext };
const inputClass = 'w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 p-2 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const buttonClass = 'rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const euro = (cents: number) => (cents / 100).toLocaleString('de-DE', { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 });

function ObjectiveSection({ section, isAuthenticated, onAttempt, trainingRun }: Props & { section: CostSection }) {
  const [answers, setAnswers] = useState<CostAnswers>({});
  const [result, setResult] = useState<ReturnType<typeof validateCostAnswers> | null>(null);
  const [example, setExample] = useState(false);
  const attempted = useRef(false);
  const revealed = useRef(false);
  const prefix = `cost-${section}`;
  const title = section === 'comparison' ? '1. Kosten nach 36 Monaten' : '2. Erster günstigerer Monat';
  const action = section === 'comparison' ? 'Kostenvergleich' : 'Monatsgrenze';
  function edit(key: string, value: string) {
    setAnswers(old => ({ ...old, [key]: value }));
    setResult(null);
    trainingRun?.onEvent({ type: 'edit', section });
  }
  function numericField(key: string, label: string, whole = false) {
    const error = result?.errors[key];
    const id = `${prefix}-${key}`;
    return <div key={key}>
      <label htmlFor={id} className="block text-sm">{label}</label>
      <input id={id} inputMode={whole ? 'numeric' : 'decimal'} className={inputClass} value={answers[key] ?? ''}
        onChange={e => edit(key, e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
      {error && <p id={`${id}-error`} className="text-sm text-rose-200">{error}</p>}
    </div>;
  }
  return <section aria-labelledby={`${prefix}-title`} className="space-y-4 rounded-lg border border-slate-700 p-4">
    <h3 id={`${prefix}-title`} className="font-semibold">{title}</h3>
    <p>{section === 'comparison'
      ? 'Berechne die Gesamtkosten beider Optionen und den absoluten Unterschied nach 36 vollständig abgerechneten Monaten. Wähle die rein rechnerisch günstigere Option.'
      : 'Gesucht ist der erste vollständig abgerechnete Monat, nach dem der eigene Server strikt günstiger ist. Prüfe die Grenze zusätzlich anhand der Gesamtkosten nach 31 und 32 Monaten. Gleich hohe Kosten gelten nicht als günstiger.'}</p>
    <form noValidate className="space-y-4" onSubmit={event => {
      event.preventDefault();
      const next = validateCostAnswers(section, answers);
      setResult(next);
      trainingRun?.onEvent({ type: 'check', section, correct: next.valid });
      if (!attempted.current) {
        attempted.current = true;
        if (isAuthenticated && !revealed.current) onAttempt(next.valid);
      }
    }}>
      {section === 'crossover' && numericField('month', 'Erster strikt günstigerer Monat', true)}
      <div className="grid gap-4 sm:grid-cols-2">{COST_FIELDS[section].map(field => numericField(field.key, field.label))}</div>
      {section === 'comparison' && <div>
        <label htmlFor={`${prefix}-cheaper`} className="block text-sm">Günstigere Option nach 36 Monaten</label>
        <select id={`${prefix}-cheaper`} className={inputClass} value={answers.cheaper ?? ''} onChange={e => edit('cheaper', e.target.value)}
          aria-invalid={!!result?.errors.cheaper} aria-describedby={result?.errors.cheaper ? `${prefix}-cheaper-error` : undefined}>
          <option value="">Bitte wählen</option><option value="own">Eigener Server</option><option value="managed">Managed Service</option>
        </select>
        {result?.errors.cheaper && <p id={`${prefix}-cheaper-error`} className="text-sm text-rose-200">{result.errors.cheaper}</p>}
      </div>}
      <p role="status" className={result ? (result.valid ? 'text-emerald-200' : 'text-rose-200') : 'text-slate-400'}>
        {`${action}: ${result ? (result.valid ? 'Korrekt für die vorgegebenen Kostenannahmen.' : 'Bitte die markierten Eingaben prüfen.') : 'Noch keine aktuelle Prüfung.'}`}
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={buttonClass}>{action} prüfen</button>
        <button type="button" className={buttonClass} aria-expanded={example} aria-controls={`${prefix}-solution`}
          onClick={() => { revealed.current = true; trainingRun?.onEvent({ type: 'reveal', section }); setExample(!example); }}>{action}: Lösung {example ? 'verbergen' : 'anzeigen'}</button>
      </div>
      {example && <div id={`${prefix}-solution`} className="space-y-2 text-sm text-slate-300">
        <p>{section === 'comparison'
          ? 'K(m) = Anfangskosten + m × Monatskosten. Eigener Server: 4.800 + 36 × 120 = 9.120 €. Managed Service: 400 + 36 × 260 = 9.760 €. Unterschied: 640 € zugunsten des eigenen Servers.'
          : '4.800 + 120m < 400 + 260m ergibt 4.400 < 140m, also m > 31,428571… . Der erste ganze Monat ist 32. Bei Monat 31 ist der Managed Service noch 60 € günstiger; bei Monat 32 der eigene Server 80 € günstiger.'}</p>
        {COST_FIELDS[section].map(field => <p key={field.key}>{field.label}: {euro(field.expected)}</p>)}
        <p>Eine vor der ersten Prüfung angezeigte Lösung macht diesen Abschnitt für den restlichen Durchlauf ungewertet.</p>
      </div>}
    </form>
  </section>;
}

const RUBRIC = [
  'Ich prüfe, ob Leistungsumfang, Verfügbarkeit und Wiederherstellungsziele wirklich vergleichbar sind.',
  'Ich berücksichtige Personalaufwand, Verantwortlichkeiten, Vertragslaufzeit, Kündigung und Datenexport.',
  'Ich benenne Grenzen des Kostenmodells und fehlende Kosten oder Risiken, bevor ich eine reale Empfehlung abgebe.',
];

export default function CostComparisonTrainer(props: Props) {
  const [run, setRun] = useState(0);
  const [reasoning, setReasoning] = useState('');
  const [ticks, setTicks] = useState<boolean[]>(RUBRIC.map(() => false));
  const [example, setExample] = useState(false);
  return <section aria-labelledby="cost-title" className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-200 sm:p-6">
    <h2 id="cost-title" className="text-xl font-bold">AP2 Wirtschaftlichkeit</h2>
    <p>IT-Kosten vergleichen · eigene Übungsaufgabe · Schwerpunkt Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
    <p>Eine fiktive Werkstatt vergleicht zwei Dateidienst-Angebote. Gleicher funktionaler Leistungsumfang wird für dieses Rechenmodell vorausgesetzt; dies ist keine Aussage über reale Angebote.</p>
    <ul className="space-y-2"><li>Eigener Server: 4.800 € einmalig + 120 € pro Monat.</li><li>Managed Service: 400 € einmalig + 260 € pro Monat.</li></ul>
    <p>Anfangskosten zum Zeitpunkt 0; Monatskosten jeweils am Ende jedes vollständig abgerechneten Monats. Alle Beträge sind netto und konstant. Steuern, Finanzierung, Abzinsung, Restwerte und nicht genannte Kosten bleiben ausdrücklich unberücksichtigt. Dies ist ein vereinfachter Kostenvergleich, keine vollständige Erfassung aller realen Betriebskosten.</p>
    <p className="text-sm">Eurobeträge ohne Tausendertrennzeichen eingeben, mit Komma oder Punkt und höchstens zwei Nachkommastellen (z. B. 1200,50). Monatszahlen müssen ganze Zahlen sein. Gleichwertige Rechenwege sind möglich; geprüft werden die Ergebnisse.</p>
    <p className="text-sm">Nur die erste abgeschlossene Prüfung je Abschnitt zählt pro Durchlauf (maximal zwei), auch eine leere oder fehlerhafte Abgabe. Weitere Prüfungen geben Rückmeldung ohne zusätzliche Punkte. Eine vor der ersten Prüfung angezeigte Lösung macht nur den betreffenden Abschnitt ungewertet, auch nach dem Verbergen. Begründung und Selbstbewertung vergeben nie Punkte.</p>
    <p className="text-sm text-amber-200">Beim Anmelden oder Wechseln des Kontos wird dieser Durchlauf zurückgesetzt. {props.trainingRun ? 'Beim Aufgabenwechsel innerhalb des Trainingslaufs bleiben Eingaben, Häkchen und Lösungen erhalten; beim Verlassen des Trainingslaufs gehen sie verloren.' : 'Eingaben, Häkchen und Lösungen bleiben nur in dieser Sitzung; auch beim Verlassen gehen sie verloren.'} {props.isAuthenticated ? 'Nur objektive Versuche werden als Fortschritt gespeichert.' : 'Als Gast wird kein Fortschritt gespeichert. Melde dich vor dem Bearbeiten an, wenn du Fortschritt speichern möchtest.'}</p>
    <ObjectiveSection key={`comparison-${run}`} section="comparison" {...props} />
    <ObjectiveSection key={`crossover-${run}`} section="crossover" {...props} />
    <section aria-labelledby="cost-reasoning-title" className="space-y-3">
      <h3 id="cost-reasoning-title" className="font-semibold">3. Empfehlung begründen · Selbstbewertung</h3>
      <label htmlFor="cost-reasoning">Empfehlung und Grenzen</label>
      <textarea id="cost-reasoning" rows={5} className={inputClass} value={reasoning} onChange={e => setReasoning(e.target.value)} aria-describedby="cost-self-note" />
      <p id="cost-self-note">Keine automatische Bewertung. Andere begründete Empfehlungen sind möglich; der rechnerische Kostenvergleich allein entscheidet nicht über die beste Betriebslösung.</p>
      <fieldset className="space-y-3"><legend>Selbstbewertung</legend>{RUBRIC.map((text, i) => <label key={text} className="flex gap-2"><input type="checkbox" checked={ticks[i]} onChange={e => setTicks(old => old.map((v, j) => i === j ? e.target.checked : v))} />{text}</label>)}</fieldset>
      <button className={buttonClass} aria-expanded={example} aria-controls="cost-reasoning-example" onClick={() => setExample(!example)}>Begründungsbeispiel {example ? 'verbergen' : 'anzeigen'}</button>
      {example && <p id="cost-reasoning-example">Eine Möglichkeit: Vor einer realen Empfehlung würde ich bei beiden Angeboten Wiederherstellungszeiten, internen Betreuungsaufwand, Vertragsbedingungen und Datenexport vergleichen. Ein höherer Preis kann bei anderen Anforderungen gerechtfertigt sein; fehlende Kosten müssten ergänzt werden.</p>}
    </section>
    {!props.trainingRun && <button className={buttonClass} onClick={() => { setRun(v => v + 1); setReasoning(''); setTicks(RUBRIC.map(() => false)); setExample(false); }}>Neuer Durchlauf</button>}
  </section>;
}
