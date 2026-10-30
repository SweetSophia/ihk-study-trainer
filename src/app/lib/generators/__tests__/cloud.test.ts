import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  generateCloudQuestion,
  resolveCloudQuestionsForDifficulty,
} from '../cloud';

afterEach(() => vi.restoreAllMocks());

it('distinguishes direct Internet Gateway routing from private-subnet outbound NAT', () => {
  const bank = resolveCloudQuestionsForDifficulty('medium');
  const index = bank.findIndex((q) => q.question.includes('Public Subnet und einem Private Subnet'));
  expect(index).toBeGreaterThanOrEqual(0);
  vi.spyOn(Math, 'random').mockReturnValue((index + 0.5) / bank.length);
  const question = generateCloudQuestion('medium');
  const answer = 'Public Subnets haben eine direkte Route zum Internet Gateway; Private Subnets nicht';
  expect(question.expectedAnswers.answer).toBe(answer);
  expect(question.answerInputs[0].valueOptions).toContain(answer);
  expect(question.answerInputs[0].acceptedValues).toEqual([answer]);
  const solution = question.solutionSteps.join('\n');
  expect(solution).toMatch(/Private Subnets.*ausgehenden Internetzugang.*NAT/);
  expect(solution).toMatch(/Adressierung.*Sicherheitsregeln/);
});

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
