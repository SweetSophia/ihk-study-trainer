import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateImageTransferComboQuestion } from '../imageTransferCombo';

describe('imageTransferCombo generator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the overhead-adjusted transfer time for expected answers', () => {
    const randomValues = [0.41, 0.99, 0.0, 0.0];
    let index = 0;

    vi.spyOn(Math, 'random').mockImplementation(() => randomValues[index++] ?? 0);

    const question = generateImageTransferComboQuestion();

    expect(question.expectedAnswers).toMatchObject({
      minutes: 48,
      minuteUnit: 'Minuten',
      seconds: 40,
      secondUnit: 'Sekunden',
    });

    expect(question.solutionSteps).toContain('  Effektive Zeit = 2919.63 s');
    expect(question.solutionSteps).toContain('Ergebnis: 48 Minute(n) 40 Sekunde(n)');
  });
});
