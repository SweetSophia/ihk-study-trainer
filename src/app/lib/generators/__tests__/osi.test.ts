import { describe, it, expect } from 'vitest';
import {
  generateOsiOrderQuestion,
  generateOsiQuestion,
  OSI_LAYER_NAMES,
} from '../osi';

describe('generateOsiOrderQuestion', () => {
  it('uses the osi module theme and orders-related question text', () => {
    const q = generateOsiOrderQuestion();
    expect(q.theme).toBe('TCP/IP-Referenzmodell & Protokolle');
    expect(q.questionText.toLowerCase()).toContain('sortiere');
    expect(q.questionText.toLowerCase()).toContain('osi');
  });

  it('emits a dragOrder config with exactly 7 items', () => {
    const q = generateOsiOrderQuestion();
    expect(q.dragOrder).toBeDefined();
    expect(q.dragOrder.items).toHaveLength(7);
    expect(q.dragOrder.correctOrder).toHaveLength(7);
  });

  it('places the canonical order as Layer 1 (Physical) first and Layer 7 (Application) last', () => {
    const q = generateOsiOrderQuestion();
    expect(q.dragOrder.correctOrder[0]).toBe(OSI_LAYER_NAMES[1]);
    expect(q.dragOrder.correctOrder[6]).toBe(OSI_LAYER_NAMES[7]);
  });

  it('expectedAnswers.order is the correct order as a comma-separated string', () => {
    const q = generateOsiOrderQuestion();
    expect(q.expectedAnswers.order).toBe(q.dragOrder.correctOrder.join(','));
  });

  it('items are a permutation of the correct order (same set, different sequence)', () => {
    const q = generateOsiOrderQuestion();
    expect(new Set(q.dragOrder.items)).toEqual(new Set(q.dragOrder.correctOrder));
  });

  it('does not produce an already-sorted display (avoids a trivial "no drag needed" exercise)', () => {
    // Run many times — none should produce an initially-correct shuffle.
    for (let i = 0; i < 30; i++) {
      const q = generateOsiOrderQuestion();
      const isSorted = q.dragOrder.items.every(
        (v, idx) => v === q.dragOrder.correctOrder[idx],
      );
      expect(isSorted).toBe(false);
    }
  });

  it('emits exactly 7 layers in the correct order (no duplicates, no missing)', () => {
    const q = generateOsiOrderQuestion();
    for (let layer = 1; layer <= 7; layer++) {
      expect(q.dragOrder.correctOrder).toContain(OSI_LAYER_NAMES[layer]);
    }
  });

  it('provides solution steps that walk through all 7 layers', () => {
    const q = generateOsiOrderQuestion();
    for (let layer = 1; layer <= 7; layer++) {
      expect(
        q.solutionSteps.some((s) => s.includes(`Layer ${layer}`)),
      ).toBe(true);
    }
  });
});

describe('generateOsiQuestion (unchanged — sanity guard)', () => {
  it('still produces the existing assign-item-to-layer question shape', () => {
    const q = generateOsiQuestion();
    expect(q.theme).toBe('TCP/IP-Referenzmodell & Protokolle');
    expect(q.expectedAnswers.layer).toBeGreaterThanOrEqual(1);
    expect(q.expectedAnswers.layer).toBeLessThanOrEqual(7);
    expect(q.answerInputs).toHaveLength(2);
  });
});