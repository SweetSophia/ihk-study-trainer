/** Session-only observations; progress is still written by each trainer's onAttempt. */
export type ObjectiveEvent =
  | { type: 'check'; section: string; correct: boolean }
  | { type: 'edit' | 'reveal'; section: string };
export type TrainingRunContext = { onEvent: (event: ObjectiveEvent) => void };
export type RunTopic = 'ap2CostComparison' | 'ap2Troubleshooting' | 'ap2BackupRecovery';
export const RUN_TOPICS = [
  { id: 'ap2CostComparison', label: 'Wirtschaftlichkeit', sections: [{ id: 'comparison', label: 'Kostenvergleich' }, { id: 'crossover', label: 'Monatsgrenze' }] },
  { id: 'ap2Troubleshooting', label: 'Fehlersuche', sections: [{ id: 'diagnosis', label: 'Evidenz und Diagnose' }, { id: 'action', label: 'Korrektur und Verifikation' }] },
  { id: 'ap2BackupRecovery', label: 'Datensicherung', sections: [{ id: 'time', label: 'Wiederherstellungsziele' }, { id: 'chain', label: 'Sicherungskette' }] },
] as const;
export type SectionObservation = { revealed: boolean; first?: { correct: boolean; unscored: boolean }; latest?: boolean };
export type RunResults = Partial<Record<string, SectionObservation>>;
export function observeObjective(results: RunResults, topic: RunTopic, event: ObjectiveEvent): RunResults {
  const key = `${topic}:${event.section}`;
  const previous = results[key] ?? { revealed: false };
  const next = event.type === 'check'
    ? { ...previous, first: previous.first ?? { correct: event.correct, unscored: previous.revealed }, latest: event.correct }
    : event.type === 'reveal' ? { ...previous, revealed: true } : { ...previous, latest: undefined };
  return { ...results, [key]: next };
}
