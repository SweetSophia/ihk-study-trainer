export type DatabaseCheckResult = { correct: boolean; message?: string };

/** One disposable worker per check: abort/deadline stop WASM, not just its promise. */
export function checkDatabaseTask(taskId: number, query: string, signal: AbortSignal): Promise<DatabaseCheckResult> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('Abgebrochen.')); return; }
    const worker = new Worker(new URL('./database.worker.ts', import.meta.url), { type: 'module' });
    let settled = false;
    const finish = (result?: DatabaseCheckResult, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.terminate();
      if (error) reject(error); else resolve(result!);
    };
    const abort = () => finish(undefined, new Error('Abgebrochen.'));
    const timer = setTimeout(() => finish(undefined, new Error('Zeitlimit erreicht. Ohne Wertung; bitte Query vereinfachen und erneut prüfen.')), 30000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ result?: DatabaseCheckResult; error?: string }>) => {
      if (event.data.error) finish(undefined, new Error(event.data.error));
      else if (typeof event.data.result?.correct === 'boolean') finish(event.data.result);
      else finish(undefined, new Error('Ungültige Worker-Antwort.'));
    };
    worker.onerror = () => finish(undefined, new Error('SQL-Worker konnte nicht ausgeführt werden. Ohne Wertung.'));
    worker.onmessageerror = () => finish(undefined, new Error('SQL-Worker-Antwort konnte nicht gelesen werden. Ohne Wertung.'));
    try { worker.postMessage({ taskId, query }); } catch { finish(undefined, new Error('SQL-Worker konnte nicht gestartet werden. Ohne Wertung.')); }
  });
}
