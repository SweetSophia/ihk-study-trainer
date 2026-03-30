export interface CableQuestion {
  theme: string;
  questionText: string;
  scenario: { distance: number; speed: number; environment: string };
  expectedAnswers: Record<string, string>;
  /** All pros of the correct cable (used to build acceptedValues) */
  correctPros: string[];
  solutionSteps: string[];
}

export const CABLE_TYPES: Array<{ 
  type: string; 
  maxSpeed: number; 
  maxDistance: number; 
  environments: string[]; 
  pros: string[];
  cons: string[];
}> = [
  {
    type: 'Cat 5e (Twisted Pair)',
    maxSpeed: 1000,
    maxDistance: 100,
    environments: ['Büro', 'Indoor', 'LAN'],
    pros: ['Günstig', 'Einfach verlegbar', 'Gut für 1 Gbit/s'],
    cons: ['Max. 100m', 'Störanfällig bei EMI']
  },
  {
    type: 'Cat 6 (Twisted Pair)',
    maxSpeed: 10000,
    maxDistance: 55,
    environments: ['Büro', 'Indoor', 'LAN', 'Rechenzentrum'],
    pros: ['Bessere Schirmung', '10 Gbit/s möglich (kurz)'],
    cons: ['Teurer als Cat 5e', '10 Gbit/s nur bis 55m']
  },
  {
    type: 'Cat 6a (Twisted Pair)',
    maxSpeed: 10000,
    maxDistance: 100,
    environments: ['Rechenzentrum', 'Indoor', 'LAN'],
    pros: ['10 Gbit/s bis 100m', 'Bessere Schirmung'],
    cons: ['Teuer', 'Dickeres Kabel']
  },
  {
    type: 'Cat 7 (Twisted Pair)',
    maxSpeed: 10000,
    maxDistance: 100,
    environments: ['Rechenzentrum', 'Hochleistungs-LAN'],
    pros: ['Geschirmtes Kabel (S/FTP)', '10 Gbit/s zuverlässig'],
    cons: ['Sehr teuer', 'Aufwendige Verlegung']
  },
  {
    type: 'Multimode Glasfaser (OM3/OM4)',
    maxSpeed: 100000,
    maxDistance: 550,
    environments: ['Rechenzentrum', 'Indoor', 'Campus'],
    pros: ['Hohe Bandbreite', 'Immun gegen EMI', 'Bis 550m'],
    cons: ['Teuer', 'Spezielle Werkzeuge nötig']
  },
  {
    type: 'Singlemode Glasfaser (OS2)',
    maxSpeed: 1000000,
    maxDistance: 10000,
    environments: ['WAN', 'Campus', 'Outdoor', 'Rechenzentrum'],
    pros: ['Sehr große Reichweite', 'Höchste Bandbreite', 'Immun gegen EMI'],
    cons: ['Sehr teuer', 'Laser-Lichtquelle nötig', 'Aufwendige Installation']
  },
  {
    type: 'Koaxialkabel (RG-6)',
    maxSpeed: 1000,
    maxDistance: 500,
    environments: ['Outdoor', 'TV-Verteilung', 'Alte LANs'],
    pros: ['Gute Reichweite', 'Wetterfest (Outdoor)', 'Kostengünstig für TV'],
    cons: ['Geringe Bandbreite vs. Glasfaser', 'Veraltet für LAN']
  }
];

const SCENARIOS = [
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
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  
  // Find best cable type
  const bestCable = findBestCable(scenario.distance, scenario.speed);
  
  // Build expectedAnswers with one key per bare-minimum reason dropdown
  const reasonCount = Math.max(1, bestCable.pros.length - 1);
  const expectedAnswers: Record<string, string> = { cableType: bestCable.type };
  for (let i = 0; i < reasonCount; i++) {
    expectedAnswers[`reason${i + 1}`] = bestCable.pros[i];
  }

  return {
    theme: 'Netzwerkarchitektur & Overhead',
    questionText: `Wähle das passende Kabelmedium und nenne Vorteile für folgendes Szenario:\nEntfernung: ${scenario.distance}m\nGeschwindigkeit: ${scenario.speed >= 1000 ? scenario.speed / 1000 + ' Gbit/s' : scenario.speed + ' Mbit/s'}\nUmgebung: ${scenario.environment}`,
    scenario: scenario,
    expectedAnswers,
    correctPros: bestCable.pros,
    solutionSteps: [
      `Szenario:`,
      `  Entfernung: ${scenario.distance}m`,
      `  Geschwindigkeit: ${scenario.speed >= 1000 ? scenario.speed / 1000 + ' Gbit/s' : scenario.speed + ' Mbit/s'}`,
      `  Umgebung: ${scenario.environment}`,
      ``,
      `Anforderungen:`,
      `  • Mindestens ${scenario.speed >= 1000 ? scenario.speed / 1000 + ' Gbit/s' : scenario.speed + ' Mbit/s'}`,
      `  • Mindestens ${scenario.distance}m Reichweite`,
      `  • Geeignet für: ${scenario.environment}`,
      ``,
      `Kabeltypen-Vergleich:`,
      ...generateCableComparison(),
      ``,
      `Empfehlung: ${bestCable.type}`,
      ``,
      `Begründung:`,
      ...bestCable.pros.map(pro => `  ✓ ${pro}`),
      ...bestCable.cons.map(con => `  ⚠ ${con}`),
      ``,
      `Ergebnis:`,
      `  Kabeltyp: ${bestCable.type}`
    ]
  };
}

function findBestCable(distance: number, speed: number) {
  // Find cables that meet requirements
  const suitable = CABLE_TYPES.filter(cable => 
    cable.maxSpeed >= speed && 
    cable.maxDistance >= distance
  );
  
  if (suitable.length === 0) {
    // If nothing meets all requirements, return singlemode fiber
    return CABLE_TYPES.find(c => c.type.includes('Singlemode')) || CABLE_TYPES[CABLE_TYPES.length - 1];
  }
  
  // Prefer copper for short distances, fiber for long distances
  if (distance <= 100 && speed <= 1000) {
    const cat5e = suitable.find(c => c.type.includes('Cat 5e'));
    if (cat5e) return cat5e;
  }
  
  if (distance <= 100 && speed <= 10000) {
    const cat6a = suitable.find(c => c.type.includes('Cat 6a'));
    if (cat6a) return cat6a;
  }
  
  if (distance <= 550) {
    const mmf = suitable.find(c => c.type.includes('Multimode'));
    if (mmf) return mmf;
  }
  
  // Return first suitable (typically singlemode for long distances)
  return suitable[0];
}

function generateCableComparison(): string[] {
  return CABLE_TYPES.map(cable => 
    `  • ${cable.type}: bis ${cable.maxSpeed >= 1000 ? cable.maxSpeed / 1000 + ' Gbit/s' : cable.maxSpeed + ' Mbit/s'}, max ${cable.maxDistance}m`
  );
}
