import { describe, expect, it } from 'vitest';

import { generateImageCalcQuestion } from '../imageCalc';

describe('generateImageCalcQuestion – module field migration', () => {
  it('emits the canonical module ID "imageCalc" (not the legacy "image-calc")', () => {
    const question = generateImageCalcQuestion();
    expect(question.module).toBe('imageCalc');
    expect(question.module).not.toBe('image-calc');
  });

  it('uses the id prefix "image-calc-" for the question id', () => {
    const question = generateImageCalcQuestion();
    expect(question.id).toMatch(/^image-calc-\d+$/);
  });

  it('belongs to the correct theme', () => {
    const question = generateImageCalcQuestion();
    expect(question.theme).toBe('Bildberechnung & Digitalisierung');
  });

  it('includes a numeric "size" answer and a "sizeUnit" string answer', () => {
    const question = generateImageCalcQuestion();
    expect(typeof question.expectedAnswers.size).toBe('number');
    expect(typeof question.expectedAnswers.sizeUnit).toBe('string');
  });

  it('produces a positive, non-zero file size', () => {
    for (let i = 0; i < 10; i++) {
      const question = generateImageCalcQuestion();
      expect(question.expectedAnswers.size).toBeGreaterThan(0);
    }
  });

  it('declares a difficulty of easy, medium, or hard', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const question = generateImageCalcQuestion();
      seen.add(question.difficulty as string);
      expect(['easy', 'medium', 'hard']).toContain(question.difficulty);
    }
  });

  it('includes solution steps that contain the final result', () => {
    const question = generateImageCalcQuestion();
    const steps = question.solutionSteps as string[];
    const resultLine = steps.find((s) => s.includes('Ergebnis:'));
    expect(resultLine).toBeDefined();
    expect(resultLine).toContain(String(question.expectedAnswers.size));
  });
});