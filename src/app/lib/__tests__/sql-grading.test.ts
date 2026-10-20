// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { gradeSqlAnswer } from '../sql-grading';

const setup_sql = `CREATE TABLE items(id integer PRIMARY KEY, name text, quantity integer);
INSERT INTO items VALUES (1, 'router west', 10), (2, 'switch', 20);`;
const select = { kind: 'select', ordered: false } as const;
const mutation = { kind: 'mutation', operation: 'Update' } as const;
const exercise = (solution_query: string, grading = select) => ({ setup_sql, solution_query, grading });

describe('real PostgreSQL grading', () => {
  it('closes each database after successful grading and invalid fixtures', async () => {
    const close = vi.spyOn(PGlite.prototype, 'close');
    const expectClosed = () => {
      expect(close).toHaveBeenCalled();
      expect(close.mock.contexts.every(db => db instanceof PGlite && db.closed)).toBe(true);
      close.mockClear();
    };
    try {
      expect(await gradeSqlAnswer(exercise('SELECT id FROM items'), 'SELECT id FROM items')).toMatchObject({ correct: true });
      expectClosed();
      await expect(gradeSqlAnswer({ ...exercise('SELECT 1'), setup_sql: 'invalid fixture' }, 'SELECT 1')).rejects.toThrow();
      expectClosed();
      await expect(gradeSqlAnswer(exercise('SELECT missing FROM items'), 'SELECT 1')).rejects.toThrow(/Musterlösung/);
      expectClosed();
      expect(await gradeSqlAnswer(exercise('SELECT id FROM items'), 'invalid query')).toMatchObject({ correct: false });
      expectClosed();
    } finally { close.mockRestore(); }
  });
  it('runs complete fixtures containing quoted semicolons', async () => {
    expect(await gradeSqlAnswer({ ...exercise('SELECT name FROM items'), setup_sql: setup_sql.replace('router west', 'router; west') }, 'SELECT name FROM items')).toMatchObject({ correct: true });
  });
  it('compares unordered rows as a multiset', async () => {
    expect(await gradeSqlAnswer(exercise('SELECT id FROM items ORDER BY id'), 'SELECT id FROM items ORDER BY id DESC')).toMatchObject({ correct: true });
  });
  it('preserves required result order', async () => {
    expect(await gradeSqlAnswer({ ...exercise('SELECT id FROM items ORDER BY id'), grading: { kind: 'select', ordered: true } }, 'SELECT id FROM items ORDER BY id DESC')).toMatchObject({ correct: false });
  });
  it('preserves duplicate counts and compares column metadata', async () => {
    expect(await gradeSqlAnswer(exercise('SELECT 1 AS n UNION ALL SELECT 1'), 'SELECT 1 AS n')).toMatchObject({ correct: false });
    expect(await gradeSqlAnswer(exercise('SELECT 1 AS n'), 'SELECT 1 AS other')).toMatchObject({ correct: false });
  });
  it('checks empty result column schemas and accepts matching empty results', async () => {
    expect(await gradeSqlAnswer(exercise('SELECT id FROM items WHERE false'), 'SELECT name FROM items WHERE false')).toMatchObject({ correct: false });
    expect(await gradeSqlAnswer(exercise('SELECT id FROM items WHERE false'), 'SELECT id FROM items WHERE false')).toMatchObject({ correct: true });
  });
  it('does not award points for DML on a SELECT exercise', async () => {
    expect(await gradeSqlAnswer(exercise('SELECT id FROM items'), 'DELETE FROM items')).toMatchObject({ correct: false });
  });
  it('rejects writes hidden in a SELECT CTE', async () => {
    expect(await gradeSqlAnswer(exercise('SELECT id FROM items'), 'WITH changed AS (DELETE FROM items RETURNING id) SELECT id FROM changed')).toMatchObject({ correct: false });
  });
  it('runs mutations from identical initial state, including non-idempotent updates', async () => {
    expect(await gradeSqlAnswer({ setup_sql, grading: mutation, solution_query: 'UPDATE items SET quantity = quantity + 1' }, 'UPDATE items SET quantity = quantity + 1')).toMatchObject({ correct: true });
  });
  it('rejects different mutations even when both return empty rows', async () => {
    expect(await gradeSqlAnswer({ setup_sql, grading: mutation, solution_query: 'UPDATE items SET quantity = 11 WHERE id = 1' }, 'UPDATE items SET quantity = 21 WHERE id = 2')).toMatchObject({ correct: false });
  });
  it('compares all fixture tables, including collateral writes', async () => {
    expect(await gradeSqlAnswer({ setup_sql: setup_sql + ' CREATE TABLE other(id integer); INSERT INTO other VALUES (1);', grading: mutation, solution_query: 'UPDATE items SET quantity = 0' }, 'WITH removed AS (DELETE FROM other) UPDATE items SET quantity = 0')).toMatchObject({ correct: false });
  });
  it('supports INSERT and DELETE independently', async () => {
    for (const [operation, sql] of [['Insert', "INSERT INTO items VALUES (3, 'new', 0)"], ['Delete', 'DELETE FROM items WHERE id = 1']] as const) {
      expect(await gradeSqlAnswer({ setup_sql, grading: { kind: 'mutation', operation }, solution_query: sql }, sql)).toMatchObject({ correct: true });
    }
  });
  it('rejects unsupported statements and no-op reference mutations', async () => {
    const input = { setup_sql, grading: mutation, solution_query: 'UPDATE items SET quantity = 0' };
    expect(await gradeSqlAnswer(input, 'DROP TABLE items')).toMatchObject({ correct: false });
    expect(await gradeSqlAnswer(input, 'UPDATE items SET quantity = 0; DELETE FROM items')).toMatchObject({ correct: false });
    await expect(gradeSqlAnswer({ ...input, solution_query: 'UPDATE items SET quantity = quantity' }, 'SELECT 1')).rejects.toThrow(/Musterlösung.*ändert/);
  });
}, 30000);
