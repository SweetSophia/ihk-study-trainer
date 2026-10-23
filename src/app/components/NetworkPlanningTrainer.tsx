'use client';

import { useRef, useState } from 'react';
import {
  NETWORK_EXAMPLE, NETWORK_GROUPS, NETWORK_PARENT, validateNetworkPlan,
  type AllocationField, type NetworkGroupId, type NetworkPlan, type NetworkPlanResult,
} from '../lib/networkPlanning';

const FIELDS: { key: AllocationField; label: string; hint: string }[] = [
  { key: 'network', label: 'Netzadresse', hint: 'IPv4, z. B. 192.168.40.0' },
  { key: 'prefix', label: 'Präfixlänge', hint: '0–32, ohne /' },
  { key: 'vlan', label: 'VLAN-ID', hint: 'Ganze Zahl 2–4094' },
];

const RUBRIC = [
  'Ich erkläre, dass VLANs getrennte Broadcast-Domänen schaffen, aber allein keine Firewall-Regeln ersetzen.',
  'Ich erlaube Gästen Internetzugang und sperre Verbindungen vom Gäste-Netz zu Büro und Werkstatt am Router bzw. an der Firewall.',
  'Ich berücksichtige DNS zum vorgesehenen Resolver sowie DHCP im Gäste-Netz (oder über einen gezielt konfigurierten Relay).',
  'Ich beschreibe konkrete Quellen, Ziele und Dienste sowie erlaubten Rückverkehr; sonstiger Verkehr bleibt gesperrt.',
];

function emptyPlan(): NetworkPlan {
  return {
    office: { network: '', prefix: '', vlan: '' },
    workshop: { network: '', prefix: '', vlan: '' },
    guest: { network: '', prefix: '', vlan: '' },
  };
}

interface NetworkPlanningTrainerProps {
  onAttempt: (correct: boolean) => void;
  isAuthenticated: boolean;
}

export default function NetworkPlanningTrainer({ onAttempt, isAuthenticated }: NetworkPlanningTrainerProps) {
  const [plan, setPlan] = useState<NetworkPlan>(emptyPlan);
  const [result, setResult] = useState<NetworkPlanResult | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [rubric, setRubric] = useState<boolean[]>(RUBRIC.map(() => false));
  const [showExample, setShowExample] = useState(false);
  // A ref closes the double-click window before React renders the next state.
  // Edits/rechecks do not reset it. Only an explicit new run starts a new attempt.
  const attempted = useRef(false);
  const exampleSeen = useRef(false);

  function changeField(group: NetworkGroupId, field: AllocationField, value: string) {
    setPlan(previous => ({ ...previous, [group]: { ...previous[group], [field]: value } }));
    setResult(null);
  }

  function checkPlan() {
    const nextResult = validateNetworkPlan(plan);
    setResult(nextResult);
    if (!attempted.current) {
      attempted.current = true;
      if (!exampleSeen.current && isAuthenticated) onAttempt(nextResult.valid);
    }
  }

  function newRun() {
    attempted.current = false;
    exampleSeen.current = false;
    setPlan(emptyPlan());
    setResult(null);
    setReasoning('');
    setRubric(RUBRIC.map(() => false));
    setShowExample(false);
  }

  const inputClass = 'w-full min-w-0 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';
  const secondaryButton = 'rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-400';

  return (
    <section aria-labelledby="network-planning-title" className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
      <header className="space-y-3">
        <h2 id="network-planning-title" className="text-xl font-bold text-slate-100">AP2 Netzwerkplanung</h2>
        <p className="text-sm text-slate-400">Eigene Übungsaufgabe · Schwerpunkt Baden-Württemberg · keine Original-Prüfungsaufgabe</p>
        <p className="text-slate-200">
          Ein fiktiver Handwerksbetrieb in Baden-Württemberg plant Büro, Werkstatt und Gäste-WLAN
          im Netz <strong className="font-mono">{NETWORK_PARENT}</strong>. Plane für jeden Bereich ein eigenes Teilnetz und VLAN.
        </p>
        <p className="text-sm text-slate-300">Die benötigten nutzbaren Adressen sind einschließlich jeweils einer Gateway-Adresse angegeben. Netz- und Broadcast-Adresse zählen nicht dazu.</p>
        <p className="text-sm text-slate-300">Erlaubt sind unterschiedliche, ganzzahlige VLAN-IDs von 2–4094; VLAN 1 bleibt in dieser Aufgabe frei. Teilnetze müssen ausgerichtet, ausreichend groß, vollständig im übergeordneten Netz und überschneidungsfrei sein. Größere passende Teilnetze sind erlaubt.</p>
      </header>

      <form noValidate onSubmit={event => { event.preventDefault(); checkPlan(); }} className="space-y-4" aria-label="Netzplanung">
        <h3 className="font-semibold text-slate-100">1. Teilnetze und VLANs planen</h3>
        {NETWORK_GROUPS.map(group => (
          <fieldset key={group.id} className="min-w-0 rounded-lg border border-slate-700 p-4">
            <legend className="px-2 font-medium text-slate-100">{group.label} · {group.hosts} nutzbare Adressen</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              {FIELDS.map(field => {
                const id = `network-plan-${group.id}-${field.key}`;
                const errors = result?.rows[group.id][field.key] ?? [];
                const conflictIds = result?.conflicts.flatMap((conflict, index) => {
                  const relevant = conflict.groups.includes(group.id) &&
                    (conflict.kind === 'vlan' ? field.key === 'vlan' : field.key !== 'vlan');
                  return relevant ? [`network-conflict-${index}`] : [];
                }) ?? [];
                return (
                  <div key={field.key} className="min-w-0 space-y-1">
                    <label htmlFor={id} className="block text-sm text-slate-200">{field.label}</label>
                    <input
                      id={id} type="text" inputMode={field.key === 'network' ? 'text' : 'numeric'}
                      autoComplete="off" spellCheck={false} value={plan[group.id][field.key]}
                      onChange={event => changeField(group.id, field.key, event.target.value)}
                      aria-invalid={errors.length > 0 || conflictIds.length > 0}
                      aria-describedby={[`${id}-hint`, ...(errors.length ? [`${id}-errors`] : []), ...conflictIds].join(' ')}
                      className={inputClass}
                    />
                    <p id={`${id}-hint`} className="text-xs text-slate-400">{field.hint}</p>
                    {errors.length > 0 && (
                      <ul id={`${id}-errors`} className="space-y-1 text-sm text-rose-300">
                        {errors.map(error => <li key={error}>{error}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
        <p className="text-sm text-slate-300">Nur die erste objektive Prüfung pro Durchlauf zählt zum Fortschritt. Weitere Prüfungen geben Rückmeldung ohne zusätzliche Wertung. Begründung und Selbstbewertung zählen nicht zur Trefferquote.</p>
        {!isAuthenticated && <p className="text-sm text-amber-300">Als Gast kannst du üben; dein Fortschritt wird nicht gespeichert.</p>}
        {showExample && <p className="text-sm text-amber-300">Beispiel geöffnet: Weitere Prüfungen in diesem Durchlauf sind ohne Wertung.</p>}
        <div role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-200">
          {result ? (result.valid ? 'Dein Netzplan erfüllt alle objektiven Anforderungen. Die Begründung bleibt selbst zu bewerten.' : 'Bitte die markierten Eingaben und Konflikte korrigieren.') : 'Noch keine aktuelle Prüfung. Nach Änderungen bitte erneut prüfen.'}
        </div>
        {!!result?.conflicts.length && (
          <ul aria-label="Konflikte zwischen Bereichen" className="space-y-2 text-sm text-rose-300">
            {result.conflicts.map((conflict, index) => <li id={`network-conflict-${index}`} key={`${conflict.kind}-${conflict.groups.join('-')}`}>{conflict.message}</li>)}
          </ul>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-lg bg-emerald-400 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-200">Netzplan prüfen</button>
          <button type="button" onClick={newRun} className={secondaryButton}>Neuer Durchlauf</button>
        </div>
      </form>

      <section aria-labelledby="network-policy-title" className="space-y-3 border-t border-slate-700 pt-5">
        <h3 id="network-policy-title" className="font-semibold text-slate-100">2. Verkehrsregeln begründen · Selbstbewertung</h3>
        <p className="text-sm text-slate-300">Für Gäste ist Internetzugang erlaubt, Zugriff auf Büro und Werkstatt verboten. Beschreibe die dafür notwendigen Regeln.</p>
        <p className="text-sm text-slate-300">Plane DNS über einen vorgesehenen Resolver und DHCP am Gäste-Gateway oder über einen gezielten Relay ein. Dafür ist kein allgemeiner Zugriff auf Büro oder Werkstatt nötig.</p>
        <label htmlFor="network-policy" className="block text-sm text-slate-200">Begründung der Verkehrsregeln</label>
        <textarea id="network-policy" rows={5} className={inputClass} value={reasoning} onChange={event => setReasoning(event.target.value)} aria-describedby="network-rubric-note" />
        <p id="network-rubric-note" className="text-sm text-slate-400">Dein Text wird nicht automatisch bewertet. Text und Häkchen bleiben nur in diesem Durchlauf und werden beim Verlassen des Moduls oder beim Neustart verworfen.</p>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-semibold text-slate-200">Prüfe deine Begründung anhand dieser Kriterien</legend>
          {RUBRIC.map((criterion, index) => (
            <label key={criterion} className="flex items-start gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={rubric[index]} onChange={event => setRubric(previous => previous.map((value, item) => item === index ? event.target.checked : value))} className="mt-1 accent-emerald-400" />
              <span>{criterion}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section aria-label="Beispiellösung" className="space-y-3 border-t border-slate-700 pt-5">
        <button type="button" aria-expanded={showExample} aria-controls="network-example" className={secondaryButton} onClick={() => { exampleSeen.current = true; setShowExample(true); }}>Beispiel anzeigen (anschließend ohne Wertung)</button>
        {showExample && (
          <div id="network-example" className="space-y-3 text-sm text-slate-300">
            <h3 className="font-semibold text-slate-100">Eine mögliche Lösung</h3>
            <ul className="space-y-2">
              {NETWORK_GROUPS.map(group => {
                const example = NETWORK_EXAMPLE[group.id];
                const capacity = 2 ** (32 - Number(example.prefix)) - 2;
                return <li key={group.id}>{group.label}: <code>{example.network}/{example.prefix}</code>, VLAN {example.vlan}, {capacity} nutzbare Adressen.</li>;
              })}
            </ul>
            <p>Andere gültige Aufteilungen und VLAN-IDs werden ebenfalls akzeptiert. Die Blockgrößen dieses Beispiels sind 64, 32 und 16 Adressen; die Netze beginnen an passenden Grenzen und überlappen sich nicht.</p>
            <p>VLANs trennen Broadcast-Domänen. Am Gäste-Gateway bzw. an der Firewall werden Verbindungen zu Büro und Werkstatt gesperrt. DHCP wird für das Gäste-Netz bereitgestellt, DNS nur zum vorgesehenen Resolver erlaubt. Danach werden benötigte Internetdienste und zugehöriger Rückverkehr erlaubt; andere Verbindungen bleiben gesperrt. VLAN-Trennung allein ersetzt diese Regeln nicht.</p>
          </div>
        )}
      </section>
    </section>
  );
}
