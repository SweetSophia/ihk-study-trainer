import { mockNumberLocale } from '../../../../test/numberLocale';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateImageCalcQuestion } from '../imageCalc';

afterEach(() => vi.restoreAllMocks());

const imageDimensions = [[1920, 1080], [2560, 1440], [3840, 2160], [1024, 768], [1280, 1024]];
const depths = [8, 16, 24, 32];
const units = ['Bytes', 'KiB', 'KB', 'MiB', 'MB', 'GiB', 'GB'];
const divisors = [1, 1024, 1000, 1048576, 1000000, 1073741824, 1000000000];

function selectImage(resolution: number, depth: number, unit: number) {
  vi.spyOn(Math, 'random')
    .mockReturnValueOnce((resolution + 0.5) / 5)
    .mockReturnValueOnce((depth + 0.5) / 4)
    .mockReturnValueOnce((unit + 0.5) / 7);
  return generateImageCalcQuestion();
}

function readNumber(value: string): number {
  const parts = new Intl.NumberFormat().formatToParts(1234.5);
  const group = parts.find((part) => part.type === 'group')!.value;
  const decimal = parts.find((part) => part.type === 'decimal')!.value;
  return Number(value.replaceAll(group, '').replace(decimal, '.'));
}

describe('generateImageCalcQuestion – precise conversion steps', () => {
  it.each([5, 6])('keeps the small XGA image intermediates exact for target index %i', (unit) => {
    const question = selectImage(3, 0, unit);
    const steps = question.solutionSteps as string[];
    const intermediate = unit === 6 ? 'MB' : 'MiB';
    const value = unit === 6 ? 0.786432 : 0.75;
    const line = steps.find((step) => step.trim().startsWith(`${intermediate} =`) && step.endsWith(` ${intermediate}`));
    expect(readNumber(line!.trim().split(' = ')[1].split(' ')[0])).toBe(value);
    expect(question.expectedAnswers.size).toBe(unit === 6 ? 0.0008 : 0.0007);
  });

  it.each(['en-US', 'de-DE', 'fr-FR', 'ru-RU'])('uses exact operands and declares only final rounding across all 140 selectable images in %s', locale => {
    const normalize = mockNumberLocale(locale);
    let checked = 0;
    for (let r = 0; r < imageDimensions.length; r++) {
      for (let d = 0; d < depths.length; d++) {
        for (let u = 0; u < units.length; u++) {
          const question = selectImage(r, d, u);
          const bytes = imageDimensions[r][0] * imageDimensions[r][1] * depths[d] / 8;
          const exact = bytes / divisors[u];
          const places = exact >= 1000 ? 0 : exact >= 1 ? 2 : 4;
          const rounded = Number(exact.toFixed(places));
          expect(question.expectedAnswers).toEqual({ size: rounded, sizeUnit: units[u] });
          expect(question.questionText).toContain(`auf ${places} Nachkommastellen`);

          const steps = question.solutionSteps as string[];
          let matched = 0;
          for (const rawStep of steps) {
            const step = normalize(rawStep);
            const operation = step.match(/^\s*(KiB|KB|MiB|MB|GiB|GB) = ([\d.,]+) ÷ (\d+)$/);
            if (operation) {
              matched++;
              const target = units.indexOf(operation[1]);
              expect(Number(operation[2]) / Number(operation[3])).toBeCloseTo(bytes / divisors[target], 12);
            }
            const value = step.match(/^\s*(KiB|KB|MiB|MB|GiB|GB) = ([\d.,]+) \1$/);
            if (value) {
              matched++;
              expect(Number(value[2])).toBeCloseTo(bytes / divisors[units.indexOf(value[1])], 12);
            }
          }
          expect(matched).toBe([0, 2, 2, 4, 4, 6, 6][u]);
          const final = steps.at(-1)!;
          expect(final).toContain(`${rounded} ${units[u]}`);
          if (rounded !== exact) expect(final).toContain('≈');
          checked++;
          vi.mocked(Math.random).mockRestore();
        }
      }
    }
    expect(checked).toBe(140);
  });
});

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
