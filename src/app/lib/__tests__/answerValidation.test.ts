import { describe, expect, it } from 'vitest';

import { validateQuestionAnswers, validateStructuredAnswer } from '../answerValidation';
import { Question } from '../../types';

describe('answer validation helpers', () => {
  it('validates plain numeric questions independently of authentication state', () => {
    const question: Question = {
      id: 'calc-1',
      theme: 'Test',
      module: 'math',
      questionText: '2 + 2 = ?',
      expectedAnswers: { result: 4 },
      solutionSteps: ['4'],
      difficulty: 'easy',
    };

    expect(validateQuestionAnswers(question, { result: '4' })).toBe(true);
    expect(validateQuestionAnswers(question, { result: '4,1' })).toBe(true);
    expect(validateQuestionAnswers(question, { result: '4.3' })).toBe(false);
  });

  it('rejects duplicate picks across multi-correct acceptedValues fields', () => {
    expect(
      validateStructuredAnswer(
        [
          { valueKey: 'a', acceptedValues: ['HTTP', 'HTTPS'] },
          { valueKey: 'b', acceptedValues: ['HTTP', 'HTTPS'] },
        ],
        { a: 'HTTP', b: 'HTTPS' },
        { a: 'HTTP', b: 'HTTP' }
      )
    ).toBe(false);
  });

  it('accepts equivalent unit-converted totals within tolerance', () => {
    expect(
      validateStructuredAnswer(
        [
          { valueKey: 'size', unitKey: 'unit', unitOptions: ['MiB', 'GiB'] },
        ],
        { size: 1024, unit: 'mib' },
        { size: '1', unit: 'gib' }
      )
    ).toBe(true);
  });
});
