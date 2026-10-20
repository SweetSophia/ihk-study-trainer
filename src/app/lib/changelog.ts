export interface ChangelogEntry {
  date: string;
  summary: string;
  highlight?: boolean;
  tag?: string;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '20/10/2026',
    summary: 'Antwortprüfung: IPv4-Adressen und ganzzahlige Ergebnisse werden genauer geprüft. Aufgaben zur Netzaggregation verwenden passend ausgerichtete Teilnetze.',
    highlight: true,
    tag: 'Aktuell',
  },
  {
    date: '20/10/2026',
    summary: 'SQL-Trainer: Start im Browser repariert, Übungsdaten vollständig geladen und Lösungen auf getrennten Ausgangsdaten geprüft. Sortierung und Datenänderungen werden je nach Aufgabe berücksichtigt.',
  },
  {
    date: '20/10/2026',
    summary: 'KI-Anfragen: Bei einer Zeitüberschreitung der Anfragelimit-Prüfung wird die Anfrage vorsorglich abgewiesen.',
  },
  {
    date: '28/06/2026',
    summary: 'Confetti, UX, Upstash, Security, Subnetting',
  },
  { 
    date: '08/04/2026',
    summary: 'Hexa / Binaer Aufgaben, Code fixes', 
    tag: 'Neu',
  },
  {
    date: '02/04/2026',
    summary: 'Module-IDs, Kabel-EMI, Einheiten-Fix',
  },
  { date: '01/04/2026', summary: 'Cloud, Kalkulation, Linux, SQL' },
  { date: '30/03/2026', summary: 'Auth, Dropdowns, Ports, OSI' },
];
