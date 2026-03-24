export interface SubnetMaskQuestion {
  theme: string;
  questionText: string;
  cidr: number;
  expectedAnswers: { subnetMask: string; wildcard: string };
  solutionSteps: string[];
}

export function generateSubnetMaskQuestion(): SubnetMaskQuestion {
  // Random CIDR between /8 and /30
  const cidrs = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  const cidr = cidrs[Math.floor(Math.random() * cidrs.length)];
  
  // Calculate subnet mask
  const subnetMask = cidrToDottedMask(cidr);
  const wildcard = cidrToWildcard(cidr);
  
  return {
    theme: 'Netzwerkarchitektur & Overhead',
    questionText: `Wandle das CIDR-Präfix /${cidr} in eine Subnetzmaske (dotted decimal) und Wildcard-Maske um.`,
    cidr: cidr,
    expectedAnswers: {
      subnetMask: subnetMask,
      wildcard: wildcard
    },
    solutionSteps: [
      `Gegeben: CIDR-Präfix = /${cidr}`,
      ``,
      `Schritt 1: Subnetzmaske in Binär darstellen`,
      `  /${cidr} bedeutet ${cidr} Netzwerk-Bits`,
      `  Binär: ${'1'.repeat(cidr)}${'0'.repeat(32 - cidr)}`,
      ``,
      `Schritt 2: In Oktette aufteilen (je 8 Bits)`,
      ...generateOctetSteps(cidr),
      ``,
      `Schritt 3: Oktette in Dezimal umwandeln`,
      `  Subnetzmaske: ${subnetMask}`,
      ``,
      `Schritt 4: Wildcard-Maske berechnen (Inverse der Subnetzmaske)`,
      `  Wildcard: ${wildcard}`,
      ``,
      `Ergebnis:`,
      `  Subnetzmaske: ${subnetMask}`,
      `  Wildcard: ${wildcard}`
    ]
  };
}

function cidrToDottedMask(cidr: number): string {
  const mask = (-1 << (32 - cidr)) >>> 0;
  return longToIp(mask);
}

function cidrToWildcard(cidr: number): string {
  const mask = (-1 << (32 - cidr)) >>> 0;
  const wildcard = ~mask >>> 0;
  return longToIp(wildcard);
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255
  ].join('.');
}

function generateOctetSteps(cidr: number): string[] {
  const mask = (-1 << (32 - cidr)) >>> 0;
  const binary = mask.toString(2).padStart(32, '0');
  const octets = binary.match(/.{8}/g) || [];
  
  return octets.map((octet, index) => {
    const decimal = parseInt(octet, 2);
    return `  Oktett ${index + 1}: ${octet} = ${decimal}`;
  });
}
