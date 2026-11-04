export interface CableQuestion {
  theme: string;
  questionText: string;
  scenario: { distance: number; speed: number; environment: string };
  expectedAnswers: Record<string, string>;
  /** Scenario properties of the example recommendation. */
  correctPros: string[];
  cableChoices: { type: string; pros: string[] }[];
  eligibleCableTypes: string[];
  /** Same explicit number of distinct properties for every valid alternative. */
  reasonCount: number;
  solutionSteps: string[];
}

export interface CableType {
  type: string;
  /** Supported rate/reach combinations for the supplied teaching installation. */
  links: { speed: number; distance: number }[];
  emiSafe: boolean;
  pros: string[];
  cons: string[];
}

export const CABLE_TYPES: CableType[] = [
  {
    type: 'Cat 5e (Twisted Pair)',
    links: [{ speed: 1000, distance: 100 }],
    emiSafe: false,
    pros: ['Keine LWL-Optik erforderlich'],
    cons: ['Max. 100m', 'Störanfällig bei EMI']
  },
  {
    type: 'Cat 6 (Twisted Pair)',
    links: [{ speed: 1000, distance: 100 }, { speed: 10000, distance: 55 }],
    emiSafe: true,
    pros: ['Geschirmte Variante im Katalog', 'Keine LWL-Optik erforderlich'],
    cons: ['Teurer als Cat 5e', '10 Gbit/s im hier geprüften Profil nur bis 55 m']
  },
  {
    type: 'Cat 6a (Twisted Pair)',
    links: [{ speed: 1000, distance: 100 }, { speed: 10000, distance: 100 }],
    emiSafe: true,
    pros: ['Geschirmte Variante im Katalog', 'Keine LWL-Optik erforderlich'],
    cons: ['Teuer', 'Dickeres Kabel']
  },
  {
    type: 'Cat 7 (Twisted Pair)',
    links: [{ speed: 1000, distance: 100 }, { speed: 10000, distance: 100 }],
    emiSafe: true,
    pros: ['Geschirmte Variante im Katalog', 'Geschirmte Adernpaare (S/FTP)', 'Keine LWL-Optik erforderlich'],
    cons: ['Sehr teuer', 'Aufwendige Verlegung']
  },
  {
    type: 'Multimode Glasfaser (OM3/OM4)',
    links: [{ speed: 1000, distance: 550 }, { speed: 10000, distance: 300 }],
    emiSafe: true,
    pros: ['Immun gegen EMI', 'Nichtleitende Übertragungsstrecke'],
    cons: ['Teuer', 'Spezielle Werkzeuge nötig']
  },
  {
    type: 'Singlemode Glasfaser (OS2)',
    links: [{ speed: 1000, distance: 10000 }, { speed: 10000, distance: 10000 }],
    emiSafe: true,
    pros: ['Immun gegen EMI', 'Nichtleitende Übertragungsstrecke'],
    cons: ['Sehr teuer', 'Laser-Lichtquelle nötig', 'Aufwendige Installation']
  },
  {
    type: 'Koaxialkabel (RG-6)',
    links: [],
    emiSafe: false,
    pros: ['Gute Reichweite', 'Wetterfest (Outdoor)', 'Kostengünstig für TV'],
    cons: ['Geringe Bandbreite vs. Glasfaser', 'Veraltet für LAN']
  }
];

function profileAdvantage(link: { speed: number; distance: number }): string {
  const reach = link.distance >= 1000 ? `${link.distance / 1000} km` : `${link.distance} m`;
  return `${link.speed / 1000} Gbit/s bis ${reach} im angegebenen Profil`;
}

function matchingProfile(cable: CableType, distance: number, speed: number) {
  return cable.links.find(link => link.speed === speed && link.distance >= distance);
}

function propertiesForScenario(cable: CableType, distance: number, speed: number): string[] {
  const link = matchingProfile(cable, distance, speed);
  return link ? [profileAdvantage(link), ...cable.pros] : cable.pros;
}

/** All advantage strings including distractors across the cable catalogue (pre-computed). */
export const ALL_CABLE_PROS: string[] = [
  ...new Set(CABLE_TYPES.flatMap(c => [...c.pros, ...c.links.map(profileAdvantage)])),
];

export const CABLE_SCENARIOS = [
  { distance: 30, speed: 1000, environment: 'Bürogebäude (Indoor)' },
  { distance: 80, speed: 1000, environment: 'Bürogebäude (Indoor)' },
  { distance: 95, speed: 1000, environment: 'Lagerhalle mit Störquellen' },
  { distance: 40, speed: 10000, environment: 'Rechenzentrum' },
  { distance: 90, speed: 10000, environment: 'Rechenzentrum' },
  { distance: 200, speed: 10000, environment: 'Campus (Gebäude zu Gebäude)' },
  { distance: 500, speed: 1000, environment: 'Industriehalle (starke EMI)' },
  { distance: 2000, speed: 10000, environment: 'Campus (Outdoor-Verbindung)' }
];

export function generateCableQuestion(): CableQuestion {
  const scenario = CABLE_SCENARIOS[Math.floor(Math.random() * CABLE_SCENARIOS.length)];

  const suitable = findSuitableCables(scenario.distance, scenario.speed, scenario.environment);
  // Recommendation is an example, not the only accepted medium.
  const bestCable = findBestCable(scenario.distance, scenario.speed, scenario.environment);

  // One explicit, equal requirement for every offered valid alternative.
  const reasonCount = 2;
  const cableChoices = CABLE_TYPES.map(c => ({ type: c.type, pros: propertiesForScenario(c, scenario.distance, scenario.speed) }));
  const examplePros = propertiesForScenario(bestCable, scenario.distance, scenario.speed);
  const expectedAnswers: Record<string, string> = { cableType: bestCable.type };
  for (let i = 0; i < reasonCount; i++) {
    expectedAnswers[`reason${i + 1}`] = examplePros[i];
  }

  return {
    theme: 'Netzwerkarchitektur & Overhead',
    questionText: `Wähle ein geeignetes Kabelmedium und nenne ${reasonCount} unterschiedliche Eigenschaften dieses Mediums für die geforderte Datenrate und Entfernung. Reichweitenangaben müssen zur geforderten Datenrate gehören und die Entfernung abdecken. Mehrere Antworten können gültig sein.
${CABLE_ASSUMPTIONS}
${generateCableComparison().join("\n")}
Szenario:\nEntfernung: ${scenario.distance}m\nGeschwindigkeit: ${scenario.speed >= 1000 ? scenario.speed / 1000 + ' Gbit/s' : scenario.speed + ' Mbit/s'}\nUmgebung: ${scenario.environment}`,
    scenario: scenario,
    expectedAnswers,
    correctPros: examplePros,
    cableChoices,
    eligibleCableTypes: suitable.map(c => c.type),
    reasonCount,
    solutionSteps: [
      `Szenario:`,
      `  Entfernung: ${scenario.distance}m`,
      `  Geschwindigkeit: ${scenario.speed >= 1000 ? scenario.speed / 1000 + ' Gbit/s' : scenario.speed + ' Mbit/s'}`,
      `  Umgebung: ${scenario.environment}`,
      ``,
      `Anforderungen:`,
      `  • Datenrate im angegebenen Profil: ${scenario.speed >= 1000 ? scenario.speed / 1000 + ' Gbit/s' : scenario.speed + ' Mbit/s'}`,
      `  • Mindestens ${scenario.distance}m Reichweite`,
      `  • Geeignet für: ${scenario.environment}`,
      ``,
      `Kabeltypen-Vergleich:`,
      ...generateCableComparison(),
      ``,
      `Eine mögliche Empfehlung: ${bestCable.type}`,
      ``,
      `Passende Eigenschaften im Szenario:`,
      ...examplePros.map(pro => `  ✓ ${pro}`),
      ...bestCable.cons.map(con => `  ⚠ ${con}`),
      ``,
      `Ergebnis:`,
      `  Geeignete Kabeltypen: ${suitable.map(c => c.type).join("; ")}`
    ]
  };
}

export const CABLE_ASSUMPTIONS = 'Lernmodell: direkte Ethernet-Verbindung ohne Medienkonverter; kein PoE- oder Preisziel. Passende Anschlüsse, LWL-Optiken und fachgerechte Innen-/Außenverlegung sind vorhanden. Cat 5e ist ungeschirmt, Cat 6/6a/7 sind hier geschirmte Varianten. Cat 6 ist für 10 Gbit/s bis 55 m installationsgeprüft (einschließlich Alien Crosstalk); das ist keine allgemeine Garantie für jede Cat-6-Verkabelung. Die angegebenen Reichweiten gelten nur für die aufgeführten Profile.';

export function findSuitableCables(distance: number, speed: number, environment: string, cableTypes = CABLE_TYPES): CableType[] {
  if (!Number.isFinite(distance) || distance <= 0 || !Number.isFinite(speed) || speed <= 0) return [];
  const emi = /Störquellen|EMI/i.test(environment);
  return cableTypes.filter(c => (!emi || c.emiSafe) &&
    matchingProfile(c, distance, speed) !== undefined);
}

export function findBestCable(distance: number, speed: number, environment: string, cableTypes = CABLE_TYPES): CableType {
  const suitable = findSuitableCables(distance, speed, environment, cableTypes);
  if (suitable.length === 0) throw new Error('Kein Kabelprofil erfüllt diese Anforderungen.');
  const preferred = /Störquellen|EMI/i.test(environment) ? 'Cat 7' : distance <= 100 ? speed === 1000 ? 'Cat 5e' : 'Cat 6a' : 'Multimode';
  return suitable.find(c => c.type.includes(preferred)) ?? suitable[0];
}

function generateCableComparison(): string[] {
  return CABLE_TYPES.map(cable => {
    if (cable.type === 'Multimode Glasfaser (OM3/OM4)') {
      return `  • ${cable.type}: Profile mit passender Optik: 1 Gbit/s bis 550 m (SX), 10 Gbit/s bis 300 m (SR, OM3/OM4); andere Raten abhängig von Optik und Faserklasse, z.B. 100GBASE-SR4-S: 100 Gbit/s bis 70m (OM3) oder 100m (OM4)`;
    }
    if (cable.type === 'Singlemode Glasfaser (OS2)') {
      return `  • ${cable.type}: Profile mit passender Optik: 1 Gbit/s bis 10 km (LX/LH), 10 Gbit/s bis 10 km (LR); andere Raten abhängig von Optik und Faser, z.B. 100GBASE-LR4-S: 100 Gbit/s bis 10km`;
    }
    return `  • ${cable.type}: ${cable.links.length ? cable.links.map(link => `${link.speed / 1000} Gbit/s bis ${link.distance} m`).join('; ') : 'kein direktes Ethernet-Profil ohne Medienkonverter'}`;
  });
}
