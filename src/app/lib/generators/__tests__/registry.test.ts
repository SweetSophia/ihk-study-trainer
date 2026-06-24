import { describe, it, expect } from 'vitest';
import { GENERATORS, GENERATOR_MODULE_IDS, createQuestionId } from '../registry';
import { BASE_MODULES } from '../../modules';

describe('generators registry', () => {
  it('every non-SQL base module has a registered generator', () => {
    for (const m of BASE_MODULES) {
      expect(GENERATORS[m.id], `missing generator for ${m.id}`).toBeDefined();
    }
  });

  it('SQL module is intentionally absent from the registry (handled separately)', () => {
    expect(GENERATORS['sql']).toBeUndefined();
  });

  it('every generator is a function', () => {
    for (const [id, generator] of Object.entries(GENERATORS)) {
      expect(typeof generator, `${id} should be a function`).toBe('function');
    }
  });

  it('spot-check: sample generators produce a valid Question with the right module id', () => {
    // Sample a small set of representatives; full per-generator shape
    // assertions live next to the generator (see generators/__tests__/).
    const spotCheck = ['subnetting', 'unitConversion', 'binary', 'ports'];
    for (const id of spotCheck) {
      const q = GENERATORS[id]();
      expect(q.module, `${id} should set module to its own id`).toBe(id);
      expect(q.id, `${id} should have a non-empty id`).toBeTruthy();
      expect(q.questionText, `${id} should have a questionText`).toBeTruthy();
      expect(q.expectedAnswers, `${id} should have expectedAnswers`).toBeDefined();
      expect(q.solutionSteps, `${id} should have solutionSteps`).toBeDefined();
    }
  });

  it('GENERATOR_MODULE_IDS matches the keys of GENERATORS', () => {
    expect(new Set(GENERATOR_MODULE_IDS)).toEqual(new Set(Object.keys(GENERATORS)));
  });
});

describe('createQuestionId', () => {
  it('prefixes the module id', () => {
    expect(createQuestionId('subnetting')).toMatch(/^subnetting-/);
    expect(createQuestionId('binary')).toMatch(/^binary-/);
  });

  it('produces a unique id on each call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createQuestionId('subnetting')));
    expect(ids.size).toBe(50);
  });
});
