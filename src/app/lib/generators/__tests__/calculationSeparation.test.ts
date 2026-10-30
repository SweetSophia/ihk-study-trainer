import { afterEach, describe, expect, it, vi } from 'vitest';
import { GENERATORS } from '../registry';
import { BASE_MODULES } from '../../modules';
import { normalizeProgressModules, toCanonicalModuleId, toStoredProgressModuleId } from '../../moduleIds';
import { validateQuestionAnswers } from '../../answerValidation';
import type { Question } from '../../../types';

const generators: Record<string, () => Question> = GENERATORS;
afterEach(() => vi.restoreAllMocks());

describe('three distinct calculation offerings', () => {
  it('retires mixed selection without repurposing forward/backward IDs', () => {
    const entries = BASE_MODULES.filter(m => m.id.startsWith('handelskalkulation'));
    expect(entries.map(m => [m.id, m.name])).toEqual([
      ['handelskalkulationVorwaerts', 'Vorwärtskalkulation'],
      ['handelskalkulationRueckwaerts', 'Rückwärtskalkulation'],
      ['handelskalkulationDifferenz', 'Differenzkalkulation'],
    ]);
    expect(generators.handelskalkulation).toBeUndefined();
  });

  it.each([0, 0.1, 0.3329, 0.333, 0.5, 0.6659, 0.666, 0.9, 0.999999])('keeps all registry modes pure at former mixed boundary seed %s', seed => {
    vi.spyOn(Math, 'random').mockReturnValue(seed);
    for (const [id, mode, count] of [
      ['handelskalkulationVorwaerts', 'Vorwärtskalkulation', 16],
      ['handelskalkulationRueckwaerts', 'Rückwärtskalkulation', 15],
      ['handelskalkulationDifferenz', 'Differenzkalkulation', 32],
    ] as const) {
      expect(generators[id], id).toBeTypeOf('function');
      const q = generators[id]();
      expect(q.module).toBe(id);
      expect(q.id).toMatch(new RegExp(`^${id}-`));
      expect(q.solutionSteps[0]).toBe(mode);
      expect(q.answerInputs).toHaveLength(count);
      const keys = q.answerInputs!.map(i => i.valueKey);
      expect(Object.keys(q.expectedAnswers)).toHaveLength(count);
      if (mode === 'Differenzkalkulation') {
        expect(keys).toContain('forward_lep');
        expect(keys).toContain('backward_lep');
        expect(keys).toContain('differenz');
      } else {
        expect(keys).not.toContain('differenz');
        expect(keys.some(k => k.startsWith('forward_') || k.startsWith('backward_'))).toBe(false);
      }
      const answers = Object.fromEntries(keys.map(k => [k, String(q.expectedAnswers[k])]));
      expect(validateQuestionAnswers(q, answers)).toBe(true);
      expect(validateQuestionAnswers(q, { ...answers, [keys[0]]: '99999999' })).toBe(false);
    }
  });

  it('keeps mixed history distinct from differential and both existing stored aliases', () => {
    const rows = [
      { module: 'handelskalkulation', questions_attempted: 20, questions_correct: 5 },
      { module: 'handelskalkulation-vorwaerts', questions_attempted: 3, questions_correct: 2 },
      { module: 'handelskalkulation-rueckwaerts', questions_attempted: 4, questions_correct: 3 },
      { module: 'handelskalkulationDifferenz', questions_attempted: 1, questions_correct: 1 },
    ];
    const snapshot = structuredClone(rows);
    expect(normalizeProgressModules(rows)).toEqual(rows.map(r => ({ ...r, module: toCanonicalModuleId(r.module) })));
    expect(rows).toEqual(snapshot);
    expect(toStoredProgressModuleId('handelskalkulationVorwaerts')).toBe('handelskalkulation-vorwaerts');
    expect(toStoredProgressModuleId('handelskalkulationRueckwaerts')).toBe('handelskalkulation-rueckwaerts');
    expect(toStoredProgressModuleId('handelskalkulationDifferenz')).toBe('handelskalkulationDifferenz');
    expect(toStoredProgressModuleId('handelskalkulation')).toBe('handelskalkulation');
  });
});
