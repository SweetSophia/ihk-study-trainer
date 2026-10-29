export type Access = 'none' | 'read' | 'edit';
export type Validation = { valid: boolean; errors: Record<string, string> };
export const ACCESS_CHOICES = [
  { value: 'none', label: 'Kein Zugriff' }, { value: 'read', label: 'Lesen' }, { value: 'edit', label: 'Bearbeiten (einschließlich Lesen)' },
] as const;
export const FOLDERS = [{ id: 'orders', label: 'Aufträge' }, { id: 'personnel', label: 'Personalakten' }] as const;
export const GROUPS = [
  { id: 'workshop', label: 'Werkstatt', rights: { orders: 'read', personnel: 'none' } },
  { id: 'dispatch', label: 'Disposition', rights: { orders: 'edit', personnel: 'none' } },
  { id: 'personnel', label: 'Personal', rights: { orders: 'none', personnel: 'edit' } },
] as const;
type GroupId = typeof GROUPS[number]['id'];
type FolderId = typeof FOLDERS[number]['id'];
export const PEOPLE = [
  { id: 'lea', label: 'Lea', groups: ['workshop', 'dispatch'] },
  { id: 'tom', label: 'Tom', groups: ['workshop', 'personnel'] },
  { id: 'mira', label: 'Mira', groups: ['personnel'] },
] as const;
export const CORRECTION_CHOICES = [
  { value: 'remove-personnel', label: 'Tom aus Personal entfernen; Werkstatt-Mitgliedschaft beibehalten.' },
  { value: 'remove-workshop', label: 'Tom nur aus Werkstatt entfernen; Personal-Mitgliedschaft beibehalten.' },
  { value: 'remove-both', label: 'Tom aus beiden Gruppen entfernen.' },
  { value: 'change-grants', label: 'Der Gruppe Personal den Zugriff auf Personalakten entziehen.' },
  { value: 'add-dispatch', label: 'Tom zusätzlich Disposition zuordnen; bisherige Mitgliedschaften beibehalten.' },
] as const;
export const VERIFICATION_CHOICES = [
  { value: 'all-users-both-folders', label: 'Mit Testdateien als jede der drei normalen Personen beide Ordner prüfen: erlaubte und verweigerte Operationen einschließlich Lesen/Bearbeiten; Ergebnisse mit allen Sollrechten vergleichen und dokumentieren.' },
  { value: 'only-read', label: 'Nur prüfen, ob Tom Aufträge lesen kann.' },
  { value: 'admin', label: 'Beide Ordner nur mit einem Administratorkonto öffnen.' },
  { value: 'assume', label: 'Die geänderte Gruppenzuordnung ohne Funktionstest als Erfolg dokumentieren.' },
] as const;

/** Only the supplied positive-grant model, not an operating-system ACL evaluator. */
export function effectiveAccess(groups: readonly GroupId[], folder: FolderId): Access {
  let result: Access = 'none';
  for (const id of groups) {
    const access = GROUPS.find(group => group.id === id)?.rights[folder] ?? 'none';
    if (access === 'edit') return 'edit';
    if (access === 'read') result = 'read';
  }
  return result;
}
function ownChoice(answers: unknown, key: string): unknown {
  return answers !== null && typeof answers === 'object' && !Array.isArray(answers) && Object.hasOwn(answers, key)
    ? (answers as Record<string, unknown>)[key] : undefined;
}
export function validateEffectiveAccess(answers: unknown): Validation {
  const errors: Record<string, string> = {};
  for (const person of PEOPLE) for (const folder of FOLDERS) {
    const key = `${person.id}.${folder.id}`;
    const answer = ownChoice(answers, key);
    if (!ACCESS_CHOICES.some(choice => choice.value === answer)) errors[key] = 'Wähle einen der drei angegebenen Zugriffsstände.';
    else if (answer !== effectiveAccess(person.groups, folder.id)) errors[key] = 'Kombiniere die aktuellen positiven Gruppenzuweisungen für diesen Ordner. Bearbeiten enthält Lesen; ohne Gewährung besteht kein Zugriff.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
export function validateCorrection(answers: unknown): Validation {
  const errors: Record<string, string> = {};
  if (ownChoice(answers, 'plan') !== 'remove-personnel') errors.plan = 'Wähle eine einzelne Änderung an Toms Mitgliedschaften, die Lesen von Aufträgen erhält und Zugriff auf Personalakten entfernt. Gruppenrechte, Lea und Mira bleiben unverändert.';
  if (ownChoice(answers, 'verification') !== 'all-users-both-folders') errors.verification = 'Plane positive und negative Tests als normale Personen für beide Ordner, einschließlich unveränderter Rechte von Lea und Mira. Ein einzelner Lesetest, Adminzugriff oder eine Konfigurationsänderung beweist das nicht.';
  return { valid: Object.keys(errors).length === 0, errors };
}
