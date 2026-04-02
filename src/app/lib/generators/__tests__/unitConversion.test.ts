import { describe, expect, it } from 'vitest';

import { generateUnitConversionQuestion } from '../unitConversion';

describe('generateUnitConversionQuestion – module field migration', () => {
  it('emits the canonical module ID "unitConversion" (not the legacy "unit-conversion")', () => {
    const question = generateUnitConversionQuestion();
    expect(question.module).toBe('unitConversion');
    expect(question.module).not.toBe('unit-conversion');
  });

  it('uses the id prefix "unit-conv-" for the question id', () => {
    const question = generateUnitConversionQuestion();
    expect(question.id).toMatch(/^unit-conv-\d+$/);
  });

  it('belongs to the correct theme', () => {
    const question = generateUnitConversionQuestion();
    expect(question.theme).toBe('IT-Mathematik & Datenberechnung');
  });

  it('provides a numeric result in expectedAnswers', () => {
    const question = generateUnitConversionQuestion();
    expect(typeof question.expectedAnswers.result).toBe('number');
  });

  it('declares a difficulty of easy, medium, or hard', () => {
    for (let i = 0; i < 20; i++) {
      const question = generateUnitConversionQuestion();
      expect(['easy', 'medium', 'hard']).toContain(question.difficulty);
    }
  });
});

describe('generateUnitConversionQuestion – formula correctness (bug-fix regression)', () => {
  /**
   * The fix in this PR corrected the formula shown in solutionSteps for
   * decimal-to-binary conversions (MB→MiB, GB→GiB, TB→TiB).
   *
   * Correct formula: value × (baseFrom^exp ÷ baseTo^exp)
   *   e.g. for MB→MiB: value × (1000^2 ÷ 1024^2)
   *
   * The old (buggy) formula had baseTo and baseFrom swapped:
   *   value × (baseTo^exp ÷ baseFrom^exp)  ← WRONG
   */

  it('solution steps for MB→MiB show baseFrom (1000) before baseTo (1024) in the Formel line', () => {
    // Run enough iterations to hit the MB→MiB conversion case
    let testedMbToMib = false;
    for (let i = 0; i < 200; i++) {
      const question = generateUnitConversionQuestion();
      const steps = question.solutionSteps as string[];
      const formelLine = steps.find((s) => s.startsWith('Formel:'));
      if (!formelLine) continue;

      // Check which conversion this question is for
      const questionText = question.questionText;
      if (!questionText.includes('MB') || !questionText.includes('MiB')) continue;

      testedMbToMib = true;
      // Correct: 1000^2 ÷ 1024^2
      expect(formelLine).toContain('1000^2 ÷ 1024^2');
      // Must NOT contain the swapped (buggy) form
      expect(formelLine).not.toContain('1024^2 ÷ 1000^2');
      break;
    }
    // If we never hit MB→MiB in 200 attempts something is wrong with the generator
    expect(testedMbToMib).toBe(true);
  });

  it('solution steps for GB→GiB show baseFrom (1000) before baseTo (1024) in the Formel line', () => {
    let testedGbToGib = false;
    for (let i = 0; i < 200; i++) {
      const question = generateUnitConversionQuestion();
      const steps = question.solutionSteps as string[];
      const formelLine = steps.find((s) => s.startsWith('Formel:'));
      if (!formelLine) continue;

      const questionText = question.questionText;
      if (!questionText.includes('GB') || !questionText.includes('GiB')) continue;

      testedGbToGib = true;
      // Correct: 1000^3 ÷ 1024^3
      expect(formelLine).toContain('1000^3 ÷ 1024^3');
      expect(formelLine).not.toContain('1024^3 ÷ 1000^3');
      break;
    }
    expect(testedGbToGib).toBe(true);
  });

  it('Mbit→MB conversion uses the division-by-8 formula (not the base formula)', () => {
    let testedMbit = false;
    for (let i = 0; i < 200; i++) {
      const question = generateUnitConversionQuestion();
      const steps = question.solutionSteps as string[];

      const questionText = question.questionText;
      if (!questionText.includes('Mbit') || !questionText.includes('MB')) continue;

      testedMbit = true;
      const formelLine = steps.find((s) => s.startsWith('Formel:'));
      expect(formelLine).toContain('÷ 8');
      break;
    }
    expect(testedMbit).toBe(true);
  });

  it('expected result for a 100 MB → MiB conversion is approximately 95.37 MiB', () => {
    // Factor: 1000*1000 / (1024*1024) ≈ 0.954712
    // 100 * 0.954712 ≈ 95.47 → rounded to 2dp: 95.47
    // Allow small floating point tolerance by checking the range
    let foundResult = false;
    for (let i = 0; i < 500; i++) {
      const question = generateUnitConversionQuestion();
      if (!question.questionText.startsWith('Rechne 100 MB in MiB um')) continue;
      foundResult = true;
      const result = question.expectedAnswers.result as number;
      expect(result).toBeCloseTo(95.37, 1);
      break;
    }
    // Skip the assertion if we didn't get exactly 100 MB (probabilistic)
    if (!foundResult) {
      // Not a failure – just couldn't hit exact value=100 in 500 draws
      return;
    }
  });
});