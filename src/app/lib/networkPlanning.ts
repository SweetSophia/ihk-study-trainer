/** Original, fixed AP2 practice scenario. No exam-source content. */
export const NETWORK_PARENT = '192.168.40.0/24';
export const NETWORK_GROUPS = [
  { id: 'office', label: 'Büro', hosts: 50 },
  { id: 'workshop', label: 'Werkstatt', hosts: 25 },
  { id: 'guest', label: 'Gäste', hosts: 12 },
] as const;

export type NetworkGroupId = (typeof NETWORK_GROUPS)[number]['id'];
export type AllocationField = 'network' | 'prefix' | 'vlan';
export type NetworkPlan = Record<NetworkGroupId, Record<AllocationField, string>>;
type FieldErrors = Record<AllocationField, string[]>;

export interface NetworkPlanResult {
  valid: boolean;
  rows: Record<NetworkGroupId, FieldErrors>;
  conflicts: {
    groups: [NetworkGroupId, NetworkGroupId];
    kind: 'overlap' | 'vlan';
    message: string;
  }[];
}

/** One possible answer, never the basis for validating a learner's plan. */
export const NETWORK_EXAMPLE: NetworkPlan = {
  office: { network: '192.168.40.0', prefix: '26', vlan: '10' },
  workshop: { network: '192.168.40.64', prefix: '27', vlan: '20' },
  guest: { network: '192.168.40.96', prefix: '28', vlan: '30' },
};

function parseInteger(raw: string, min: number, max: number): number | null {
  const value = raw.trim();
  if (!/^(0|[1-9]\d*)$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= min && number <= max ? number : null;
}

function parseIPv4(raw: string): number | null {
  const octets = raw.trim().split('.');
  if (octets.length !== 4) return null;
  // Internal whitespace and leading-zero octets are deliberately rejected.
  if (octets.some(octet => !/^(0|[1-9]\d{0,2})$/.test(octet) || Number(octet) > 255)) return null;
  return octets.reduce((address, octet) => address * 256 + Number(octet), 0);
}

/** Check constraints, not equality with an example. Arithmetic avoids signed bit shifts. */
export function validateNetworkPlan(plan: NetworkPlan): NetworkPlanResult {
  const rows: NetworkPlanResult['rows'] = {
    office: { network: [], prefix: [], vlan: [] },
    workshop: { network: [], prefix: [], vlan: [] },
    guest: { network: [], prefix: [], vlan: [] },
  };
  const conflicts: NetworkPlanResult['conflicts'] = [];
  const ranges: Partial<Record<NetworkGroupId, { start: number; end: number }>> = {};
  const vlans: Partial<Record<NetworkGroupId, number>> = {};
  const parentStart = parseIPv4(NETWORK_PARENT.split('/')[0])!;
  const parentEnd = parentStart + 255;

  for (const group of NETWORK_GROUPS) {
    const input = plan[group.id];
    const errors = rows[group.id];
    const address = parseIPv4(input.network);
    const prefix = parseInteger(input.prefix, 0, 32);
    const vlan = parseInteger(input.vlan, 2, 4094);

    if (address === null) errors.network.push('Eine vollständige IPv4-Adresse mit vier Oktetten (0–255) eingeben.');
    if (prefix === null) errors.prefix.push('Eine ganze Präfixlänge von 0 bis 32 ohne Schrägstrich eingeben.');
    if (vlan === null) errors.vlan.push('Eine ganze VLAN-ID von 2 bis 4094 eingeben.');
    else vlans[group.id] = vlan;

    if (prefix !== null) {
      const blockSize = 2 ** (32 - prefix);
      const usable = Math.max(0, blockSize - 2); // This scenario uses ordinary LAN subnets.
      if (usable < group.hosts) {
        errors.prefix.push(`Mindestens ${group.hosts} nutzbare Adressen einschließlich Gateway benötigt; /${prefix} bietet hier ${usable}.`);
      }
      if (address !== null) {
        const aligned = address % blockSize === 0;
        if (!aligned) errors.network.push(`Die Netzadresse muss für /${prefix} an einer Blockgrenze liegen.`);
        const end = address + blockSize - 1;
        if (address < parentStart || end > parentEnd) {
          errors.network.push(`Das gesamte Teilnetz muss vollständig in ${NETWORK_PARENT} liegen.`);
        }
        // Do not invent a normalized allocation for a misaligned input.
        if (aligned) ranges[group.id] = { start: address, end };
      }
    }
  }

  for (let i = 0; i < NETWORK_GROUPS.length; i++) {
    for (let j = i + 1; j < NETWORK_GROUPS.length; j++) {
      const first = NETWORK_GROUPS[i];
      const second = NETWORK_GROUPS[j];
      const a = ranges[first.id];
      const b = ranges[second.id];
      if (a && b && a.start <= b.end && b.start <= a.end) {
        conflicts.push({ groups: [first.id, second.id], kind: 'overlap', message: `${first.label} und ${second.label}: Die Teilnetze überlappen sich.` });
      }
      if (vlans[first.id] !== undefined && vlans[first.id] === vlans[second.id]) {
        conflicts.push({ groups: [first.id, second.id], kind: 'vlan', message: `${first.label} und ${second.label}: Unterschiedliche VLAN-IDs erforderlich.` });
      }
    }
  }

  return {
    valid: Object.values(rows).every(fields => Object.values(fields).every(errors => errors.length === 0)) && conflicts.length === 0,
    rows,
    conflicts,
  };
}
