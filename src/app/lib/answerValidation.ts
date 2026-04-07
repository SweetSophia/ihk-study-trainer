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
export function parseLocaleFloat(raw?: string | null): number {
  if (raw == null || raw.trim() === '') {
    return Number.NaN;
  }

  return parseFloat(raw.replace(',', '.'));
}

const RADIX_KEYS = new Set(['binary', 'hex']);

const BASE_FOR_KEY: Record<string, number> = {
  binary: 2,
  hex: 16,
};

const VALID_BASE_PATTERN: Record<number, RegExp> = {
  2: /^[01]+$/,
  16: /^[0-9a-f]+$/,
};

/**
 * Normalise a hex-style user answer by stripping an optional "0x" prefix.
 */
function normalizeHexAnswer(s: string): string {
  return s.replace(/^0x/i, '');
}

/**
 * Returns true when the string is a binary value with significant leading zeros
 * (e.g. "00011000"). Such values must be compared as fixed-width strings because
 * numeric parsing strips leading zeros and would incorrectly match "11000"
 * against "00011000".
 */
function hasBinaryLeadingZeros(s: string): boolean {
  return /^0[01]+$/.test(s);
}

/**
 * Validate a non-decimal (binary or hex) answer field.
 * Returns true when the answer is acceptable, false to reject.
 */
function validateNonDecimalKey(
  key: string,
  rawUserAnswer: string,
  expectedStr: string,
): boolean | undefined {
  if (!RADIX_KEYS.has(key)) return undefined;

  // Note: "0b" prefix is intentionally not supported for binary; only bare digit strings are accepted.

  let userAnswer = rawUserAnswer;
  if (key === 'hex') {
    userAnswer = normalizeHexAnswer(userAnswer);
  }

  if (key === 'binary' && hasBinaryLeadingZeros(expectedStr)) {
    if (!VALID_BASE_PATTERN[2].test(userAnswer)) return false;
    return userAnswer === expectedStr;
  }

  const base = BASE_FOR_KEY[key];
  if (!VALID_BASE_PATTERN[base].test(userAnswer)) return false;
  if (key === 'binary' && userAnswer.length !== expectedStr.length) return false;

  const userVal = parseInt(userAnswer, base);
  const expectedVal = parseInt(expectedStr, base);
  return !isNaN(userVal) && !isNaN(expectedVal) && userVal === expectedVal;
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
  const acceptedFieldAnswers: string[] = [];
  const processedKeys = new Set<string>();

  for (const cfg of inputs) {
    processedKeys.add(cfg.valueKey);
    if (cfg.unitKey) {
      processedKeys.add(cfg.unitKey);
    }

    if (cfg.acceptedValues) {
      const userAnswer = (answers[cfg.valueKey] ?? '').trim().replace(/\s+/g, ' ');
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

    const userAnswer = (answers[cfg.valueKey] ?? '').trim().toLowerCase();
    const expectedStr = String(expected[cfg.valueKey]).toLowerCase();

    const nonDecimalResult = validateNonDecimalKey(cfg.valueKey, userAnswer, expectedStr);
    if (nonDecimalResult !== undefined) {
      if (!nonDecimalResult) return false;
      continue;
    }

    const userNum = parseLocaleFloat(userAnswer);
    const expectedNum = parseLocaleFloat(expectedStr);
    const convMap = detectConversionMap(cfg.unitOptions ?? []);

    if (convMap && cfg.unitKey) {
      const expectedUnit = String(expected[cfg.unitKey] ?? '').toLowerCase();
      const userUnit = (answers[cfg.unitKey] ?? '').toLowerCase();
      const expectedFactor = convMap[expectedUnit];
      const userFactor = convMap[userUnit];

      if (
        isNaN(userNum) ||
        isNaN(expectedNum) ||
        expectedFactor === undefined ||
        userFactor === undefined
      ) {
        return false;
      }

      const expectedBase = expectedNum * expectedFactor;
      const userBase = userNum * userFactor;

      if (expectedBase === 0) {
        if (userBase !== 0) return false;
      } else {
        const tolerance = Math.abs(expectedBase) * 0.05;
        if (Math.abs(userBase - expectedBase) > tolerance) return false;
      }

      continue;
    }

    if (!isNaN(userNum) && !isNaN(expectedNum)) {
      const tolerance = Math.abs(expectedNum) * 0.05;
      if (Math.abs(userNum - expectedNum) > tolerance) return false;
    } else if (userAnswer !== expectedStr) {
      return false;
    }
  }

  for (const [key, exp] of Object.entries(expected)) {
    if (processedKeys.has(key)) {
      continue;
    }

    const userAnswer = (answers[key] ?? '').trim().toLowerCase();
    const expectedStr = String(exp).toLowerCase();

    const nonDecimalResult = validateNonDecimalKey(key, userAnswer, expectedStr);
    if (nonDecimalResult !== undefined) {
      if (!nonDecimalResult) return false;
      continue;
    }

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

    const userAnswer = (answers[key] ?? '').trim().toLowerCase();
    const expectedStr = String(expected).toLowerCase();

    const nonDecimalResult = validateNonDecimalKey(key, userAnswer, expectedStr);
    if (nonDecimalResult !== undefined) {
      if (!nonDecimalResult) return false;
      continue;
    }

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
