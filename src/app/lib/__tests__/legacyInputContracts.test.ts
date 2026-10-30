import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseLocaleFloat, validateQuestionAnswers } from '../answerValidation';
import { GENERATORS } from '../generators/registry';
import { generateUnitConversionQuestion } from '../generators/unitConversion';

afterEach(() => vi.restoreAllMocks());

describe('complete finite numeric input', () => {
  it.each(['41.84xyz', '1,2,3', '1.2.3', '1 000', '0x10', '1e', 'NaN', 'Infinity', '-Infinity', '1e309', '', '  '])('rejects malformed or nonfinite %s', raw => {
    expect(parseLocaleFloat(raw)).toBeNaN();
  });
  it.each([[' -41,84 ', -41.84], ['+.5', .5], ['1.', 1], ['1,25e2', 125], ['-4.2e-2', -.042]])('retains valid syntax %s', (raw, expected) => {
    expect(parseLocaleFloat(raw)).toBe(expected);
  });
  it('rejects numeric suffixes through a real generated conversion while retaining locale equivalents and tolerance', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const q = generateUnitConversionQuestion();
    const value = String(q.expectedAnswers.result);
    expect(validateQuestionAnswers(q, { result: value + 'xyz' })).toBe(false);
    expect(validateQuestionAnswers(q, { result: value.replace('.', ',') })).toBe(true);
    expect(validateQuestionAnswers(q, { result: String(Number(value) * 1.04) })).toBe(true);
  });
});

describe('conversion target only', () => {
  it.each([
    ['binary', .75, 'binary'], ['binary', .25, 'decimal'],
    ['hex', .75, 'hex'], ['hex', .25, 'decimal'],
    ['hexBinary', .75, 'binary'], ['hexBinary', .25, 'hex'],
  ] as const)('%s direction %s requires only %s', (module, direction, target) => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(direction).mockReturnValue(.05);
    const q = GENERATORS[module]();
    expect(Object.keys(q.expectedAnswers)).toEqual([target]);
    const answer = String(q.expectedAnswers[target]);
    expect(validateQuestionAnswers(q, { [target]: answer })).toBe(true);
    expect(validateQuestionAnswers(q, { [target]: target === 'hex' ? '0x' + answer.toLowerCase() : answer })).toBe(true);
    expect(validateQuestionAnswers(q, { [target]: target === 'binary' ? answer.slice(1) : '999999' })).toBe(false);
  });
});

describe('readable covering-supernet contract', () => {
  it('keeps three /24 blocks covered by /22 and grades labelled German choices without accepting bad routes', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(.4).mockReturnValueOnce(4.5 / 11).mockReturnValue(0);
    const q = GENERATORS.aggregation();
    expect(q.questionText).toMatch(/kleinste.*überdeckende/i);
    expect(q.questionText).toMatch(/zusätzliche.*Adressen/i);
    expect(q.expectedAnswers).toEqual({ summaryRoute: '10.0.0.0', summaryCidr: 22, possible: true });
    expect(q.answerInputs?.find(c => c.valueKey === 'possible')?.valueOptions).toEqual(['Ja', 'Nein']);
    const answer = { summaryRoute: '10.0.0.0', summaryCidr: '22', possible: 'Ja' };
    expect(validateQuestionAnswers(q, answer)).toBe(true);
    expect(validateQuestionAnswers(q, { ...answer, possible: 'true' })).toBe(true);
    expect(validateQuestionAnswers(q, { ...answer, possible: 'Nein' })).toBe(false);
    expect(validateQuestionAnswers(q, { ...answer, summaryRoute: '10.0.0.0x' })).toBe(false);
    expect(validateQuestionAnswers(q, { ...answer, summaryCidr: '22.1' })).toBe(false);
  });
});
