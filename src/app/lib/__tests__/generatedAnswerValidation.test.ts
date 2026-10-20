import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateQuestionAnswers } from '../answerValidation';
import { GENERATORS, RegistryModuleId } from '../generators/registry';
import { Question } from '../../types';

function generate(module: RegistryModuleId): Question {
  // Stable generated inputs, including counts large enough to expose 5% tolerance.
  vi.spyOn(Math, 'random').mockReturnValue(module === 'osi' ? 0.4 : 0.5);
  return GENERATORS[module]();
}

function correctAnswers(question: Question): Record<string, string> {
  return Object.fromEntries(Object.entries(question.expectedAnswers).map(([key, value]) => [key, String(value)]));
}

afterEach(() => vi.restoreAllMocks());

const addressFields = [
  ['subnetting', 'networkId'], ['subnetting', 'broadcast'],
  ['subnetting', 'hostMin'], ['subnetting', 'hostMax'],
  ['subnetting', 'subnetMask'], ['subnetMask', 'subnetMask'],
  ['subnetMask', 'wildcard'], ['aggregation', 'summaryRoute'],
] as const;

// Exercise generic, configured, and leftover-field validation using real generator payloads.
for (const path of ['generic', 'configured', 'leftover'] as const) {
  describe(`generated exact answers (${path})`, () => {
    function questionFor(module: RegistryModuleId): Question {
      const question = generate(module);
      if (path === 'configured') {
        question.answerInputs = Object.keys(question.expectedAnswers).map(valueKey => ({ valueKey }));
      } else if (path === 'leftover') {
        question.answerInputs = [];
      } else {
        delete question.answerInputs;
      }
      return question;
    }

    it.each(addressFields)('%s %s requires the complete correct IPv4 address', (module, key) => {
      const question = questionFor(module);
      const answers = correctAnswers(question);
      expect(validateQuestionAnswers(question, answers)).toBe(true);
      expect(validateQuestionAnswers(question, { ...answers, [key]: `  ${answers[key]}  ` })).toBe(true);
      const parts = answers[key].split('.');
      const wrongAddress = [...parts.slice(0, 3), String((Number(parts[3]) + 1) % 256)].join('.');
      for (const invalid of [wrongAddress, parts[0], `${answers[key]}junk`, `${parts[0]}.999.0.0`, `${parts[0]}.1.2`, '']) {
        expect(validateQuestionAnswers(question, { ...answers, [key]: invalid }), invalid).toBe(false);
      }
    });

    it.each([
      ['subnetting', 'usableHosts'], ['aggregation', 'summaryCidr'],
      ['binary', 'decimal'], ['hex', 'decimal'], ['raid', 'faultTolerance'], ['overhead', 'frameCount'],
      ['overhead', 'totalBytes'], ['osi', 'layer'],
    ] as const)('%s %s requires an exact integer', (module, key) => {
      const question = questionFor(module);
      const answers = correctAnswers(question);
      expect(validateQuestionAnswers(question, answers)).toBe(true);
      for (const invalid of [String(Number(answers[key]) + 1), `${answers[key]}.01`, `${answers[key]}junk`, `${answers[key]},01`, '']) {
        expect(validateQuestionAnswers(question, { ...answers, [key]: invalid }), invalid).toBe(false);
      }
    });
  });
}

it('preserves generated RAID capacity conversion and measured tolerance', () => {
  const question = generate('raid');
  const answers = correctAnswers(question);
  const cfg = question.answerInputs![0];
  const value = Number(answers[cfg.valueKey]);
  expect(validateQuestionAnswers(question, { ...answers, [cfg.valueKey]: String(value * 1.04) })).toBe(true);
  expect(validateQuestionAnswers(question, { ...answers, [cfg.valueKey]: String(value * 1.06) })).toBe(false);
  const unit = answers[cfg.unitKey!];
  expect(validateQuestionAnswers(question, {
    ...answers,
    [cfg.valueKey]: String(unit === 'TB' ? value * 1000 : value / 1000),
    [cfg.unitKey!]: unit === 'TB' ? 'GB' : 'TB',
  })).toBe(true);
});

it.each(['Infinity', '-Infinity', 'NaN', '1e999'])('rejects nonfinite measured input %s', invalid => {
  const question = generate('raid');
  expect(validateQuestionAnswers(question, { ...correctAnswers(question), usableCapacity: invalid })).toBe(false);
});

it('preserves configured OSI answers and rejects fractional layer numbers', () => {
  const question = generate('osi');
  const answers = correctAnswers(question);
  expect(answers.layer).toBe('4');
  expect(validateQuestionAnswers(question, answers)).toBe(true);
  expect(validateQuestionAnswers(question, { ...answers, layer: '4.1' })).toBe(false);
  const layerInput = question.answerInputs!.find(input => input.valueKey === 'layer')!;
  // Configured alternatives must retain precedence over exact-key validation.
  layerInput.acceptedValues = [...layerInput.acceptedValues!, 'Transport'];
  expect(validateQuestionAnswers(question, { ...answers, layer: '  TRANSPORT  ' })).toBe(true);
});

it('preserves tolerance for the generated rounded overhead efficiency', () => {
  const question = generate('overhead');
  const answers = correctAnswers(question);
  const efficiency = Number(answers.efficiency);
  expect(validateQuestionAnswers(question, { ...answers, efficiency: String(efficiency * 1.04) })).toBe(true);
  expect(validateQuestionAnswers(question, { ...answers, efficiency: String(efficiency * 1.06) })).toBe(false);
});
