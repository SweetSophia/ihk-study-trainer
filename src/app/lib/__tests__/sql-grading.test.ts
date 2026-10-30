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
  it('accepts equivalent named columns selected in a different order', async () => {
    expect(await gradeSqlAnswer(exercise('SELECT id, name FROM items'), 'SELECT name, id FROM items')).toMatchObject({ correct: true });
  });
  it.each(['int2', 'float8', 'int8'])('accepts equivalent numeric values cast to %s', async type => {
    expect(await gradeSqlAnswer(exercise('SELECT id AS n FROM items'), `SELECT id::${type} AS n FROM items`)).toMatchObject({ correct: true });
  });
  it.each([false, true])('accepts exact numeric equivalents for legacy/AP2 strict=%s', async strict => {
    const input = { setup_sql: '', grading: select, solution_query: `SELECT
      1::integer AS one, 1.10::numeric AS decimal_value, 0.001::numeric AS tiny,
      0::integer AS zero, 9007199254740993::bigint AS large,
      'NaN'::numeric AS nan, 'Infinity'::numeric AS inf, '-Infinity'::numeric AS neg_inf` };
    const query = `SELECT
      1.00::numeric AS one, 1.1::float8 AS decimal_value, 1e-3::float8 AS tiny,
      '-0.0'::numeric AS zero, 9007199254740993::numeric AS large,
      'NaN'::float8 AS nan, 'Infinity'::float8 AS inf, '-Infinity'::float8 AS neg_inf`;
    expect(await gradeSqlAnswer(input, query, { rejectInfrastructureErrors: strict })).toMatchObject({ correct: true });
  });
  it.each([
    ['9007199254740992::bigint', '9007199254740993::numeric'],
    ['0.1000000000000000000001::numeric', '0.1000000000000000000002::numeric'],
    ['1::integer', "'1'::text"],
    ['1::integer', "'[\"numeric\",\"1\",\"0\"]'::jsonb"],
    ['0::integer', 'NULL::numeric'],
  ])('keeps distinct numeric or nonnumeric results apart: %s versus %s', async (reference, answer) => {
    expect(await gradeSqlAnswer({ setup_sql: '', grading: select, solution_query: `SELECT ${reference} AS n` }, `SELECT ${answer} AS n`)).toMatchObject({ correct: false });
  });
  it.each(['NaN', 'Infinity', '-Infinity'])('distinguishes numeric %s from NULL', async value => {
    expect(await gradeSqlAnswer(exercise('SELECT NULL::float8 AS n'), `SELECT '${value}'::float8 AS n`)).toMatchObject({ correct: false });
  });
  it('preserves distinct nonfinite values and distinguishes text/JSON lookalikes', async () => {
    const reference = exercise("SELECT 'NaN'::float8 AS n");
    expect(await gradeSqlAnswer(reference, "SELECT 'Infinity'::float8 AS n")).toMatchObject({ correct: false });
    expect(await gradeSqlAnswer(reference, "SELECT 'NaN'::float8 AS n")).toMatchObject({ correct: true });
    expect(await gradeSqlAnswer(reference, "SELECT 'NaN'::text AS n")).toMatchObject({ correct: false });
    expect(await gradeSqlAnswer(reference, `SELECT ' ["number", "NaN"] '::jsonb AS n`)).toMatchObject({ correct: false });
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
  it.each([
    ["UPDATE prices SET amount=1.5 WHERE id=1", "UPDATE prices SET amount=1.5 WHERE id=1", true],
    ["UPDATE prices SET amount=2.0 WHERE id=1", "UPDATE prices SET amount=2.00 WHERE id=1", false],
    ["UPDATE prices SET amount=2.0 WHERE id=1", "UPDATE prices SET amount=CASE WHEN id=1 THEN 2.0 ELSE 1.5 END", false],
  ] as const)('preserves legacy mutation storage representation: %s / %s', async (reference, answer, correct) => {
    const input = { setup_sql: 'CREATE TABLE prices(id integer PRIMARY KEY, amount numeric); INSERT INTO prices VALUES(1,1.50),(2,1.50);', grading: mutation, solution_query: reference };
    expect(await gradeSqlAnswer(input, answer)).toMatchObject({ correct });
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
