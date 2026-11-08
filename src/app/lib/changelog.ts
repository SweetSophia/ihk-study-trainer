export interface ChangelogEntry {
  date: string;
  summary: string;
  highlight?: boolean;
  tag?: string;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  // New releases use UTC merge dates; older entries retain their originally recorded dates.
  {
    date: '08/11/2026',
    summary: 'Gezielt üben: Themen selbst anhand von Erfolgsquote und gewerteten Versuchen auswählen. Kleine Datenbasis (1–4 Versuche) ist getrennt gekennzeichnet. Die Zahlen nutzen den gesamten gespeicherten Verlauf und erklären die unterschiedlichen Zählweisen von SQL und AP2; Bewertung und gespeicherte Fortschritte bleiben unverändert.',
    highlight: true,
    tag: 'Aktuell',
  },
  {
    date: '06/11/2026',
    summary: 'RAID-Kapazität: theoretische nutzbare Kapazitäten werden exakt mit dezimalen Einheiten geprüft. 1 TB entspricht 1000 GB; gleichwertige Antworten bleiben gültig. Dateisystem- und Formatierungsverluste werden ausdrücklich nicht berechnet. Messwerttoleranzen anderer Aufgaben und gespeicherter Fortschritt bleiben unverändert.',
  },
  {
    date: '04/11/2026',
    summary: 'Kalkulation: Centgenaue Geldprüfung in Vorwärts-, Rückwärts- und Differenzaufgaben. Jede Rechenzeile wird auf Cent gerundet und mit diesem Betrag weitergerechnet; keine 5%-Toleranz für diese Geldantworten. Messwert- und Schätztoleranzen sowie gespeicherter Fortschritt bleiben erhalten.',
  },
  {
    date: '03/11/2026',
    summary: 'Neue Themen-Navigation: fünf aufklappbare Gruppen, eigener AP2-Trainingslauf und mobile Aufgabenauswahl statt Kachelwand. System-, Hell- und Dunkelmodus für alle Lernansichten. Öffnen der Navigation und Farbwechsel erhalten Eingaben; vor dem Verlassen eines Trainingslaufs wird gewarnt. Keine neue Entwurfsspeicherung. Linux: mehr passende Werkzeug-Antworten, eindeutigere Auswahlfragen und erklärendes Feedback mit den hinterlegten Befehlsformen; keine Befehlsausführung.',
  },
  {
    date: '29/10/2026',
    summary: 'AP2 Berechtigungen: effektive Zugriffe aus überlappenden positiven Gruppengewährungen bestimmen und eine begrenzte Korrektur mit passenden Kontrollen planen. Zwei objektive Prüfungen; Least Privilege, Freigabe und Rücknahme bleiben Selbstbewertung. Eigenes fiktives Lehrmodell ohne echte Rechteänderungen.',
  },
  {
    date: '28/10/2026',
    summary: 'AP2 Datensicherung: mögliches Datenverlustfenster und Ausfalldauer mit RPO/RTO vergleichen und vollständige Wiederherstellungsketten aus Voll- und inkrementellen Sicherungen prüfen. Alternative gültige Ketten werden akzeptiert; die Betriebsfreigabe bleibt Selbstbewertung. Eigene fiktive Übung ohne echte Wiederherstellungsbefehle.',
  },
  {
    date: '28/10/2026',
    summary: 'AP2 Wirtschaftlichkeit: fiktive IT-Angebote mit festen Netto-Anfangs- und Monatskosten vergleichen, Gesamtkosten nach 36 Monaten und den ersten strikt günstigeren Monat bestimmen. Zwei objektive Prüfungen und unbewertete Begründung zu Betrieb und Vertragsbedingungen. Lokaler Ersatzspeicher trennt neue Fortschritte pro Account und koordiniert parallele Tabs; alte unzugeordnete Daten bleiben erhalten.',
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
