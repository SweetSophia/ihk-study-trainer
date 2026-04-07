import { describe, expect, it, vi, afterEach } from 'vitest';

import { generateHexBinaryQuestion, HEX_BINARY_PAIRS } from '../hexBinary';

describe('generateHexBinaryQuestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a question with valid structure', () => {
    const q = generateHexBinaryQuestion();
    expect(q.theme).toBe('Zahlensysteme');
    expect(q.questionText).toBeDefined();
    expect(q.solutionSteps.length).toBeGreaterThan(0);
    expect('hex' in q.expectedAnswers || 'binary' in q.expectedAnswers).toBe(true);
    expect(Object.keys(q.expectedAnswers)).toHaveLength(1);
    expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
  });

  it('generates hex-to-binary when direction roll > 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const q = generateHexBinaryQuestion();
    expect(q.questionText).toMatch(/^Wandle die Hexadezimalzahl/);
    expect('binary' in q.expectedAnswers).toBe(true);
  });

  it('generates binary-to-hex when direction roll <= 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const q = generateHexBinaryQuestion();
    expect(q.questionText).toMatch(/^Wandle die Binärzahl/);
    expect('hex' in q.expectedAnswers).toBe(true);
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
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const q = generateHexBinaryQuestion();
    expect(q.solutionSteps.join('\n')).toContain('4-Bit-Binär');
    expect(q.solutionSteps.join('\n')).toContain('Schritt 1');
    expect(q.solutionSteps.join('\n')).toContain('Schritt 2');
    expect(q.solutionSteps.join('\n')).toContain('Schritt 3');
  });

  it('binary-to-hex solution steps contain 4-bit grouping', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const q = generateHexBinaryQuestion();
    expect(q.solutionSteps.join('\n')).toContain('4-Bit-Gruppen');
    expect(q.solutionSteps.join('\n')).toContain('Schritt 1');
    expect(q.solutionSteps.join('\n')).toContain('Schritt 2');
    expect(q.solutionSteps.join('\n')).toContain('Schritt 3');
  });

  it('difficulty is easy for values 0-127, medium for 128-191, hard for 192-255', () => {
    const easy = HEX_BINARY_PAIRS.filter(p => p.decimal <= 127);
    const medium = HEX_BINARY_PAIRS.filter(p => p.decimal >= 128 && p.decimal <= 191);
    const hard = HEX_BINARY_PAIRS.filter(p => p.decimal >= 192);

    expect(easy.every(p => p.difficulty === 'easy')).toBe(true);
    expect(medium.every(p => p.difficulty === 'medium')).toBe(true);
    expect(hard.every(p => p.difficulty === 'hard')).toBe(true);
  });

  it('hex-to-binary solution ends with binary result', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const q = generateHexBinaryQuestion();
    const lastStep = q.solutionSteps[q.solutionSteps.length - 1];
    expect(lastStep).toContain(q.expectedAnswers.binary);
  });

  it('binary-to-hex solution ends with hex result', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const q = generateHexBinaryQuestion();
    const lastStep = q.solutionSteps[q.solutionSteps.length - 1];
    expect(lastStep).toContain(q.expectedAnswers.hex);
  });
});
