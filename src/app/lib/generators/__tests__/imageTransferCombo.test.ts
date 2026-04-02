import { describe, expect, it } from 'vitest';

import { generateImageTransferComboQuestion } from '../imageTransferCombo';

describe('generateImageTransferComboQuestion – module field migration', () => {
  it('emits the canonical module ID "imageTransferCombo" (not the legacy "image-transfer-combo")', () => {
    const question = generateImageTransferComboQuestion();
    expect(question.module).toBe('imageTransferCombo');
    expect(question.module).not.toBe('image-transfer-combo');
  });

  it('uses the id prefix "image-transfer-combo-" for the question id', () => {
    const question = generateImageTransferComboQuestion();
    expect(question.id).toMatch(/^image-transfer-combo-\d+$/);
  });

  it('belongs to the correct theme', () => {
    const question = generateImageTransferComboQuestion();
    expect(question.theme).toBe('IT-Mathematik & Datenberechnung');
  });

  it('includes at least one time component in expectedAnswers', () => {
    const question = generateImageTransferComboQuestion();
    const keys = Object.keys(question.expectedAnswers);
    const hasTimeKey = keys.some((k) => ['seconds', 'minutes', 'hours'].includes(k));
    expect(hasTimeKey).toBe(true);
  });

  it('solution steps mention the 10% overhead', () => {
    const question = generateImageTransferComboQuestion();
    const steps = question.solutionSteps as string[];
    const overheadStep = steps.find((s) => /10.*Overhead|Overhead.*10/i.test(s));
    expect(overheadStep).toBeDefined();
  });

  it('declares a difficulty of easy, medium, or hard', () => {
    for (let i = 0; i < 20; i++) {
      const question = generateImageTransferComboQuestion();
      expect(['easy', 'medium', 'hard']).toContain(question.difficulty);
    }
  });

  it('includes answer input descriptors matching the time components present', () => {
    const question = generateImageTransferComboQuestion();
    const keys = Object.keys(question.expectedAnswers);
    const answerInputs = question.answerInputs as Array<{ valueKey: string }>;

    for (const input of answerInputs) {
      expect(keys).toContain(input.valueKey);
    }
  });
});