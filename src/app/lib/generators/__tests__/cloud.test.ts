import { describe, expect, it } from 'vitest';

import {
  generateCloudQuestion,
  resolveCloudQuestionsForDifficulty,
} from '../cloud';

const sampleQuestion = {
  type: 'multipleChoice' as const,
  topic: 'Test Topic',
  difficulty: 'easy' as const,
  question: 'Test question?',
  options: ['A', 'B'],
  correctAnswer: 'A',
  explanation: 'Test explanation.',
};

describe('cloud generator difficulty fallback', () => {
  it('falls back to the full question bank when the selected bucket is empty', () => {
    const resolvedQuestions = resolveCloudQuestionsForDifficulty('hard', {
      easy: [sampleQuestion],
      medium: [sampleQuestion],
      hard: [],
    });

    expect(Array.isArray(resolvedQuestions)).toBe(true);
    expect(resolvedQuestions.length).toBeGreaterThan(0);
  });

  it('falls back to the full question bank for inherited object keys', () => {
    const resolvedQuestions = resolveCloudQuestionsForDifficulty('constructor');

    expect(Array.isArray(resolvedQuestions)).toBe(true);
    expect(resolvedQuestions.length).toBeGreaterThan(0);
  });

  it('does not crash when generateCloudQuestion receives an inherited-key difficulty', () => {
    expect(() => generateCloudQuestion('constructor' as never)).not.toThrow();

    const question = generateCloudQuestion('constructor' as never);

    expect(question.questionText.length).toBeGreaterThan(0);
    expect(question.solutionSteps.length).toBeGreaterThan(0);
    expect(question.answerInputs.length).toBeGreaterThan(0);
  });
});
