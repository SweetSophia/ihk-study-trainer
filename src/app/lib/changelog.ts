export interface ChangelogEntry {
  date: string;
  summary: string;
  highlight?: boolean;
  tag?: string;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '02/04/2026',
    summary: 'Module-IDs, Kabel-EMI, Einheiten-Fix',
    highlight: true,
    tag: 'Neu',
  },
  { date: '01/04/2026', summary: 'Cloud, Kalkulation, Linux, SQL' },
  { date: '30/03/2026', summary: 'Auth, Dropdowns, Ports, OSI' },
];
