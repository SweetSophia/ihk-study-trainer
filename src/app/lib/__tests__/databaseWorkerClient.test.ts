import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { checkDatabaseTask } from '../databaseWorkerClient';
class FakeWorker {
  static instance: FakeWorker;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() { FakeWorker.instance = this; }
}
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('Worker', FakeWorker); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it('returns completed grading and terminates', async () => {
  const promise = checkDatabaseTask(0, 'SELECT 1', new AbortController().signal);
  FakeWorker.instance.onmessage?.({ data: { result: { correct: false } } });
  expect(await promise).toEqual({ correct: false });
  expect(FakeWorker.instance.terminate).toHaveBeenCalledTimes(1);
});
it('aborts and terminates without a grading result', async () => {
  const controller = new AbortController();
  const promise = checkDatabaseTask(0, 'SELECT 1', controller.signal);
  const rejected = expect(promise).rejects.toThrow('Abgebrochen');
  controller.abort(); await rejected;
  expect(FakeWorker.instance.terminate).toHaveBeenCalledTimes(1);
});
it('enforces a real worker termination deadline', async () => {
  const promise = checkDatabaseTask(0, 'SELECT 1', new AbortController().signal);
  const rejected = expect(promise).rejects.toThrow('Zeitlimit');
  await vi.advanceTimersByTimeAsync(30000); await rejected;
  expect(FakeWorker.instance.terminate).toHaveBeenCalledTimes(1);
});
it('rejects worker failures without reporting incorrect SQL', async () => {
  const promise = checkDatabaseTask(0, 'SELECT 1', new AbortController().signal);
  FakeWorker.instance.onerror?.();
  await expect(promise).rejects.toThrow('Worker');
  expect(FakeWorker.instance.terminate).toHaveBeenCalledTimes(1);
});
