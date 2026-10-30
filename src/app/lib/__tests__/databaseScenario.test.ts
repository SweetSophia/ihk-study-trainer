import { describe, it, expect } from 'vitest';
import { DATABASE_TASKS, gradeDatabaseTask } from '../databaseScenario';

describe('original database scenario', () => {
  it.each([0, 1, 2])('accepts reference task %i on both fixtures', async index => {
    expect(await gradeDatabaseTask(index, DATABASE_TASKS[index].solution)).toEqual({ correct: true });
  });
  it('accepts a correlated count including zero and reordered output columns', async () => {
    expect(await gradeDatabaseTask(1, 'SELECT (SELECT COUNT(*) FROM wartung w WHERE w.geraet_id=g.id) AS anzahl, g.id AS geraet_id FROM geraet g ORDER BY g.id DESC')).toEqual({ correct: true });
  });
  it('accepts an equivalent numeric aggregate through the strict AP2 caller on both fixtures', async () => {
    expect(await gradeDatabaseTask(1, 'SELECT g.id::numeric AS geraet_id, COUNT(w.id)::numeric AS anzahl FROM geraet g LEFT JOIN wartung w ON w.geraet_id=g.id GROUP BY g.id')).toEqual({ correct: true });
  });
  it('rejects loss of zero counts', async () => {
    expect((await gradeDatabaseTask(1, 'SELECT g.id AS geraet_id, COUNT(w.id) AS anzahl FROM geraet g JOIN wartung w ON w.geraet_id=g.id GROUP BY g.id')).correct).toBe(false);
  });
  it('rejects wrong order', async () => {
    expect((await gradeDatabaseTask(0, DATABASE_TASKS[0].solution.replace('s.name, g.id', 's.name DESC, g.id DESC'))).correct).toBe(false);
  });
  it('rejects collateral updates and wrong operation', async () => {
    expect((await gradeDatabaseTask(2, "UPDATE geraet SET status='ausgemustert'")).correct).toBe(false);
    expect((await gradeDatabaseTask(2, 'SELECT * FROM geraet')).correct).toBe(false);
  });
  it('accepts equivalent update predicate', async () => {
    expect((await gradeDatabaseTask(2, "UPDATE geraet SET status='ausgemustert' WHERE NOT (angeschafft_am >= DATE '2020-01-01') AND status IN ('defekt')")).correct).toBe(true);
  });
}, 60000);
it('rejects a hardcoded answer that only matches the first fixture', async () => {
 expect((await gradeDatabaseTask(1, 'SELECT * FROM (VALUES (1,2::bigint),(2,0::bigint),(3,0::bigint),(4,1::bigint),(5,0::bigint),(6,0::bigint)) AS v(geraet_id,anzahl)')).correct).toBe(false);
}, 60000);
it('rejects counting the outer-join placeholder and the inclusive retirement boundary', async () => {
 expect((await gradeDatabaseTask(1, DATABASE_TASKS[1].solution.replace('COUNT(w.id)', 'COUNT(*)'))).correct).toBe(false);
 expect((await gradeDatabaseTask(2, DATABASE_TASKS[2].solution.replace('< DATE', '<= DATE'))).correct).toBe(false);
}, 60000);
it('rejects writes in a SELECT and multiple statements', async () => {
 expect((await gradeDatabaseTask(0, "WITH gone AS (DELETE FROM wartung RETURNING *) SELECT * FROM gone")).correct).toBe(false);
 expect((await gradeDatabaseTask(2, "UPDATE geraet SET status='ausgemustert'; DELETE FROM wartung")).correct).toBe(false);
}, 60000);
