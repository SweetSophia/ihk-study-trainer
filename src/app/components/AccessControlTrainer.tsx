'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ACCESS_CHOICES, CORRECTION_CHOICES, FOLDERS, GROUPS, PEOPLE, VERIFICATION_CHOICES, effectiveAccess, validateCorrection, validateEffectiveAccess, type Validation } from '../lib/accessControl';

type Props = { isAuthenticated: boolean; onAttempt: (correct: boolean) => void };
type Section = 'matrix' | 'correction';
const inputClass = 'w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 p-2 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
const buttonClass = 'rounded-lg border border-slate-600 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-emerald-400';
const RUBRIC = [
  'Ich leite die nötigen Rechte aus den Aufgaben ab und vergebe nicht mehr als erforderlich.',
  'Ich hole die zuständige Freigabe ein und dokumentiere Ausgangszustand, Änderung und Rücknahmeplan.',
  'Ich prüfe erlaubte und verweigerte Operationen sowie unveränderte Zugriffe anderer Personen und dokumentiere tatsächliche Ergebnisse.',
];

export default function AccessControlTrainer({ isAuthenticated, onAttempt }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Partial<Record<Section, Validation>>>({});
  const [shown, setShown] = useState({ matrix: false, correction: false });
  const attempted = useRef({ matrix: false, correction: false });
  const revealed = useRef({ matrix: false, correction: false });
  const [reasoning, setReasoning] = useState('');
  const [ticks, setTicks] = useState(RUBRIC.map(() => false));
  const [reasonExample, setReasonExample] = useState(false);

  function field(section: Section, key: string, label: string, options: readonly { value: string; label: string }[]) {
    const id = `access-${key}`;
    const error = results[section]?.errors[key];
    const selected = options.find(option => option.value === answers[key]);
    return <div key={key} className="min-w-0">
      <label htmlFor={id} className="block text-sm">{label}</label>
      <select id={id} className={inputClass} value={answers[key] ?? ''} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
        onChange={event => { setAnswers(old => ({ ...old, [key]: event.target.value })); setResults(old => ({ ...old, [section]: undefined })); }}>
        <option value="">Bitte wählen</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {selected && <p aria-hidden="true" className="mt-1 break-words text-sm text-slate-300">Auswahl: {selected.label}</p>}
      {error && <p id={`${id}-error`} className="text-sm text-rose-200">{error}</p>}
    </div>;
  }
  function objective(section: Section, title: string, children: ReactNode, solution: ReactNode) {
    const action = section === 'matrix' ? 'Zugriffe' : 'Korrektur';
    const result = results[section];
    return <section aria-labelledby={`access-${section}-title`} className="space-y-4 rounded-lg border border-slate-700 p-4">
      <h3 id={`access-${section}-title`} className="font-semibold">{title}</h3>
      <form noValidate className="space-y-4" onSubmit={event => {
        event.preventDefault();
        const next = section === 'matrix' ? validateEffectiveAccess(answers) : validateCorrection(answers);
        setResults(old => ({ ...old, [section]: next }));
        if (!attempted.current[section]) {
          attempted.current[section] = true;
          if (isAuthenticated && !revealed.current[section]) onAttempt(next.valid);
        }
      }}>
        {children}
        <p role="status" className={result ? (result.valid ? 'text-emerald-200' : 'text-rose-200') : 'text-slate-400'}>
          {action}: {result ? (result.valid ? 'Korrekt für das vorgegebene Modell.' : 'Bitte die markierten Eingaben prüfen.') : 'Noch keine aktuelle Prüfung.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={buttonClass}>{action} prüfen</button>
          <button type="button" className={buttonClass} aria-expanded={shown[section]} aria-controls={`access-${section}-solution`}
            onClick={() => { revealed.current[section] = true; setShown(old => ({ ...old, [section]: !old[section] })); }}>{action}: Lösung {shown[section] ? 'verbergen' : 'anzeigen'}</button>
        </div>
        {shown[section] && <div id={`access-${section}-solution`} className="space-y-2 text-sm text-slate-300">{solution}<p>Eine vor der ersten Prüfung angezeigte Lösung macht diesen Abschnitt für den restlichen Durchlauf ungewertet, auch nach dem Verbergen.</p></div>}
      </form>
    </section>;
  }
  return <section aria-labelledby="access-title" className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-200 sm:p-6">
    <h2 id="access-title" className="text-xl font-bold">AP2 Berechtigungen: Zugriffe prüfen und sicher korrigieren</h2>
    <p>Eigene fiktive Übung · Schwerpunkt Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
    <p>Ein Handwerksbetrieb prüft die Gruppenrechte seiner Projektablage. Bestimme zuerst die aktuellen Zugriffe, danach eine begrenzte Korrektur und passende Kontrollen. Es werden keine echten Berechtigungen verändert, Befehle ausgeführt oder Konten bearbeitet.</p>
    <p>Nur für dieses Lehrmodell: Positive Gruppengewährungen werden kombiniert. Bearbeiten umfasst Lesen und Schreiben von Testdateien; Lesen allein erlaubt keine Bearbeitung. Ohne Gewährung besteht kein Zugriff. Es gibt keine individuellen Rechte, Vererbung, ausdrücklichen Verbote oder Administrator-Ausnahmen. Dies ist kein vollständiges Windows-/Linux-ACL-Modell.</p>
    <section aria-labelledby="access-grants-title" className="space-y-3">
      <h3 id="access-grants-title" className="font-semibold">Vorgegebene Gruppen und aktuelle Mitgliedschaften</h3>
      <ul className="space-y-2">{GROUPS.map(group => <li key={group.id} className="rounded-lg border border-slate-700 p-3"><strong>{group.label}</strong>: {FOLDERS.map(folder => `${folder.label}: ${group.rights[folder.id] === 'none' ? 'keine Gewährung' : ACCESS_CHOICES.find(choice => choice.value === group.rights[folder.id])!.label}`).join(' · ')}</li>)}</ul>
      <ul className="space-y-1">{PEOPLE.map(person => <li key={person.id}>{person.label}: {person.groups.map(id => GROUPS.find(group => group.id === id)!.label).join(' und ')}</li>)}</ul>
    </section>
    <p className="text-sm">Nur die erste abgeschlossene Prüfung je Abschnitt zählt pro Durchlauf (maximal zwei), auch eine leere oder falsche Abgabe. Weitere Prüfungen geben Rückmeldung ohne zusätzliche Punkte. Eine vorher angezeigte Lösung macht nur den betreffenden Abschnitt ungewertet. Begründung und Selbstbewertung vergeben nie Punkte.</p>
    <p className="text-sm text-amber-200">Beim Anmelden oder Kontowechsel wird dieser Durchlauf zurückgesetzt. Eingaben, Häkchen und Lösungen bleiben nur in dieser Sitzung und gehen beim Neuladen oder Verlassen verloren. {isAuthenticated ? 'Nur objektive Versuche werden als Themenfortschritt gespeichert.' : 'Als Gast wird kein Fortschritt gespeichert. Melde dich vor dem Bearbeiten an, wenn du Fortschritt speichern möchtest.'}</p>
    {objective('matrix', '1. Effektive Zugriffe bestimmen', <>
      <p>Gesucht sind die aktuellen effektiven Rechte aus den oben genannten Mitgliedschaften, nicht die gewünschten Rechte nach einer Korrektur. Für jede Person und jeden Ordner genau einen Zugriffsstand wählen.</p>
      {PEOPLE.map(person => <fieldset key={person.id} className="rounded-lg border border-slate-700 p-3"><legend>{person.label}</legend><div className="grid gap-3 sm:grid-cols-2">{FOLDERS.map(folder => field('matrix', `${person.id}.${folder.id}`, `${person.label} · ${folder.label}`, ACCESS_CHOICES))}</div></fieldset>)}
    </>, <>{PEOPLE.map(person => <p key={person.id}>{person.label}: {FOLDERS.map(folder => `${folder.label}: ${ACCESS_CHOICES.find(choice => choice.value === effectiveAccess(person.groups, folder.id))!.label}`).join(' · ')}</p>)}<p>Überlappende Gewährungen werden kombiniert; eine zusätzliche Gruppe nimmt kein bereits gewährtes Recht weg.</p></>)}
    {objective('correction', '2. Korrektur und Kontrolle planen', <>
      <p>Genehmigte Sollrechte: Lea darf Aufträge bearbeiten und hat keinen Zugriff auf Personalakten. Tom darf Aufträge nur lesen und hat keinen Zugriff auf Personalakten. Mira darf Personalakten bearbeiten und hat keinen Zugriff auf Aufträge.</p>
      <p>Ändere möglichst wenig. Erlaubt sind ausschließlich Änderungen an Toms Gruppenmitgliedschaften; keine neuen Gruppen, individuellen Gewährungen, Änderungen von Gruppenrechten oder anderen Personen. Wähle einen Plan, der alle Sollrechte erfüllt, sowie eine ausreichende geplante Kontrolle.</p>
      {field('correction', 'plan', 'Kleinste zulässige Korrektur', CORRECTION_CHOICES)}
      {field('correction', 'verification', 'Geplante Kontrolle', VERIFICATION_CHOICES)}
      <p>Die Auswahl plant eine Änderung und ihre Tests. Es liegen noch keine tatsächlichen Ergebnisse nach einer Änderung vor; eine passende Konfiguration allein beweist keinen erfolgreichen Betrieb.</p>
    </>, <><p>Tom nur aus Personal entfernen; Werkstatt bleibt erhalten. Im Modell kann er danach Aufträge weiterhin lesen, dort nicht bearbeiten und auf Personalakten nicht zugreifen. Lea und Mira behalten ihre Rechte.</p><p>Mit kontrollierten Testdateien als jede normale Person beide Ordner prüfen: gewünschtes Lesen/Bearbeiten muss funktionieren, nicht erlaubte Operationen müssen verweigert werden. Auch die unveränderten Zugriffe von Lea und Mira prüfen und tatsächliche Ergebnisse dokumentieren; nicht nur als Administrator testen.</p></>)}
    <section aria-labelledby="access-reasoning-title" className="space-y-3">
      <h3 id="access-reasoning-title" className="font-semibold">3. Änderung begründen · Selbstbewertung</h3>
      <label htmlFor="access-reasoning">Freigabe, Dokumentation und Rücknahme</label>
      <textarea id="access-reasoning" rows={5} className={inputClass} value={reasoning} onChange={event => setReasoning(event.target.value)} aria-describedby="access-self-note" />
      <p id="access-self-note">Keine automatische Bewertung. Begründe Least Privilege, Freigabe, Tests, Dokumentation und Rücknahme. Andere fachlich begründete reale Berechtigungskonzepte sind willkommen; sie werden hier nicht als beliebige ACL-Entwürfe automatisch geprüft.</p>
      <fieldset className="space-y-3"><legend>Selbstbewertung</legend>{RUBRIC.map((text, index) => <label key={text} className="flex gap-2"><input type="checkbox" checked={ticks[index]} onChange={event => setTicks(old => old.map((value, i) => i === index ? event.target.checked : value))} />{text}</label>)}</fieldset>
      <button className={buttonClass} aria-expanded={reasonExample} aria-controls="access-reasoning-example" onClick={() => setReasonExample(!reasonExample)}>Begründungsbeispiel {reasonExample ? 'verbergen' : 'anzeigen'}</button>
      {reasonExample && <p id="access-reasoning-example">Eine Möglichkeit: Vor einer Änderung genehmigte Sollrechte und minimalen Änderungsumfang festhalten. Zustimmung der zuständigen Rolle einholen, kontrolliert testen und Ist-Ergebnisse mit den Erwartungen vergleichen. Bei Abweichungen Ursachen prüfen, gegebenenfalls abgestimmt zurücknehmen und erneut testen. Die praktische Umsetzung kann je nach System anders aussehen.</p>}
    </section>
    <button className={buttonClass} onClick={() => { setAnswers({}); setResults({}); setShown({ matrix: false, correction: false }); attempted.current = { matrix: false, correction: false }; revealed.current = { matrix: false, correction: false }; setReasoning(''); setTicks(RUBRIC.map(() => false)); setReasonExample(false); }}>Neuer Durchlauf</button>
  </section>;
}
