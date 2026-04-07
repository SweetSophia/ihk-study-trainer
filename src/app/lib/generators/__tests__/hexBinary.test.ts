import { describe, expect, it } from 'vitest';

import { generateHexBinaryQuestion, HEX_BINARY_PAIRS } from '../hexBinary';

describe('generateHexBinaryQuestion', () => {
  it('generates a question with valid structure', () => {
    const q = generateHexBinaryQuestion();
    expect(q.theme).toBe('Zahlensysteme');
    expect(q.questionText).toBeDefined();
    expect(q.solutionSteps.length).toBeGreaterThan(0);
    expect('hex' in q.expectedAnswers || 'binary' in q.expectedAnswers).toBe(true);
    expect(Object.keys(q.expectedAnswers)).toHaveLength(1);
    expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
  });

  it('generates either hex-to-binary or binary-to-hex questions', () => {
    let sawHexToBinary = false;
    let sawBinaryToHex = false;

    for (let i = 0; i < 100; i++) {
      const q = generateHexBinaryQuestion();
      if (q.questionText.startsWith('Wandle die Hexadezimalzahl')) {
        sawHexToBinary = true;
      } else if (q.questionText.startsWith('Wandle die Binärzahl')) {
        sawBinaryToHex = true;
      }

      if (sawHexToBinary && sawBinaryToHex) break;
    }

    expect(sawHexToBinary).toBe(true);
    expect(sawBinaryToHex).toBe(true);
  });

  it('has exactly 256 hex/binary pairs covering 0x00-0xFF', () => {
    expect(HEX_BINARY_PAIRS.length).toBe(256);
  });

  it('each pair has matching hex, binary, and decimal values', () => {
    for (const pair of HEX_BINARY_PAIRS) {
      const decimalFromHex = parseInt(pair.hex, 16);
      const decimalFromBinary = parseInt(pair.binary, 2);
      expect(decimalFromHex).toBe(pair.decimal);
      expect(decimalFromBinary).toBe(pair.decimal);
      expect(pair.hex).toBe(decimalFromHex.toString(16).toUpperCase().padStart(2, '0'));
      expect(pair.binary).toBe(decimalFromBinary.toString(2).padStart(8, '0'));
    }
  });

  it('hex-to-binary solution steps contain nibble conversion', () => {
    let tested = false;
    for (let i = 0; i < 50; i++) {
      const q = generateHexBinaryQuestion();
      if (q.questionText.startsWith('Wandle die Hexadezimalzahl')) {
        tested = true;
        expect(q.solutionSteps.join('\n')).toContain('4-Bit-Binär');
        expect(q.solutionSteps.join('\n')).toContain('Schritt 1');
        expect(q.solutionSteps.join('\n')).toContain('Schritt 2');
        expect(q.solutionSteps.join('\n')).toContain('Schritt 3');
        break;
      }
    }
    expect(tested).toBe(true);
  });

  it('binary-to-hex solution steps contain 4-bit grouping', () => {
    let tested = false;
    for (let i = 0; i < 50; i++) {
      const q = generateHexBinaryQuestion();
      if (q.questionText.startsWith('Wandle die Binärzahl')) {
        tested = true;
        expect(q.solutionSteps.join('\n')).toContain('4-Bit-Gruppen');
        expect(q.solutionSteps.join('\n')).toContain('Schritt 1');
        expect(q.solutionSteps.join('\n')).toContain('Schritt 2');
        expect(q.solutionSteps.join('\n')).toContain('Schritt 3');
        break;
      }
    }
    expect(tested).toBe(true);
  });

  it('difficulty is easy for values 0-127, medium for 128-191, hard for 192-255', () => {
    const easy = HEX_BINARY_PAIRS.filter(p => p.decimal <= 127);
    const medium = HEX_BINARY_PAIRS.filter(p => p.decimal >= 128 && p.decimal <= 191);
    const hard = HEX_BINARY_PAIRS.filter(p => p.decimal >= 192);

    expect(easy.every(p => p.difficulty === 'easy')).toBe(true);
    expect(medium.every(p => p.difficulty === 'medium')).toBe(true);
    expect(hard.every(p => p.difficulty === 'hard')).toBe(true);
  });

  it('solution steps end with the correct result', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateHexBinaryQuestion();
      const lastStep = q.solutionSteps[q.solutionSteps.length - 1];

      if (q.questionText.startsWith('Wandle die Hexadezimalzahl')) {
        expect('binary' in q.expectedAnswers).toBe(true);
        expect(lastStep).toContain(q.expectedAnswers.binary);
      } else {
        expect('hex' in q.expectedAnswers).toBe(true);
        expect(lastStep).toContain(q.expectedAnswers.hex);
      }
    }
  });
});
