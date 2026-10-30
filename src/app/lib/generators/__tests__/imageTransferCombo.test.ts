import { mockNumberLocale } from '../../../../test/numberLocale';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateStructuredAnswer } from '../../answerValidation';
import { generateImageTransferComboQuestion } from '../imageTransferCombo';

afterEach(() => vi.restoreAllMocks());

const dimensions = [[1920, 1080], [2560, 1440], [3840, 2160], [1024, 768], [1280, 1024]];
const depths = [8, 16, 24, 32];
const rates = [100, 250, 500, 1000, 2500, 5000, 10000];
const multipliers = [1000, 1000000, 1000000000];

function selectCombo(resolution: number, depth: number, rate: number, unit: number) {
  vi.spyOn(Math, 'random')
    .mockReturnValueOnce((resolution + 0.5) / 5)
    .mockReturnValueOnce((depth + 0.5) / 4)
    .mockReturnValueOnce((rate + 0.5) / 7)
    .mockReturnValueOnce((unit + 0.5) / 3);
  return generateImageTransferComboQuestion();
}


describe('generateImageTransferComboQuestion – fractional precision', () => {
  it('preserves the positive Full HD 100 Mbit/s transfer and accepts its exact answer', () => {
    const question = selectCombo(0, 0, 0, 1);
    expect(question.expectedAnswers).toEqual({ seconds: 0.1824768, secondUnit: 'Sekunden' });
    expect(question.solutionSteps?.at(-1)).toBe('Ergebnis: 0.1824768 Sekunde(n)');
    expect(question.questionText).toMatch(/9 Nachkommastellen/);
    expect(validateStructuredAnswer(question.answerInputs!, question.expectedAnswers, {
      seconds: '0.1824768', secondUnit: 'Sekunden',
    })).toBe(true);
    expect(validateStructuredAnswer(question.answerInputs!, question.expectedAnswers, {
      seconds: '0', secondUnit: 'Sekunden',
    })).toBe(false);
  });

  it('shows decimal seconds and accepts the exact smallest selectable transfer', () => {
    const question = selectCombo(3, 0, 6, 2);
    expect(question.expectedAnswers.seconds).toBe(0.000000692);
    expect(question.solutionSteps?.at(-1)).toBe('Ergebnis: 0.000000692 Sekunde(n)');
    expect(validateStructuredAnswer(question.answerInputs!, question.expectedAnswers, {
      seconds: '0.00000069206016', secondUnit: 'Sekunden',
    })).toBe(true);
  });

  it.each(['en-US', 'de-DE', 'fr-FR', 'ru-RU'])('preserves positive times and matching solution/input components in all 420 selectable cases in %s', locale => {
    const normalize = mockNumberLocale(locale);
    let checked = 0;
    for (let r = 0; r < dimensions.length; r++) {
      for (let d = 0; d < depths.length; d++) {
        for (let b = 0; b < rates.length; b++) {
          for (let u = 0; u < multipliers.length; u++) {
            const question = selectCombo(r, d, b, u);
            const bits = dimensions[r][0] * dimensions[r][1] * depths[d];
            const effective = bits * 11 / (10 * rates[b] * multipliers[u]);
            const rounded = effective < 60 ? Number(effective.toFixed(9)) : Math.round(effective);
            const answers = question.expectedAnswers;
            const represented = Number(answers.minutes ?? 0) * 60 + Number(answers.seconds);
            expect(represented).toBeGreaterThan(0);
            expect(represented).toBeCloseTo(rounded, 10);
            expect(Math.abs(represented - effective) / effective).toBeLessThan(0.05);
            expect(answers.hours).toBeUndefined();
            const expectedKeys = answers.minutes === undefined ? ['seconds'] : ['minutes', 'seconds'];
            expect(question.answerInputs?.map((input) => input.valueKey)).toEqual(expectedKeys);
            const final = question.solutionSteps?.at(-1) as string;
            if (answers.minutes === undefined) {
              const decimalDisplay = final.match(/^Ergebnis: (\d+(?:\.\d+)?) Sekunde\(n\)$/);
              expect(decimalDisplay).not.toBeNull();
              expect(Number(decimalDisplay![1])).toBe(answers.seconds);
            } else {
              expect(final).toBe(`Ergebnis: ${answers.minutes} Minute(n) ${answers.seconds} Sekunde(n)`);
            }
            const rawLine = (question.solutionSteps as string[]).find((step) => /^  Zeit [≈=] [\d.]+ s$/.test(step));
            expect(Number(rawLine!.match(/[\d.]+/)![0])).toBeGreaterThan(0);
            const effectiveLine = (question.solutionSteps as string[]).find((step) => /^  Effektive Zeit [≈=] [\d.]+ s$/.test(step));
            expect(Number(effectiveLine!.match(/[\d.]+/)![0])).toBeCloseTo(effective, 9);

            // Independently verify the displayed operands as well as the final time.
            const bytes = bits / 8;
            const steps = (question.solutionSteps as string[]).map(step => /^  (KB|MB|Overhead|Effektive Datenmenge) =/.test(step) ? normalize(step) : step);
            const kb = steps.find((step) => step.startsWith('  KB ='))!.match(/KB = ([\d.,]+) ÷ 1000 = ([\d.,]+) KB/)!;
            expect(kb).not.toBeNull();
            expect(Number(kb![1]) / 1000).toBe(bytes / 1000);
            expect(Number(kb![2])).toBe(bytes / 1000);
            const mb = steps.find((step) => step.startsWith('  MB ='))!.match(/MB = ([\d.,]+) ÷ 1000 = ([\d.,]+) MB/)!;
            expect(mb).not.toBeNull();
            expect(Number(mb![1]) / 1000).toBeCloseTo(bytes / 1000000, 12);
            expect(Number(mb![2])).toBe(bytes / 1000000);
            const overhead = steps.find((step) => step.startsWith('  Overhead ='))!.match(/= ([\d.,]+) B$/)!;
            expect(overhead).not.toBeNull();
            expect(Number(overhead![1])).toBe(bytes / 10);
            const effectiveBytes = steps.find((step) => /^  Effektive Datenmenge = [\d.,]+ B$/.test(step))!.match(/= ([\d.,]+) B$/)!;
            expect(effectiveBytes).not.toBeNull();
            expect(Number(effectiveBytes![1])).toBeCloseTo(bytes * 11 / 10, 8);
            expect(steps.filter(step => /^  (KB|MB) =/.test(step))).toHaveLength(2);
            expect(steps.filter(step => /^  Overhead =/.test(step))).toHaveLength(1);
            expect(steps.filter(step => /^  Effektive Datenmenge = [\d.]+ B$/.test(step))).toHaveLength(1);
            checked++;
            vi.mocked(Math.random).mockRestore();
          }
        }
      }
    }
    expect(checked).toBe(420);
  });
});

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
