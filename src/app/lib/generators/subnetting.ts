import { Question } from '../../types';

export const SUBNETTING_CIDRS = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const;
type SubnettingCidr = typeof SUBNETTING_CIDRS[number];

export const MAX_HOSTS_PER_CIDR: Record<SubnettingCidr, number> = Object.freeze(
  Object.fromEntries(
    SUBNETTING_CIDRS.map((cidr) => [cidr, (1 << (32 - cidr)) - 2]),
  ) as Record<SubnettingCidr, number>,
);

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255
  ].join('.');
}

function cidrToMask(cidr: number): number {
  return (-1 << (32 - cidr)) >>> 0;
}

function maskToDotted(mask: number): string {
  return longToIp(mask);
}

export function generateSubnettingQuestion(): Question {
  // Random CIDR between /17 and /30
  const cidr = SUBNETTING_CIDRS[Math.floor(Math.random() * SUBNETTING_CIDRS.length)];
  
  // Random IP in 10.x.x.x range
  const ip2 = Math.floor(Math.random() * 256);
  const ip3 = Math.floor(Math.random() * 256);
  const ip4 = Math.floor(Math.random() * 256);
  const ip = `10.${ip2}.${ip3}.${ip4}`;
  
  const mask = cidrToMask(cidr);
  const ipLong = ipToLong(ip);
  
  const networkId = (ipLong & mask) >>> 0;
  const broadcast = (networkId | ~mask) >>> 0;
  const hostMin = (networkId + 1) >>> 0;
  const hostMax = (broadcast - 1) >>> 0;
  const usableHosts = MAX_HOSTS_PER_CIDR[cidr];
  
  const difficulty: 'easy' | 'medium' | 'hard' = 
    cidr < 20 ? 'hard' :
    cidr < 25 ? 'medium' : 'easy';
  
  return {
    id: `subnetting-${Date.now()}`,
    theme: 'Netzwerkarchitektur & Overhead',
    module: 'subnetting',
    questionText: `Gegeben: IP-Adresse ${ip}/${cidr}\nBerechne: Network ID, Broadcast-Adresse, erste nutzbare Host-Adresse, letzte nutzbare Host-Adresse, Subnetzmaske (dotted decimal) und Anzahl der nutzbaren Hosts.`,
    expectedAnswers: {
      networkId: longToIp(networkId),
      broadcast: longToIp(broadcast),
      hostMin: longToIp(hostMin),
      hostMax: longToIp(hostMax),
      subnetMask: maskToDotted(mask),
      usableHosts: usableHosts
    },
    solutionSteps: [
      `Gegeben: IP = ${ip}, CIDR = /${cidr}`,
      ``,
      `Schritt 1: Subnetzmaske berechnen`,
      `  /${cidr} bedeutet ${cidr} Bits für Netzwerk`,
      `  Maske in Binär: ${'1'.repeat(cidr)}${'0'.repeat(32-cidr)}`,
      `  Maske dotted: ${maskToDotted(mask)}`,
      ``,
      `Schritt 2: Netzwerkadresse (AND-Verknüpfung)`,
      `  IP:   ${ipLong.toString(2).padStart(32, '0').match(/.{8}/g)?.join('.')}`,
      `  Mask: ${mask.toString(2).padStart(32, '0').match(/.{8}/g)?.join('.')}`,
      `  Network ID: ${longToIp(networkId)}`,
      ``,
      `Schritt 3: Broadcast-Adresse`,
      `  Alle Host-Bits auf 1 setzen`,
      `  Broadcast: ${longToIp(broadcast)}`,
      ``,
      `Schritt 4: Nutzbare Host-Bereich`,
      `  Erster Host: ${longToIp(hostMin)} (Network ID + 1)`,
      `  Letzter Host: ${longToIp(hostMax)} (Broadcast - 1)`,
      ``,
      `Schritt 5: Anzahl nutzbarer Hosts`,
      `  Formel: 2^(32 - CIDR) - 2`,
      `  Berechnung: 2^${32 - cidr} - 2 = ${usableHosts}`
    ],
    difficulty
  };
}
