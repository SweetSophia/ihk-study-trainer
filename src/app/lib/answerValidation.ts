import { AnswerInputConfig, Question } from '../types';

const SIZE_TO_BYTES: Record<string, number> = {
  bytes: 1,
  kib: 1024,
  kb: 1000,
  mib: 1024 * 1024,
  mb: 1000 * 1000,
  gib: 1024 * 1024 * 1024,
  gb: 1000 * 1000 * 1000,
};

const TIME_TO_SECONDS: Record<string, number> = {
  sekunden: 1,
  minuten: 60,
  stunden: 3600,
};

/**
 * Parse a numeric string where a comma is treated as the decimal separator.
 */
export function parseLocaleFloat(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}

/**
 * Detect the conversion map that applies for the given unit options.
 * Returns null when no conversion-aware check is needed.
 */
function detectConversionMap(
  unitOptions: string[]
): Record<string, number> | null {
  const lower = unitOptions.map((u) => u.toLowerCase());
  if (lower.some((u) => u in SIZE_TO_BYTES)) return SIZE_TO_BYTES;
  if (lower.some((u) => u in TIME_TO_SECONDS)) return TIME_TO_SECONDS;
  return null;
}

/**
 * Validate structured answers using unit-aware comparison.
 *
 * For file-size or time answers the user may choose a different (but valid)
 * unit and supply the mathematically equivalent value. We normalise both sides
 * to a common base (bytes / seconds) and compare with 5 % tolerance.
 */
export function validateStructuredAnswer(
  inputs: AnswerInputConfig[],
  expected: Record<string, string | number | boolean>,
  answers: Record<string, string>
): boolean {
  const allUnitOptions = inputs.flatMap((cfg) => cfg.unitOptions ?? []);
  const convMap = detectConversionMap(allUnitOptions);

  if (convMap) {
    let expectedTotal = 0;
    for (const cfg of inputs) {
      const val = Number(expected[cfg.valueKey]);
      const unit = String(expected[cfg.unitKey ?? '']).toLowerCase();
      const factor = convMap[unit];
      if (factor === undefined) return false;
      expectedTotal += val * factor;
    }

    let userTotal = 0;
    for (const cfg of inputs) {
      const val = parseLocaleFloat(answers[cfg.valueKey] || '');
      const unit = (answers[cfg.unitKey ?? ''] || '').toLowerCase();
      if (isNaN(val) || convMap[unit] === undefined) return false;
      userTotal += val * convMap[unit];
    }

    if (expectedTotal === 0) return userTotal === 0;
    const tolerance = Math.abs(expectedTotal) * 0.05;
    return Math.abs(userTotal - expectedTotal) <= tolerance;
  }

  const configByKey = new Map(inputs.map((cfg) => [cfg.valueKey, cfg]));
  const acceptedFieldAnswers: string[] = [];

  for (const [key, exp] of Object.entries(expected)) {
    const cfg = configByKey.get(key);

    if (cfg?.acceptedValues) {
      const userAnswer = (answers[key] ?? '').trim().replace(/\s+/g, ' ');
      if (!userAnswer) return false;
      const userNorm = userAnswer.toLowerCase();
      if (!cfg.acceptedValues.some((v) => v.toLowerCase().replace(/\s+/g, ' ') === userNorm)) {
        return false;
      }
      if (cfg.acceptedValues.length > 1) {
        acceptedFieldAnswers.push(userNorm);
      }
      continue;
    }

    const userAnswer = answers[key]?.trim().toLowerCase();
    const expectedStr = String(exp).toLowerCase();
    const userNum = parseLocaleFloat(userAnswer);
    const expectedNum = parseLocaleFloat(expectedStr);
    if (!isNaN(userNum) && !isNaN(expectedNum)) {
      const tolerance = Math.abs(expectedNum) * 0.05;
      if (Math.abs(userNum - expectedNum) > tolerance) return false;
    } else if (userAnswer !== expectedStr) {
      return false;
    }
  }

  if (
    acceptedFieldAnswers.length > 1 &&
    new Set(acceptedFieldAnswers).size !== acceptedFieldAnswers.length
  ) {
    return false;
  }

  return true;
}

/**
 * Validate a question answer payload independently of authentication state.
 */
export function validateQuestionAnswers(
  question: Question,
  answers: Record<string, string>
): boolean {
  if (question.answerInputs) {
    return validateStructuredAnswer(question.answerInputs, question.expectedAnswers, answers);
  }

  for (const [key, expected] of Object.entries(question.expectedAnswers)) {
    if (key === 'unit') continue;

    const userAnswer = answers[key]?.trim().toLowerCase();
    const expectedStr = String(expected).toLowerCase();
    const userNum = parseLocaleFloat(userAnswer);
    const expectedNum = parseLocaleFloat(expectedStr);

    if (!isNaN(userNum) && !isNaN(expectedNum)) {
      const tolerance = Math.abs(expectedNum) * 0.05;
      if (Math.abs(userNum - expectedNum) > tolerance) {
        return false;
      }
    } else if (userAnswer !== expectedStr) {
      return false;
    }
  }

  return true;
}
