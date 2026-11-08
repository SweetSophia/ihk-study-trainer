import { normalizeProgressModules, type ProgressLike } from './moduleIds';
import { ALL_MODULES, type ModuleId } from './modules';

export interface PracticeTopic {
  module: ModuleId;
  attempted: number;
  correct: number;
  /** Unrounded percentage: display rounding must not change the order. */
  accuracy: number;
  lowSample: boolean;
}

/** Read-only view of lifetime counters; never writes or reassesses progress. */
export function getPracticeTopics(progress: ProgressLike[]): PracticeTopic[] {
  const rows = new Map(normalizeProgressModules(progress).map(row => [row.module, row]));
  return ALL_MODULES.flatMap(({ id }): PracticeTopic[] => {
    // A training run records attempts at its original topics, not at the run.
    if (id === 'ap2TrainingRun') return [];
    const row = rows.get(id);
    if (!row || row.questions_attempted <= 0) return [];
    return [{
      module: id,
      attempted: row.questions_attempted,
      correct: row.questions_correct,
      accuracy: row.questions_correct / row.questions_attempted * 100,
      lowSample: row.questions_attempted < 5,
    }];
  }).sort((a, b) => Number(a.lowSample) - Number(b.lowSample)
    || a.accuracy - b.accuracy
    || b.attempted - a.attempted);
}
