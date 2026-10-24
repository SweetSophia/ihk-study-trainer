import { expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { gradeDatabaseTask } from '../databaseScenario';
it('rejects engine traps without grading the learner incorrect', async () => {
 const original = PGlite.prototype.transaction;
 let calls = 0;
 const spy = vi.spyOn(PGlite.prototype, 'transaction').mockImplementation(function (this: PGlite, ...args: Parameters<typeof original>) {
   if (++calls === 2) return Promise.reject(new WebAssembly.RuntimeError('memory access out of bounds'));
   return original.apply(this, args);
 });
 try { await expect(gradeDatabaseTask(0, 'SELECT 1')).rejects.toThrow('memory access out of bounds'); }
 finally { spy.mockRestore(); }
}, 60000);
it('keeps ordinary PostgreSQL syntax errors as completed incorrect checks', async () => {
 expect(await gradeDatabaseTask(0, 'SELEC broken')).toMatchObject({ correct: false });
}, 60000);
