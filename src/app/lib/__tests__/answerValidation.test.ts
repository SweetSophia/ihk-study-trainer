import { describe, expect, it } from 'vitest';

import { validateQuestionAnswers, validateStructuredAnswer } from '../answerValidation';
import { Question } from '../../types';

describe('answer validation helpers', () => {
  it('validates plain numeric questions independently of authentication state', () => {
    const question: Question = {
      id: 'calc-1',
      theme: 'Test',
      module: 'math',
      questionText: '2 + 2 = ?',
      expectedAnswers: { result: 4 },
      solutionSteps: ['4'],
      difficulty: 'easy',
    };

    expect(validateQuestionAnswers(question, { result: '4' })).toBe(true);
    expect(validateQuestionAnswers(question, { result: '4,1' })).toBe(true);
    expect(validateQuestionAnswers(question, { result: '4.3' })).toBe(false);
  });

  it('rejects duplicate picks across multi-correct acceptedValues fields', () => {
    expect(
      validateStructuredAnswer(
        [
          { valueKey: 'a', acceptedValues: ['HTTP', 'HTTPS'] },
          { valueKey: 'b', acceptedValues: ['HTTP', 'HTTPS'] },
        ],
        { a: 'HTTP', b: 'HTTPS' },
        { a: 'HTTP', b: 'HTTP' }
      )
    ).toBe(false);
  });

  it('accepts equivalent unit-converted totals within tolerance', () => {
    expect(
      validateStructuredAnswer(
        [
          { valueKey: 'size', unitKey: 'unit', unitOptions: ['MiB', 'GiB'] },
        ],
        { size: 1024, unit: 'mib' },
        { size: '1', unit: 'gib' }
      )
    ).toBe(true);
  });


  it('returns false instead of throwing when a numeric field is missing', () => {
    expect(
      validateStructuredAnswer(
        [{ valueKey: 'result' }],
        { result: 42 },
        {}
      )
    ).toBe(false);
  });

  it('validates structured conversion answers per field so errors cannot cancel out', () => {
    expect(
      validateStructuredAnswer(
        [
          { valueKey: 'download', unitKey: 'downloadUnit', unitOptions: ['MiB', 'GiB'] },
          { valueKey: 'duration', unitKey: 'durationUnit', unitOptions: ['Sekunden', 'Minuten'] },
        ],
        {
          download: 1024,
          downloadUnit: 'mib',
          duration: 120,
          durationUnit: 'sekunden',
        },
        {
          download: '0.5',
          downloadUnit: 'gib',
          duration: '11.4667',
          durationUnit: 'minuten',
        }
      )
    ).toBe(false);
  });

  describe('binary answers with leading zeros', () => {
    const binaryQuestion: Question = {
      id: 'binary-1',
      theme: 'Zahlensysteme',
      module: 'binary',
      questionText: 'Wandle die Dezimalzahl 24 in eine 8-Bit-Binärzahl um.',
      expectedAnswers: { binary: '00011000' },
      solutionSteps: ['00011000'],
      difficulty: 'easy',
    };

    it('accepts the correct 8-bit binary answer', () => {
      expect(validateQuestionAnswers(binaryQuestion, { binary: '00011000' })).toBe(true);
    });

    it('rejects binary answer without leading zeros', () => {
      expect(validateQuestionAnswers(binaryQuestion, { binary: '11000' })).toBe(false);
    });

    it('rejects wrong binary answer of same numeric value', () => {
      expect(validateQuestionAnswers(binaryQuestion, { binary: '0011000' })).toBe(false);
    });

    it('rejects off-by-one answers for 8-bit binary values starting with 1', () => {
      const highBitBinaryQuestion: Question = {
        ...binaryQuestion,
        id: 'binary-2',
        questionText: 'Wandle die Dezimalzahl 200 in eine 8-Bit-Binärzahl um.',
        expectedAnswers: { binary: '11001000' },
        solutionSteps: ['11001000'],
      };
      expect(validateQuestionAnswers(highBitBinaryQuestion, { binary: '11001000' })).toBe(true);
      expect(validateQuestionAnswers(highBitBinaryQuestion, { binary: '11001001' })).toBe(false);
    });

    it('enforces leading zeros for all-zero binary', () => {
      const allZeros: Question = {
        ...binaryQuestion,
        expectedAnswers: { binary: '00000000' },
      };
      expect(validateQuestionAnswers(allZeros, { binary: '00000000' })).toBe(true);
      expect(validateQuestionAnswers(allZeros, { binary: '0' })).toBe(false);
      expect(validateQuestionAnswers(allZeros, { binary: '0000000' })).toBe(false);
    });
  });

  describe('hex answers with 0x prefix', () => {
    const hexQuestion: Question = {
      id: 'hex-1',
      theme: 'Zahlensysteme',
      module: 'hexBinary',
      questionText: 'Wandle die Binärzahl 00011000 in eine Hexadezimalzahl um.',
      expectedAnswers: { hex: '18' },
      solutionSteps: ['0x18'],
      difficulty: 'easy',
    };

    it('accepts plain hex answer', () => {
      expect(validateQuestionAnswers(hexQuestion, { hex: '18' })).toBe(true);
    });

    it('accepts hex answer with 0x prefix', () => {
      expect(validateQuestionAnswers(hexQuestion, { hex: '0x18' })).toBe(true);
    });

    it('accepts hex answer with 0X prefix (uppercase)', () => {
      expect(validateQuestionAnswers(hexQuestion, { hex: '0X18' })).toBe(true);
    });

    it('rejects wrong hex answer', () => {
      expect(validateQuestionAnswers(hexQuestion, { hex: '1B' })).toBe(false);
    });

    it('accepts 0x-prefixed shorthand for zero-padded expected hex answers', () => {
      const zeroPaddedHexQuestion: Question = {
        ...hexQuestion,
        expectedAnswers: { hex: '00F' },
        solutionSteps: ['0x00F'],
      };
      expect(validateQuestionAnswers(zeroPaddedHexQuestion, { hex: '00F' })).toBe(true);
      expect(validateQuestionAnswers(zeroPaddedHexQuestion, { hex: '00f' })).toBe(true);
      expect(validateQuestionAnswers(zeroPaddedHexQuestion, { hex: '0xF' })).toBe(true);
      expect(validateQuestionAnswers(zeroPaddedHexQuestion, { hex: '0xf' })).toBe(true);
      expect(validateQuestionAnswers(zeroPaddedHexQuestion, { hex: '0xE' })).toBe(false);
    });

    it('accepts hex answer with leading zeros and 0x prefix', () => {
      const hexWithLeadingZeros: Question = {
        ...hexQuestion,
        expectedAnswers: { hex: '001' },
      };
      expect(validateQuestionAnswers(hexWithLeadingZeros, { hex: '001' })).toBe(true);
      expect(validateQuestionAnswers(hexWithLeadingZeros, { hex: '0x001' })).toBe(true);
      expect(validateQuestionAnswers(hexWithLeadingZeros, { hex: '1' })).toBe(false);
    });

    it('handles hex answers with letters case-insensitively', () => {
      const hexWithLetter: Question = {
        ...hexQuestion,
        expectedAnswers: { hex: 'AF' },
      };
      expect(validateQuestionAnswers(hexWithLetter, { hex: 'AF' })).toBe(true);
      expect(validateQuestionAnswers(hexWithLetter, { hex: 'af' })).toBe(true);
      expect(validateQuestionAnswers(hexWithLetter, { hex: '0xAF' })).toBe(true);
      expect(validateQuestionAnswers(hexWithLetter, { hex: '0xaf' })).toBe(true);
      expect(validateQuestionAnswers(hexWithLetter, { hex: 'AB' })).toBe(false);
    });
  });

  describe('regular numeric answers are unaffected', () => {
    it('still accepts numeric answers within 5% tolerance', () => {
      const question: Question = {
        id: 'bandwidth-1',
        theme: 'Test',
        module: 'bandwidth',
        questionText: 'How long?',
        expectedAnswers: { result: 100 },
        solutionSteps: ['100'],
        difficulty: 'medium',
      };
      expect(validateQuestionAnswers(question, { result: '100' })).toBe(true);
      expect(validateQuestionAnswers(question, { result: '102' })).toBe(true);
      expect(validateQuestionAnswers(question, { result: '110' })).toBe(false);
    });

    it('still handles decimal comma', () => {
      const question: Question = {
        id: 'calc-1',
        theme: 'Test',
        module: 'math',
        questionText: 'Calculate',
        expectedAnswers: { result: 4.5 },
        solutionSteps: ['4.5'],
        difficulty: 'easy',
      };
      expect(validateQuestionAnswers(question, { result: '4,5' })).toBe(true);
      expect(validateQuestionAnswers(question, { result: '4.5' })).toBe(true);
    });
  });
});
