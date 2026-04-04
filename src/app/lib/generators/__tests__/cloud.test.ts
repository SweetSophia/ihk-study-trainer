import { afterEach, describe, expect, it, vi } from 'vitest';

import { CLOUD_QUESTION_COUNT, CLOUD_TRUE_FALSE_OPTIONS, generateCloudQuestion } from '../cloud';

const EXPECTED_SOLUTION_STEPS_COUNT = 4;

function randomValueForIndex(index: number, total = CLOUD_QUESTION_COUNT): number {
  return (index + 0.001) / total;
}

describe('generateCloudQuestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid answer configuration for every question in the bank', () => {
    const randomSpy = vi.spyOn(Math, 'random');

    for (let index = 0; index < CLOUD_QUESTION_COUNT; index += 1) {
      randomSpy.mockReturnValue(randomValueForIndex(index));

      const question = generateCloudQuestion();
      const [answerInput] = question.answerInputs;
      const expectedAnswer = String(question.expectedAnswers.answer);

      expect(question.theme).not.toBe('');
      expect(question.questionText).not.toBe('');
      expect(question.solutionSteps).toHaveLength(EXPECTED_SOLUTION_STEPS_COUNT);
      expect(answerInput).toBeDefined();
      expect(answerInput.label).toBe('Antwort');
      expect(answerInput.valueOptions).toContain(expectedAnswer);
      expect(answerInput.acceptedValues).toBeDefined();
      expect(answerInput.acceptedValues?.length).toBeGreaterThan(0);
      expect(question.solutionSteps[2]).toContain(expectedAnswer);

      if (
        answerInput.valueOptions?.length === CLOUD_TRUE_FALSE_OPTIONS.length &&
        answerInput.valueOptions.every((option, optionIndex) => option === CLOUD_TRUE_FALSE_OPTIONS[optionIndex])
      ) {
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

    // Runtime callers can still bypass the type system, so keep the fallback path covered.
    const question = generateCloudQuestion('expert' as never);

    expect(question.theme).toBe('Service Models');
    expect(question.expectedAnswers).toEqual({ answer: 'IaaS' });
  });

  it('returns well-formed results for all valid difficulty levels', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Verify each valid difficulty level returns a properly structured question.
    // This exercises the difficulty bucket path in generateCloudQuestion.
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const question = generateCloudQuestion(difficulty);
      expect(question).toBeDefined();
      expect(question.theme).not.toBe('');
      expect(question.questionText).not.toBe('');
      expect(question.solutionSteps).toHaveLength(EXPECTED_SOLUTION_STEPS_COUNT);
      expect(question.difficulty).toBe(difficulty);
    }
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
