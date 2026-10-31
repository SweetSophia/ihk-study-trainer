import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Question } from '../../types';
import { getCalculationHints } from '../calculationLearning';
import { validateQuestionAnswers, validateStructuredAnswer } from '../answerValidation';
import { generateVorwaertsKalkulationQuestion, generateRueckwaertsKalkulationQuestion, generateDifferenzKalkulationQuestion } from '../generators/handelskalkulation';

afterEach(() => vi.restoreAllMocks());
const fixture = (): Question => ({
  id: 'learning-fixture', module: 'handelskalkulationVorwaerts', theme: 'Test', questionText: 'Test', difficulty: 'medium', solutionSteps: ['Test'],
  expectedAnswers: { skonto: 2.70, ust: 19, differenz: -20 },
  answerInputs: [{ valueKey: 'skonto', label: 'Lieferskonto' }, { valueKey: 'ust', label: 'Umsatzsteuer' }, { valueKey: 'differenz', label: 'Preisabstand' }],
  calculationLearning: { rows: [
    { valueKey: 'skonto', hint: 'Prüfe den ZEP als Basis.', alternatives: [{ value: 3, hint: 'Prüfe die Skontobasis: ZEP nach Rabatt, nicht LEP.' }] },
    { valueKey: 'ust', hint: 'Prüfe die Nettobasis.', alternatives: [{ value: 22.61, hint: 'Prüfe die Umsatzsteuerbasis, erst den Netto-VK bestimmen.' }] },
    { valueKey: 'differenz', hint: 'Vergleiche die Brutto-VK.', alternatives: [{ value: 20, hint: 'Prüfe die Reihenfolge und das Vorzeichen.' }] },
  ] },
});
const correct = { skonto: '2,70', ust: '19', differenz: '-20' };

describe('calculation guidance defers to the existing validator', () => {
  it('is silent for correct answers and modules without guidance', () => {
    expect(getCalculationHints(fixture(), correct)).toEqual([]);
    expect(getCalculationHints({ ...fixture(), calculationLearning: undefined }, { ...correct, skonto: '99' })).toEqual([]);
  });
  it('selects at most two rejected fields in display order with their labels', () => {
    const hints = getCalculationHints(fixture(), { skonto: '3,00', ust: '22,61', differenz: '20' });
    expect(hints).toEqual([
      { valueKey: 'skonto', label: 'Lieferskonto', text: 'Prüfe die Skontobasis: ZEP nach Rabatt, nicht LEP.' },
      { valueKey: 'ust', label: 'Umsatzsteuer', text: 'Prüfe die Umsatzsteuerbasis, erst den Netto-VK bestimmen.' },
    ]);
    expect(hints.map(hint => hint.text).join(' ')).not.toMatch(/du hast|du dachtest|vergessen/i);
  });
  it('uses a matching rejected sign pattern but does not invent a reason for unrelated numbers', () => {
    expect(getCalculationHints(fixture(), { ...correct, differenz: '20' })[0].text).toContain('Vorzeichen');
    expect(getCalculationHints(fixture(), { ...correct, differenz: '99' })[0].text).toBe('Vergleiche die Brutto-VK.');
  });
  it.each(['3x', '3,0.0', '', 'NaN', 'Infinity', '1e309', '3 €'])('gives format guidance for invalid complete input %s', value => {
    const hints = getCalculationHints(fixture(), { ...correct, skonto: value });
    expect(hints).toHaveLength(1);
    expect(hints[0].text).toContain('vollständigen Zahlenwert');
    expect(hints[0].text).not.toContain('Skontobasis');
  });
  it.each([['95', true], ['105', true], ['94,99', false], ['105.01', false]])('matches the existing tolerance decision for %s', (value, accepted) => {
    const q = fixture(); q.expectedAnswers.skonto = 100;
    const answers = { ...correct, skonto: value };
    expect(validateQuestionAnswers(q, answers)).toBe(accepted);
    expect(getCalculationHints(q, answers).length).toBe(accepted ? 0 : 1);
  });
  it('never flags an accepted pattern-like value even when another field is wrong', () => {
    const q = fixture(); q.expectedAnswers.skonto = 3.09;
    const hints = getCalculationHints(q, { ...correct, skonto: '3', differenz: '20' });
    expect(hints.map(hint => hint.valueKey)).toEqual(['differenz']);
  });
  it('preserves exact zero acceptance and accepts an equivalent signed comma/exponent answer', () => {
    const q = fixture(); q.expectedAnswers.differenz = 0;
    expect(getCalculationHints(q, { ...correct, differenz: '-0,0' })).toEqual([]);
    expect(getCalculationHints(q, { ...correct, differenz: '0.01' })).toHaveLength(1);
    expect(getCalculationHints(fixture(), { ...correct, differenz: '-2e1' })).toEqual([]);
  });
  it('builds real generator patterns without changing or mutating objective payloads', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const q = generateVorwaertsKalkulationQuestion('standard');
    const answers = Object.fromEntries(Object.entries(q.expectedAnswers).map(([k,v]) => [k,String(v)]));
    const row = q.calculationLearning!.rows.find(row => row.valueKey === 'skonto')!;
    const altered = { ...answers, skonto: String(row.alternatives![0].value).replace('.', ',') };
    const snapshot = JSON.stringify({ q, altered });
    expect(validateQuestionAnswers(q, altered)).toBe(false);
    expect(getCalculationHints(q, altered)[0].text).toContain('Skontobasis');
    expect(JSON.stringify({ q, altered })).toBe(snapshot);
    const diff = generateDifferenzKalkulationQuestion('matching-market');
    const diffAnswers = Object.fromEntries(Object.entries(diff.expectedAnswers).map(([k,v]) => [k,String(v)]));
    expect(getCalculationHints(diff, diffAnswers)).toEqual([]);
  });
  it('uses neutral zero-gap guidance for a rejected sub-cent value, not a nonexistent sign reversal', () => {
    const q = generateDifferenzKalkulationQuestion('matching-market');
    const answers = Object.fromEntries(Object.entries(q.expectedAnswers).map(([k,v]) => [k,String(v)]));
    const hints = getCalculationHints(q, { ...answers, differenz: '0,001' });
    expect(hints).toHaveLength(1);
    expect(hints[0].text).toContain('null = gleich');
    expect(hints[0].text).not.toContain('Vorzeichen');
  });
  it.each([
    ['forward standard', () => generateVorwaertsKalkulationQuestion('standard')],
    ['forward zero customer skonto', () => generateVorwaertsKalkulationQuestion('no-customer-skonto')],
    ['backward standard', () => generateRueckwaertsKalkulationQuestion('standard')],
    ['backward zero supplier rebate', () => generateRueckwaertsKalkulationQuestion('no-supplier-rebate')],
    ['differential positive', () => generateDifferenzKalkulationQuestion('standard')],
    ['differential negative', () => generateDifferenzKalkulationQuestion('standard')],
    ['differential matching', () => generateDifferenzKalkulationQuestion('matching-market')],
  ] as const)('checks every real numeric-pattern candidate against the existing validator: %s', (name, make) => {
    let calls = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => name === 'differential negative' && calls++ >= 8 ? 0 : 0.5);
    const q = make();
    const answers = Object.fromEntries(Object.entries(q.expectedAnswers).map(([key,value]) => [key,String(value)]));
    let rejectedPatterns = 0;
    for (const row of q.calculationLearning!.rows) {
      expect(Object.hasOwn(q.expectedAnswers, row.valueKey)).toBe(true);
      const config = q.answerInputs!.find(input => input.valueKey === row.valueKey)!;
      // The guidance contract is deliberately limited to these monetary rows.
      expect(config).toBeDefined();
      expect(config.unitKey).toBeUndefined();
      expect(config.acceptedValues).toBeUndefined();
      expect(config.valueOptions).toBeUndefined();
      for (const pattern of row.alternatives ?? []) {
        const value = String(pattern.value);
        const accepted = validateStructuredAnswer([config], { [row.valueKey]: q.expectedAnswers[row.valueKey] }, { [row.valueKey]: value });
        const hints = getCalculationHints(q, { ...answers, [row.valueKey]: value });
        if (accepted) {
          expect(hints).toEqual([]);
          const otherKey = Object.keys(answers).find(key => key !== row.valueKey)!;
          expect(getCalculationHints(q, { ...answers, [row.valueKey]: value, [otherKey]: '99999999' }).some(hint => hint.valueKey === row.valueKey)).toBe(false);
        } else {
          rejectedPatterns++;
          expect(hints).toEqual([{ valueKey: row.valueKey, label: config.label, text: pattern.hint }]);
        }
      }
    }
    expect(rejectedPatterns).toBeGreaterThan(0);
  });
  it('keeps a real cross-row numeric coincidence a neutral maths reminder, not a claim about its cause', () => {
    const randoms = [0.5,0.5,0.5,0.5,0.5,0.5,0.99,0];
    vi.spyOn(Math, 'random').mockImplementation(() => randoms.shift() ?? 0.5);
    const q = generateVorwaertsKalkulationQuestion('standard');
    expect(q.expectedAnswers).toMatchObject({ kundenskonto: 63.19, kundenrabatt: 66.52 });
    const answers = Object.fromEntries(Object.entries(q.expectedAnswers).map(([key,value]) => [key,String(value)]));
    const hints = getCalculationHints(q, { ...answers, kundenrabatt: '63,19' });
    expect(hints).toHaveLength(1);
    expect(hints[0].valueKey).toBe('kundenrabatt');
    expect(hints[0].text).toBe('Prüfe die Rabattbasis: Der Kundenrabatt bezieht sich auf den Netto-VK (100%), nicht auf den bereits verminderten ZVP.');
    expect(hints[0].text).not.toMatch(/du hast|du dachtest|du verwendest|dein fehler|vergessen/i);
  });
});
