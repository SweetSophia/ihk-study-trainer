import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateStructuredAnswer, validateQuestionAnswers } from '../answerValidation';
import { getCalculationHints } from '../calculationLearning';
import { GENERATORS } from '../generators/registry';
import { generateHandelskalkulationQuestion } from '../generators/handelskalkulation';
import type { Question } from '../../types';

afterEach(() => vi.restoreAllMocks());
const moneyInputs = [{ valueKey: 'amount', numericRule: 'moneyCents' as const }];
const check = (expected: string | number, answer: string) => validateStructuredAnswer(moneyInputs, { amount: expected }, { amount: answer });

describe('opt-in exact-cent amounts', () => {
  it.each(['1040', '1000.01', '999,99', '1000.004', '1000.00000000000000001'])('rejects a different amount %s when1000 is expected', answer => {
    expect(check(1000, answer)).toBe(false);
  });
  it.each(['1000', '1000,00', '1000.0000', '+1e3', '1.000e+3', ' 100000e-2 '])('accepts equivalent whole-cent spelling %s', answer => {
    expect(check(1000, answer)).toBe(true);
  });
  it.each([
    ['1.13', '1,1300'], ['1.13', '113e-2'], ['-20', '-2e1'], ['-0.01', '-1e-2'], ['0', '-0.0000'], ['0.01', '0.0001e2'],
  ])('accepts equivalent %s / %s without binary cent noise', (expected, answer) => expect(check(expected, answer)).toBe(true));
  it.each([
    ['-20', '-19.99'], ['-20', '-20.01'], ['-20', '20'], ['0', '1e-400'], ['0', '-1e-400'], ['1.13', '1.13000000000000000001'], ['0.01', '0.005'], ['0', '0.001'],
  ])('rejects wrong signed/sub-cent %s / %s', (expected, answer) => expect(check(expected, answer)).toBe(false));
  it.each(['', '1.000,00', '1 000', '1000€', '1000xyz', '1,0.0', 'NaN', 'Infinity', '1e1000000000', '1e', '--1000'])('rejects malformed or out-of-range%s', answer => expect(check(1000, answer)).toBe(false));
  it('keeps the existing relative rule for untagged amounts and legacy storage configurations', () => {
    expect(validateStructuredAnswer([{ valueKey: 'amount' }], { amount: 1000 }, { amount: '1040' })).toBe(true);
    expect(validateStructuredAnswer([{ valueKey: 'usableCapacity', unitKey: 'unit', unitOptions: ['GB', 'TB'] }], { usableCapacity: 4, unit: 'TB' }, { usableCapacity: '3.9', unit: 'TB' })).toBe(true);
  });
});

it('opts in exactly the three registered calculation modules and covers every graded key', () => {
  vi.spyOn(Math, 'random').mockReturnValue(.5);
  const ids = ['handelskalkulationVorwaerts', 'handelskalkulationRueckwaerts', 'handelskalkulationDifferenz'];
  for (const [module, generate] of Object.entries(GENERATORS)) {
    const question = generate();
    if (ids.includes(module)) {
      expect(question.answerInputs!.every(cfg => cfg.numericRule === 'moneyCents')).toBe(true);
      expect(question.answerInputs!.map(cfg => cfg.valueKey).sort()).toEqual(Object.keys(question.expectedAnswers).sort());
      expect(question.questionText).toContain('centgenau');
      expect(question.questionText).toContain('Bruchteile eines Cents');
    } else {
      expect(question.answerInputs?.some(cfg => cfg.numericRule === 'moneyCents') ?? false).toBe(false);
    }
  }
  const legacy = generateHandelskalkulationQuestion();
  expect(legacy.module).toBe('handelskalkulation');
  expect(legacy.answerInputs!.some(cfg => cfg.numericRule === 'moneyCents')).toBe(false);
  const legacyAnswers=Object.fromEntries(Object.entries(legacy.expectedAnswers).map(([key,value])=>[key,String(value)]));
  const legacyField=legacy.answerInputs!.find(cfg=>Number(legacy.expectedAnswers[cfg.valueKey])>0)!;
  expect(validateQuestionAnswers(legacy,{...legacyAnswers,[legacyField.valueKey]:String(Number(legacy.expectedAnswers[legacyField.valueKey])*1.04)})).toBe(true);
});

it('uses the configured row rule for hints without changing legacy tolerance or accepted answers', () => {
  const q: Question = { id:'money-hint', module:'handelskalkulationVorwaerts', theme:'Test', questionText:'', difficulty:'medium', solutionSteps:[], expectedAnswers:{amount:1000}, answerInputs:moneyInputs, calculationLearning:{rows:[{valueKey:'amount',hint:'Prüfe die Basis.'}]} };
  expect(validateQuestionAnswers(q, {amount:'1040'})).toBe(false);
  expect(getCalculationHints(q, {amount:'1040'})).toHaveLength(1);
  expect(getCalculationHints(q, {amount:'1000,00'})).toEqual([]);
  expect(getCalculationHints(q, {amount:'1000.001'})[0].text).toContain('Cent');
  const legacy = {...q, answerInputs:[{valueKey:'amount'}]};
  expect(getCalculationHints(legacy, {amount:'1040'})).toEqual([]);
});

it.each([
  ['90071992547409.91','9007199254740991e-2',true],
  ['90071992547409.91','90071992547409.9100000000000000001',false],
  ['90071992547409.92','90071992547409.92',false],
  ['0','0e1000000000',true],['0','1e-1000000000',false],['1','1,000',true],
])('handles decimal/exponent range exactly: %s / %s', (expected,answer,accepted) => expect(check(expected,answer)).toBe(accepted));

it('does not bypass an explicitly configured unit when exact money metadata is present', () => {
  const inputs=[{valueKey:'amount',numericRule:'moneyCents' as const,unitKey:'unit'}];
  expect(validateStructuredAnswer(inputs,{amount:1,unit:'EUR'},{amount:'1,00',unit:'eur'})).toBe(true);
  expect(validateStructuredAnswer(inputs,{amount:1,unit:'EUR'},{amount:'1,00',unit:'USD'})).toBe(false);
});
