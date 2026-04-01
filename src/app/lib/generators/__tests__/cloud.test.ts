import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateCloudQuestion } from '../cloud';

const TOTAL_CLOUD_QUESTIONS = 45;

function randomValueForIndex(index: number, total = TOTAL_CLOUD_QUESTIONS): number {
  return (index + 0.001) / total;
}

describe('generateCloudQuestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid answer configuration for every question in the bank', () => {
    const randomSpy = vi.spyOn(Math, 'random');

    for (let index = 0; index < TOTAL_CLOUD_QUESTIONS; index += 1) {
      randomSpy.mockReturnValue(randomValueForIndex(index));

      const question = generateCloudQuestion();
      const [answerInput] = question.answerInputs;
      const expectedAnswer = String(question.expectedAnswers.answer);

      expect(question.theme).not.toBe('');
      expect(question.questionText).not.toBe('');
      expect(question.solutionSteps).toHaveLength(4);
      expect(answerInput).toBeDefined();
      expect(answerInput.label).toBe('Antwort');
      expect(answerInput.valueOptions).toContain(expectedAnswer);
      expect(answerInput.acceptedValues).toBeDefined();
      expect(answerInput.acceptedValues?.length).toBeGreaterThan(0);
      expect(question.solutionSteps[2]).toContain(expectedAnswer);

      if (answerInput.valueOptions?.join('|') === 'Wahr|Falsch') {
        expect(answerInput.acceptedValues?.map((value) => value.toLowerCase())).toContain(expectedAnswer.toLowerCase());
      }

      if (question.scenario) {
        expect(question.questionText).toContain(question.scenario);
      }
    }
  });

  it('returns only questions from the requested difficulty bucket', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);

    const question = generateCloudQuestion('hard');

    expect(question.difficulty).toBe('hard');
    expect(question.questionText).toContain('typischen Vorteil von Multi-Cloud');
    expect(question.expectedAnswers).toEqual({
      answer: 'Ein Unternehmen nutzt AWS und Azure, um bei Ausfall eines Anbieters auf den anderen umzuschalten',
    });
  });

  it('falls back to the full bank for unknown runtime difficulty values', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const question = generateCloudQuestion('expert' as never);

    expect(question.theme).toBe('Service Models');
    expect(question.expectedAnswers).toEqual({ answer: 'IaaS' });
  });

  it('returns verified cloud knowledge answers for representative questions', () => {
    const randomSpy = vi.spyOn(Math, 'random');

    randomSpy.mockReturnValue(randomValueForIndex(14));
    expect(generateCloudQuestion().expectedAnswers).toEqual({ answer: 'Hybrid Cloud' });

    randomSpy.mockReturnValue(randomValueForIndex(25));
    expect(generateCloudQuestion().expectedAnswers).toEqual({ answer: 'Identitäts- und Zugriffsverwaltung' });

    randomSpy.mockReturnValue(randomValueForIndex(42));
    expect(generateCloudQuestion().expectedAnswers).toEqual({ answer: 'Azure' });

    randomSpy.mockReturnValue(randomValueForIndex(44));
    expect(generateCloudQuestion().expectedAnswers).toEqual({ answer: 'Alle drei (AWS, Azure, GCP)' });
  });

  it('keeps accepted synonyms for true-false questions', () => {
    vi.spyOn(Math, 'random').mockReturnValue(randomValueForIndex(7));

    const question = generateCloudQuestion();

    expect(question.expectedAnswers).toEqual({ answer: 'Falsch' });
    expect(question.answerInputs[0].valueOptions).toEqual(['Wahr', 'Falsch']);
    expect(question.answerInputs[0].acceptedValues).toEqual([
      'falsch',
      'false',
      'no',
      'nein',
      'unwahr',
      'stimmt nicht',
    ]);
  });
});
