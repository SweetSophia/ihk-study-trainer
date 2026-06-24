import { describe, it, expect } from 'vitest';
import {
  BASE_MODULES,
  SQL_MODULE,
  ALL_MODULES,
  MODULE_NAMES,
  MODULE_DESCRIPTIONS,
  MODULE_ICONS,
} from '../modules';

describe('modules registry', () => {
  it('contains all 19 base modules', () => {
    // 19 = the 17 existing modules + the 2 handelskalkulation sub-modes
    // (Vorwärts / Rückwärts) introduced when the combined kalkulation module
    // was split. Bump this number when adding a new entry.
    expect(BASE_MODULES).toHaveLength(19);
  });

  it('contains unique module ids', () => {
    const ids = BASE_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every module has a non-empty name, icon, and description', () => {
    for (const m of ALL_MODULES) {
      expect(m.name).toBeTruthy();
      expect(m.icon).toBeDefined();
      expect(m.description).toBeTruthy();
    }
  });

  it('SQL is the only auth-gated module and has a unique id', () => {
    expect(SQL_MODULE.id).toBe('sql');
    // The 'sql' literal is provably absent from BASE_MODULES' id union
    // (`(typeof BASE_MODULES)[number]['id']` excludes it). The cast is a
    // defense-in-depth runtime check in case a future refactor widens
    // the type without re-checking the auth-gating invariant.
    expect(BASE_MODULES.some((m) => (m.id as string) === 'sql')).toBe(false);
  });

  it('ALL_MODULES is BASE_MODULES plus SQL_MODULE', () => {
    expect(ALL_MODULES).toHaveLength(BASE_MODULES.length + 1);
    expect(ALL_MODULES).toContain(SQL_MODULE);
  });

  it('MODULE_NAMES is a correct lookup for every module', () => {
    for (const m of ALL_MODULES) {
      expect(MODULE_NAMES[m.id]).toBe(m.name);
    }
  });

  it('MODULE_DESCRIPTIONS is a correct lookup for every module', () => {
    for (const m of ALL_MODULES) {
      expect(MODULE_DESCRIPTIONS[m.id]).toBe(m.description);
    }
  });

  it('MODULE_ICONS is a correct lookup for every module', () => {
    for (const m of ALL_MODULES) {
      expect(MODULE_ICONS[m.id]).toBe(m.icon);
    }
  });
});
