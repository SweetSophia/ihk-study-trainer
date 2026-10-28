export interface ChangelogEntry {
  date: string;
  summary: string;
  highlight?: boolean;
  tag?: string;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  // New AP2 releases use UTC merge dates; older entries retain their originally recorded dates.
  // Pending feature entry: confirm its UTC release date before merging (the PR may remain open across days).
  {
    date: '28/10/2026',
    summary: 'AP2 Wirtschaftlichkeit: fiktive IT-Angebote mit festen Netto-Anfangs- und Monatskosten vergleichen, Gesamtkosten nach 36 Monaten und den ersten strikt günstigeren Monat bestimmen. Zwei objektive Prüfungen und unbewertete Begründung zu Betrieb und Vertragsbedingungen.',
    highlight: true,
    tag: 'Aktuell',
  },
  {
    date: '26/10/2026',
    summary: 'AP2 Projektplanung, Algorithmen und DNS-Fehlersuche: Abhängigkeiten und Puffer berechnen, Pseudocode nachvollziehen und Diagnose-Evidenz bewerten. Verbesserte Validierung und zugängliche Rückmeldungen.',
  },
  {
    date: '24/10/2026',
    summary: 'AP2 Datenbankentwurf & SQL: Geräteverwaltung modellieren und drei SQL-Aufgaben mit zwei Testdatensätzen im Browser prüfen – auch als Gast. Abbruch, klare Fehlermeldungen und Schutz vor veralteten Fortschrittsantworten.',
  },
  {
    date: '23/10/2026',
    summary: 'AP2 Netzwerkplanung: Teilnetze und VLANs für Büro, Werkstatt und Gäste planen; alternative gültige Aufteilungen werden akzeptiert. Verkehrsregeln anhand einer Selbstbewertung begründen.',
  },
  {
    date: '20/10/2026',
    summary: 'Präzisere Antwortprüfung für Netzwerkangaben und diskrete Zahlen, korrekt ausgerichtete Aggregationsnetze sowie SQL-Prüfungen mit getrennten Testdatenbanken. PGlite-WebAssembly unter der Produktions-CSP und Behandlung von Rate-Limit-Zeitüberschreitungen korrigiert.',
  },
  {
    date: '29/06/2026',
    summary: 'RAID-Rechner mit Laufwerksdarstellung, Subnetting-Visualisierung nach der Antwort und OSI-Sortierübung mit Tastaturbedienung.',
  },
  {
    date: '28/06/2026',
    summary: 'Confetti, UX, Upstash, Security, Subnetting',
  },
  { 
    date: '08/04/2026',
    summary: 'Hexa / Binaer Aufgaben, Code fixes', 
  },
  {
    date: '02/04/2026',
    summary: 'Module-IDs, Kabel-EMI, Einheiten-Fix',
  },
  { date: '01/04/2026', summary: 'Cloud, Kalkulation, Linux, SQL' },
  { date: '30/03/2026', summary: 'Auth, Dropdowns, Ports, OSI' },
];
