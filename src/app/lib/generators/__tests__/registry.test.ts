import { describe, it, expect } from 'vitest';
import { GENERATORS, GENERATOR_MODULE_IDS, createQuestionId } from '../registry';
import { BASE_MODULES } from '../../modules';

describe('generators registry', () => {
  it('every drill module has a registered generator', () => {
    // Coverage is also enforced at compile time by
    // `Record<RegistryModuleId, () => Question>`; this runtime check
    // catches any future widening of that type.
    for (const m of BASE_MODULES) {
      if (m.id === 'ap2AccessControl' || m.id === 'ap2TrainingRun' || m.id === 'ap2NetworkPlanning' || m.id === 'ap2DatabaseDesign' || m.id === 'ap2ProjectPlanning' || m.id === 'ap2AlgorithmTracing' || m.id === 'ap2Troubleshooting' || m.id === 'ap2CostComparison' || m.id === 'ap2BackupRecovery') continue;
      expect(GENERATORS[m.id], `missing generator for ${m.id}`).toBeDefined();
    }
  });

  it('SQL module is intentionally absent from the registry (handled separately)', () => {
    // The `Record<RegistryModuleId, …>` type provably excludes 'sql' from
    // the key space, so `GENERATORS['sql']` won't compile. The cast is
    // for the runtime sanity check only — guards against future widening.
    expect((GENERATORS as Record<string, unknown>)['sql']).toBeUndefined();
  });

  it('AP2 network planning uses its dedicated constraint-based trainer', () => {
    expect((GENERATORS as Record<string, unknown>)['ap2NetworkPlanning']).toBeUndefined();
  });

  it('AP2 database design uses a dedicated trainer', () => {
    expect((GENERATORS as Record<string, unknown>)['ap2DatabaseDesign']).toBeUndefined();
  });

  it('every generator is a function', () => {
    for (const [id, generator] of Object.entries(GENERATORS)) {
      expect(typeof generator, `${id} should be a function`).toBe('function');
    }
  });

  it('every registered generator produces a valid Question with the right module id', () => {
    // Per-module test files in `generators/__tests__/` cover generator-
    // specific shape (e.g. the cloud scenario field, the cables reasonCount
    // builder). This loop is the safety net for the registry: it ensures
    // every wrapper carries id + module + questionText + expectedAnswers
    // + solutionSteps, and that the module field matches the key.
    for (const id of GENERATOR_MODULE_IDS) {
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
