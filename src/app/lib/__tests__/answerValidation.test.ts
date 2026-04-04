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


  it('returns false instead of throwing when a numeric field is missing', () => {
    expect(
      validateStructuredAnswer(
        [{ valueKey: 'result' }],
        { result: 42 },
        {}
      )
    ).toBe(false);
  });

  it('validates structured conversion answers per field so errors cannot cancel out', () => {
    expect(
      validateStructuredAnswer(
        [
          { valueKey: 'download', unitKey: 'downloadUnit', unitOptions: ['MiB', 'GiB'] },
          { valueKey: 'duration', unitKey: 'durationUnit', unitOptions: ['Sekunden', 'Minuten'] },
        ],
        {
          download: 1024,
          downloadUnit: 'mib',
          duration: 120,
          durationUnit: 'sekunden',
        },
        {
          download: '0.5',
          downloadUnit: 'gib',
          duration: '11.4667',
          durationUnit: 'minuten',
        }
      )
    ).toBe(false);
  });
});
