'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { type ProgressLike } from '../lib/moduleIds';
import { MODULE_NAMES } from '../lib/modules';
import { getPracticeTopics } from '../lib/targetedPractice';

interface TargetedPracticeProps {
  progress: ProgressLike[];
  onSelectModule: (module: string) => void;
}

export default function TargetedPractice({ progress, onSelectModule }: TargetedPracticeProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const topics = getPracticeTopics(progress);

  useLayoutEffect(() => {
    if (open) heading.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div className="w-full min-w-0" onKeyDown={event => {
      if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    }}>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => open ? close() : setOpen(true)}
        className="min-h-11 rounded-lg border border-control bg-subtle px-4 py-2.5 text-sm font-medium text-ink hover:bg-subtle-hover">
        Gezielt üben
      </button>
      {open && <section id={`${id}-panel`} aria-labelledby={`${id}-title`}
        className="mt-3 space-y-4 rounded-lg border border-line bg-canvas p-3">
        <h3 ref={heading} id={`${id}-title`} tabIndex={-1} className="font-semibold text-ink">
          Thema zum Üben auswählen
        </h3>
        <button type="button" onClick={close} className="min-h-11 rounded-lg border border-control px-3 py-2 text-sm text-ink hover:bg-subtle">
          Themenauswahl schließen
        </button>
        <p className="text-sm text-muted">Die Erfolgsquote nutzt den gesamten gespeicherten Verlauf, nicht nur die letzten Übungen. Du wählst das Thema selbst.</p>
        <p className="text-sm text-muted">Unter 5 gewerteten Versuchen ist die Datenbasis klein. Auch mehr Versuche oder eine hohe Quote belegen keine Prüfungsreife.</p>
        <details className="text-sm text-muted">
          <summary className="cursor-pointer py-2 font-medium text-ink">Wie werden Versuche gezählt?</summary>
          <ul className="mt-2 list-disc space-y-2 pl-4">
            <li>Einzelaufgaben: die gewertete Antwortprüfung zählt, nicht das Öffnen einer Aufgabe.</li>
            <li>Separates SQL-Modul: jede gewertete falsche Prüfung und die erste erfolgreiche Prüfung zählen. Technische Fehler zählen nicht.</li>
            <li>AP2: Pro Durchlauf zählt nur die erste gewertete objektive Prüfung je Abschnitt oder SQL-Aufgabe. Wiederholungen, Selbstbewertung und zuvor aufgedeckte Teile zählen nicht.</li>
            <li>Der AP2-Trainingslauf zählt bei seinen ursprünglichen Themen. Die Zahlen sind Versuche, keine Anzahl unterschiedlicher Aufgaben; die Zählweisen sind nicht direkt vergleichbar.</li>
          </ul>
        </details>
        {topics.length === 0 ? (
          <p className="text-sm text-muted">Noch keine gewerteten Versuche für auswählbare Themen. Wähle zunächst eine Aufgabe in der normalen Modulauswahl. Altbestand bleibt in der Fortschrittsübersicht erhalten.</p>
        ) : <ul className="space-y-2">
          {topics.map((topic, index) => <li key={topic.module}>
            {(index === 0 || topics[index - 1].lowSample !== topic.lowSample) && <div className="space-y-2 pb-2 pt-2">
              <h4 className="text-sm font-semibold text-ink">{topic.lowSample ? 'Wenige Versuche (1–4)' : 'Ab 5 gewerteten Versuchen'}</h4>
              <p className="text-xs text-muted">Niedrigere Erfolgsquoten zuerst.</p>
            </div>}
            <button type="button" aria-label={`${MODULE_NAMES[topic.module]} üben`}
              aria-describedby={`${id}-${topic.module}-stats`}
              onClick={() => {
                // The stable opener survives closing this list. Home uses it
                // as the return target if an AP2 departure is cancelled.
                close();
                onSelectModule(topic.module);
              }}
              className="w-full min-w-0 rounded-lg border border-control bg-surface p-3 text-left hover:bg-subtle">
              <span className="block break-words text-sm font-semibold text-ink">{MODULE_NAMES[topic.module]}</span>
              <span id={`${id}-${topic.module}-stats`} className="mt-1 block space-y-1 text-xs text-muted">
                <span className="block">{Math.round(topic.accuracy)}% Erfolgsquote · {topic.correct} von {topic.attempted} richtig</span>
                <span className="block">{topic.attempted} {topic.attempted === 1 ? 'gewerteter Versuch' : 'gewertete Versuche'}</span>
                {topic.lowSample && <span className="block font-medium text-warning">Wenige Versuche</span>}
              </span>
            </button>
          </li>)}
        </ul>}
      </section>}
    </div>
  );
}
