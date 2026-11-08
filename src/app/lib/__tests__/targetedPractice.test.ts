import { describe, expect, it } from 'vitest';
import { getPracticeTopics } from '../targetedPractice';

const row = (module: string, attempted: number, correct: number) => ({
  module, questions_attempted: attempted, questions_correct: correct,
});

describe('getPracticeTopics', () => {
  it('merges stored and canonical aliases without changing source counters', () => {
    const progress = [row('image-calc', 3, 2), row('imageCalc', 2, 1)];
    expect(getPracticeTopics(progress)).toEqual([
      { module: 'imageCalc', attempted: 5, correct: 3, accuracy: 60, lowSample: false },
    ]);
    expect(progress).toEqual([row('image-calc', 3, 2), row('imageCalc', 2, 1)]);
  });

  it('excludes zero, retired, unknown, prototype-like and composite-run history', () => {
    expect(getPracticeTopics([
      row('binary', 0, 0), row('handelskalkulation', 100, 0), row('unknown', 9, 0),
      row('toString', 6, 0), row('__proto__', 6, 0), row('ap2TrainingRun', 4, 0),
    ])).toEqual([]);
    expect(getPracticeTopics([])).toEqual([]);
  });

  it('keeps perfect records and marks samples of 1–4 but not 5', () => {
    expect(getPracticeTopics([row('linux', 1, 1), row('sql', 4, 2), row('subnetting', 5, 5)]))
      .toEqual([
        { module: 'subnetting', attempted: 5, correct: 5, accuracy: 100, lowSample: false },
        { module: 'sql', attempted: 4, correct: 2, accuracy: 50, lowSample: true },
        { module: 'linux', attempted: 1, correct: 1, accuracy: 100, lowSample: true },
      ]);
  });

  it('sorts larger samples by ratio, not error count, with low samples last', () => {
    expect(getPracticeTopics([
      row('linux', 100, 70), row('sql', 10, 2), row('binary', 1, 0), row('subnetting', 8, 2),
    ]).map(topic => topic.module)).toEqual(['sql', 'subnetting', 'linux', 'binary']);
  });

  it('uses raw ratios before rounding, then sample size and stable catalogue order', () => {
    expect(getPracticeTopics([
      row('linux', 201, 101), row('sql', 200, 100), row('ports', 10, 5), row('binary', 10, 5),
    ]).map(topic => topic.module)).toEqual(['sql', 'binary', 'ports', 'linux']);
  });
});
