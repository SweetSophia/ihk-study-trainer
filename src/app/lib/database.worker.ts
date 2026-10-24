import { gradeDatabaseTask } from './databaseScenario';

self.onmessage = async (event: MessageEvent<{ taskId: number; query: string }>) => {
  try {
    const result = await gradeDatabaseTask(event.data.taskId, event.data.query);
    self.postMessage({ result });
  } catch {
    self.postMessage({ error: 'Die SQL-Prüfung konnte nicht abgeschlossen werden. Ohne Wertung; bitte erneut versuchen.' });
  }
};
