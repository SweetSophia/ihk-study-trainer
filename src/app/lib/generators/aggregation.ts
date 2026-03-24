export interface AggregationQuestion {
  theme: string;
  questionText: string;
  networks: string[];
  expectedAnswers: { summaryRoute: string; summaryCidr: number; possible: boolean };
  solutionSteps: string[];
}

export function generateAggregationQuestion(): AggregationQuestion {
  // Generate 2-4 networks that can be aggregated
  const numNetworks = Math.floor(Math.random() * 3) + 2; // 2-4 networks
  const baseCidr = [22, 23, 24][Math.floor(Math.random() * 3)];
  const baseNetwork = generateRandomNetwork();
  
  // Generate contiguous networks
  const networks: string[] = [];
  for (let i = 0; i < numNetworks; i++) {
    const network = incrementNetwork(baseNetwork, i, baseCidr);
    networks.push(`${network}/${baseCidr}`);
  }
  
  // Calculate summary route
  const { summaryRoute, summaryCidr, possible } = calculateSummary(networks);
  
  return {
    theme: 'Netzwerkarchitektur & Overhead',
    questionText: `Kann folgende Netzwerke zu einer Summary-Route aggregiert werden? Falls ja, gebe die Summary-Route an.\nNetzwerke: ${networks.join(', ')}`,
    networks: networks,
    expectedAnswers: {
      summaryRoute: summaryRoute,
      summaryCidr: summaryCidr,
      possible: possible
    },
    solutionSteps: [
      `Gegeben: Netzwerke = ${networks.join(', ')}`,
      ``,
      `Schritt 1: Netzwerkadressen in Binär umwandeln`,
      ...generateNetworkBinarySteps(networks),
      ``,
      `Schritt 2: Gemeinsame Bits zählen (von links)`,
      `  Gemeinsame Bits: ${summaryCidr}`,
      ``,
      `Schritt 3: Summary-Route bestimmen`,
      `  Network: ${summaryRoute}/${summaryCidr}`,
      ``,
      possible ? 
        `Ergebnis: Aggregation möglich\n  Summary-Route: ${summaryRoute}/${summaryCidr}` :
        `Ergebnis: Aggregation nicht möglich (Netzwerke nicht zusammenhängend)`
    ]
  };
}

function generateRandomNetwork(): string {
  const octet2 = Math.floor(Math.random() * 256);
  const octet3 = Math.floor(Math.random() * 256);
  return `10.${octet2}.${octet3}.0`;
}

function incrementNetwork(network: string, increment: number, cidr: number): string {
  const parts = network.split('.').map(Number);
  const long = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  const hostBits = 32 - cidr;
  const networkSize = Math.pow(2, hostBits);
  const newLong = long + (increment * networkSize);
  
  return [
    (newLong >>> 24) & 255,
    (newLong >>> 16) & 255,
    (newLong >>> 8) & 255,
    newLong & 255
  ].join('.');
}

function calculateSummary(networks: string[]): { summaryRoute: string; summaryCidr: number; possible: boolean } {
  if (networks.length < 2) {
    const [network, cidr] = networks[0].split('/');
    return { summaryRoute: network, summaryCidr: parseInt(cidr), possible: true };
  }
  
  // Convert all networks to 32-bit integers
  const networkLongs = networks.map(n => {
    const [ip] = n.split('/');
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  });
  
  // Find common prefix
  let commonBits = 0;
  let mask = 0x80000000;
  
  while (commonBits < 32) {
    const firstBit = networkLongs[0] & mask;
    const allSame = networkLongs.every(n => (n & mask) === firstBit);
    
    if (!allSame) break;
    
    commonBits++;
    mask >>>= 1;
  }
  
  // Check if networks are contiguous
  const sorted = [...networkLongs].sort((a, b) => a - b);
  const cidr = parseInt(networks[0].split('/')[1]);
  const hostBits = 32 - cidr;
  const networkSize = Math.pow(2, hostBits);
  
  let contiguous = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== networkSize) {
      contiguous = false;
      break;
    }
  }
  
  const summaryLong = networkLongs[0] & ((-1 << (32 - commonBits)) >>> 0);
  const summaryRoute = longToIp(summaryLong);
  
  return {
    summaryRoute,
    summaryCidr: commonBits,
    possible: contiguous && commonBits > 0
  };
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255
  ].join('.');
}

function generateNetworkBinarySteps(networks: string[]): string[] {
  return networks.map(n => {
    const [ip] = n.split('/');
    const parts = ip.split('.').map(Number);
    const long = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
    const binary = long.toString(2).padStart(32, '0');
    const formatted = binary.match(/.{8}/g)?.join('.') || binary;
    return `  ${ip}: ${formatted}`;
  });
}
