export type RecoveryResult = { valid: boolean; errors: Record<string, string> };
export const RECOVERY = {
  outageAt: '10:00', restoredAt: '11:10', latestState: '09:40',
  lossMinutes: 20, outageMinutes: 70, rpoMinutes: 30, rtoMinutes: 90,
} as const;
export const BACKUPS = [
  { id: 'F1', kind: 'full', state: '08:00', parent: null },
  { id: 'I1', kind: 'incremental', state: '09:00', parent: 'F1' },
  { id: 'I2', kind: 'incremental', state: '09:40', parent: 'I1' },
  { id: 'I3', kind: 'incremental', state: '09:55', parent: 'X' },
  { id: 'F2', kind: 'full', state: '08:30', parent: null },
  { id: 'I4', kind: 'incremental', state: '09:40', parent: 'F2' },
] as const;
export const TIMELINE_FIELDS = [
  { key: 'lossMinutes', label: 'Mögliches Datenverlustfenster (Minuten)', expected: RECOVERY.lossMinutes },
  { key: 'outageMinutes', label: 'Ausfalldauer (Minuten)', expected: RECOVERY.outageMinutes },
] as const;
export function meetsTarget(actual: number, target: number): boolean { return actual <= target; }
function ownString(answers: Record<string, unknown>, key: string): string {
  return Object.hasOwn(answers, key) && typeof answers[key] === 'string' ? (answers[key] as string).trim() : '';
}
export function validateTimeline(answers: Record<string, unknown>): RecoveryResult {
  const errors: Record<string, string> = {};
  for (const field of TIMELINE_FIELDS) {
    const text = ownString(answers, field.key);
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text))) errors[field.key] = 'Bitte ganze nichtnegative Minuten ohne Einheit, Vorzeichen oder Dezimalstelle eingeben.';
    else if (Number(text) !== field.expected) errors[field.key] = field.key === 'lossMinutes'
      ? 'Berechne den Abstand vom letzten rekonstruierbaren Datenstand bis zum Ausfall, nicht die Zahl tatsächlich verlorener Datensätze.'
      : 'Berechne die verstrichene Zeit vom Ausfall bis zum abgenommenen Wiederanlauf.';
  }
  for (const [key, actual, target] of [['rpo', RECOVERY.lossMinutes, RECOVERY.rpoMinutes], ['rto', RECOVERY.outageMinutes, RECOVERY.rtoMinutes]] as const) {
    const expected = meetsTarget(actual, target) ? 'met' : 'missed';
    if (ownString(answers, key) !== expected) errors[key] = 'Vergleiche die zugehörige Zeitspanne mit dem vorgegebenen Höchstwert; Gleichheit erfüllt das Ziel.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
export function validateRestoreChain(value: unknown): RecoveryResult {
  const fail = (message: string): RecoveryResult => ({ valid: false, errors: { chain: message } });
  if (typeof value !== 'string' || !value.trim()) return fail('Bitte die Sicherungs-IDs in Wiederherstellungsreihenfolge mit Kommas trennen.');
  const ids = value.split(',').map(id => id.trim());
  if (ids.length > BACKUPS.length || new Set(ids).size !== ids.length) return fail('Jede benötigte Sicherung genau einmal angeben, ohne zusätzliche Images.');
  let previous: typeof BACKUPS[number] | undefined;
  for (const id of ids) {
    const backup = BACKUPS.find(item => item.id === id);
    if (!backup) return fail(`Unbekannte oder leere Sicherungs-ID. Verwende die IDs aus dem Katalog unverändert.`);
    if (backup.kind === 'full') {
      if (previous) return fail('Beginne mit genau einer Vollsicherung; füge keine zweite unabhängige Vollsicherung ein.');
    } else {
      if (!BACKUPS.some(item => item.id === backup.parent)) return fail(`${backup.id} benötigt ${backup.parent}; diese Sicherung fehlt und kann hier nicht ersetzt werden.`);
      if (previous?.id !== backup.parent) return fail(`${backup.id} benötigt unmittelbar davor ${backup.parent} und dessen vollständige Kette.`);
    }
    previous = backup;
  }
  if (previous?.state !== RECOVERY.latestState) return fail('Die Kette erreicht noch nicht den neuesten rekonstruierbaren Datenstand 09:40.');
  return { valid: true, errors: {} };
}
