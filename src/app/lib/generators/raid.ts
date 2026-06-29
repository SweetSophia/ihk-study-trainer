import { Question, RaidConfig } from '../../types';

export type RaidLevel = RaidConfig['level'];

/** Common enterprise disk sizes in GB. */
const DISK_SIZES_GB = [250, 500, 1000, 2000, 4000, 8000] as const;

interface RaidSpec {
  level: RaidLevel;
  minDisks: number;
  /** If set, disk count must be a multiple of this (RAID 10 mirrors pairs). */
  diskMultiple?: number;
  compute: (disks: number, diskSizeGb: number) => {
    usableCapacityGb: number;
    faultTolerance: number;
  };
  description: string;
}

const RAID_SPECS: Record<RaidLevel, RaidSpec> = {
  'RAID 0': {
    level: 'RAID 0',
    minDisks: 2,
    compute: (disks, size) => ({ usableCapacityGb: disks * size, faultTolerance: 0 }),
    description: 'Striping ohne Redundanz — volle Kapazität, keine Ausfallsicherheit.',
  },
  'RAID 1': {
    level: 'RAID 1',
    minDisks: 2,
    compute: (disks, size) => ({
      usableCapacityGb: size,
      faultTolerance: disks - 1,
    }),
    description: 'Mirroring — jede Platte wird gespiegelt; nutzbar = eine Platte.',
  },
  'RAID 5': {
    level: 'RAID 5',
    minDisks: 3,
    compute: (disks, size) => ({
      usableCapacityGb: (disks - 1) * size,
      faultTolerance: 1,
    }),
    description: 'Striping mit einer Paritätsplatte — ein Ausfall wird toleriert.',
  },
  'RAID 6': {
    level: 'RAID 6',
    minDisks: 4,
    compute: (disks, size) => ({
      usableCapacityGb: (disks - 2) * size,
      faultTolerance: 2,
    }),
    description: 'Striping mit doppelter Parität — zwei Ausfälle werden toleriert.',
  },
  'RAID 10': {
    level: 'RAID 10',
    minDisks: 4,
    diskMultiple: 2,
    compute: (disks, size) => ({
      usableCapacityGb: (disks / 2) * size,
      // RAID 10 tolerates one failure per mirrored pair. Worst case guarantees 1.
      faultTolerance: 1,
    }),
    description:
      'Kombination aus RAID 1 + RAID 0 — Spiegelung + Striping; sehr hohe Performance und Sicherheit.',
  },
};

/**
 * Pure helper: given a RAID level, disk count, and disk size, return usable
 * capacity (GB) and fault tolerance. Throws when the configuration violates
 * the level's constraints (e.g. < minDisks, non-even RAID 10, unknown level).
 *
 * Exported for testability; the generator uses it via the higher-level
 * `generateRaidQuestion` API.
 */
export function calculateRaid(
  level: RaidLevel,
  disks: number,
  diskSizeGb: number,
): { usableCapacityGb: number; faultTolerance: number } {
  const spec = RAID_SPECS[level];
  if (!spec) throw new Error(`Unsupported RAID level: ${level}`);
  if (!Number.isFinite(disks) || disks < spec.minDisks) {
    throw new Error(`${level} requires at least ${spec.minDisks} disks, got ${disks}`);
  }
  if (spec.diskMultiple && disks % spec.diskMultiple !== 0) {
    throw new Error(`${level} requires a multiple of ${spec.diskMultiple} disks, got ${disks}`);
  }
  return spec.compute(disks, diskSizeGb);
}

/** Pick a RAID level uniformly at random. */
function pickRandomLevel(): RaidLevel {
  const levels: RaidLevel[] = ['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10'];
  return levels[Math.floor(Math.random() * levels.length)]!;
}

/** Pick a disk count that satisfies the level's constraints. */
function pickDiskCount(spec: RaidSpec): number {
  const min = spec.minDisks;
  // Per-level disk-count ranges chosen so the resulting fault tolerance
  // (RAID 1: disks − 1) never exceeds the answer dropdown ceiling of 3.
  // RAID 0/5/6/10 max out at 8 disks which is realistic for IHK exam scope.
  const maxByLevel: Record<RaidLevel, number> = {
    'RAID 0': 8,
    'RAID 1': 4,
    'RAID 5': 8,
    'RAID 6': 8,
    'RAID 10': 8,
  };
  const max = maxByLevel[spec.level];
  let count = Math.floor(Math.random() * (max - min + 1)) + min;
  if (spec.diskMultiple) {
    const remainder = count % spec.diskMultiple;
    if (remainder !== 0) count += spec.diskMultiple - remainder;
  }
  return count;
}

function pickDiskSizeGb(): number {
  return DISK_SIZES_GB[Math.floor(Math.random() * DISK_SIZES_GB.length)]!;
}

/**
 * Format a GB value into a human-readable capacity string. Uses TB if the
 * value is >= 1000 GB (matching the disk industry convention of decimal
 * gigabytes vs. tebibytes). Returns the original GB as a fallback when the
 * value is < 1000.
 */
function formatCapacity(valueGb: number): { value: number; unit: 'GB' | 'TB' } {
  if (valueGb >= 1000) {
    // Round to 2 decimals to avoid floating-point noise in the answer key.
    return { value: Math.round((valueGb / 1000) * 100) / 100, unit: 'TB' };
  }
  return { value: valueGb, unit: 'GB' };
}

/**
 * Generate a RAID scenario question for the calculator module.
 *
 * Mirrors the pattern of other wrapped generators (`osi`, `cables`, …):
 * the caller (registry) adds `id`, `module`, and difficulty. This keeps
 * the generator pure and trivial to unit-test.
 */
export interface RaidQuestion {
  theme: string;
  questionText: string;
  expectedAnswers: Record<string, string | number | boolean>;
  answerInputs: NonNullable<Question['answerInputs']>;
  solutionSteps: string[];
  difficulty: 'medium' | 'hard';
  raid: RaidConfig;
}

export function generateRaidQuestion(): RaidQuestion {
  let level: RaidLevel = 'RAID 0';
  let disks = 2;
  let diskSizeGb = 1000;

  // Re-roll whenever the picked combination violates a constraint, so the
  // final output always satisfies the level's invariants.
  let spec: RaidSpec = RAID_SPECS[level];
  let result: ReturnType<typeof calculateRaid> = calculateRaid(level, disks, diskSizeGb);
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidateLevel = pickRandomLevel();
    const candidateSpec = RAID_SPECS[candidateLevel];
    const candidateDisks = pickDiskCount(candidateSpec);
    const candidateDiskSizeGb = pickDiskSizeGb();
    try {
      const candidateResult = calculateRaid(
        candidateLevel,
        candidateDisks,
        candidateDiskSizeGb,
      );
      level = candidateLevel;
      spec = candidateSpec;
      disks = candidateDisks;
      diskSizeGb = candidateDiskSizeGb;
      result = candidateResult;
      break;
    } catch {
      // pickDiskCount + calculateRaid should make this unreachable; guard
      // anyway so an unexpected violation can never crash the generator. The
      // initialized RAID 0 fallback above remains valid if all attempts fail.
    }
  }

  const { value, unit } = formatCapacity(result.usableCapacityGb);
  const expectedValue =
    unit === 'TB' ? value.toFixed(2).replace(/\.00$/, '') : String(value);

  const choiceText =
    level === 'RAID 10'
      ? `${disks} Festplatten à ${diskSizeGb} GB (gerade Anzahl)`
      : `${disks} Festplatten à ${diskSizeGb} GB`;

  const raid: RaidConfig = {
    level,
    disks,
    diskSizeGb,
    usableCapacityGb: result.usableCapacityGb,
    faultTolerance: result.faultTolerance,
  };

  return {
    theme: 'RAID-Konfigurationen',
    questionText:
      `Du baust ein ${level}-Array aus ${choiceText}. ` +
      `Berechne die nutzbare Kapazität sowie die Anzahl der Festplattenausfälle, die das Array toleriert.\n\n` +
      `Gib die Kapazität mit passender Einheit (GB oder TB) an.`,
    expectedAnswers: {
      usableCapacity: expectedValue,
      unit,
      faultTolerance: String(result.faultTolerance),
    },
    answerInputs: [
      {
        valueKey: 'usableCapacity',
        unitKey: 'unit',
        label: 'Nutzbare Kapazität',
        unitOptions: ['GB', 'TB'],
      },
      {
        valueKey: 'faultTolerance',
        label: 'Ausfallsicherheit (Festplattenausfälle)',
        valueOptions: ['0', '1', '2', '3', '4'],
        acceptedValues: [String(result.faultTolerance)],
      },
    ],
    solutionSteps: buildSolutionSteps({
      level,
      disks,
      diskSizeGb,
      usableCapacityGb: result.usableCapacityGb,
      faultTolerance: result.faultTolerance,
      displayValue: expectedValue,
      unit,
      description: spec.description,
    }),
    difficulty: level === 'RAID 5' || level === 'RAID 6' || level === 'RAID 10' ? 'hard' : 'medium',
    raid,
  };
}

function buildSolutionSteps(params: {
  level: RaidLevel;
  disks: number;
  diskSizeGb: number;
  usableCapacityGb: number;
  faultTolerance: number;
  displayValue: string;
  unit: 'GB' | 'TB';
  description: string;
}): string[] {
  const {
    level,
    disks,
    diskSizeGb,
    usableCapacityGb,
    faultTolerance,
    displayValue,
    unit,
    description,
  } = params;

  const capFormula = (() => {
    switch (level) {
      case 'RAID 0':
        return `${disks} × ${diskSizeGb} GB = ${usableCapacityGb} GB`;
      case 'RAID 1':
        return `1 × ${diskSizeGb} GB = ${diskSizeGb} GB (Spiegelung der übrigen Platten)`;
      case 'RAID 5':
        return `(${disks} − 1) × ${diskSizeGb} GB = ${usableCapacityGb} GB (Parität über alle Platten)`;
      case 'RAID 6':
        return `(${disks} − 2) × ${diskSizeGb} GB = ${usableCapacityGb} GB (doppelte Parität)`;
      case 'RAID 10':
        return `(${disks} / 2) × ${diskSizeGb} GB = ${usableCapacityGb} GB (gespiegelte Pairs, dann Striping)`;
    }
  })();

  const tolFormula = (() => {
    switch (level) {
      case 'RAID 0':
        return `Keine Redundanz — ein Ausfall = Datenverlust.`;
      case 'RAID 1':
        return `${disks - 1} Ausfälle toleriert (alle Spiegelplatten müssen ausfallen).`;
      case 'RAID 5':
        return `1 Ausfall wird toleriert (Paritätsplatte kann rekonstruiert werden).`;
      case 'RAID 6':
        return `2 Ausfälle werden toleriert (doppelte Parität).`;
      case 'RAID 10':
        return `Mindestens 1 Ausfall garantiert (eine Platte pro Mirror-Pair). Worst case: alle Spiegel einer Seite.`;
    }
  })();

  return [
    `RAID-Level: ${level}`,
    ``,
    `Definition: ${description}`,
    ``,
    `Gegeben: ${disks} Festplatten à ${diskSizeGb} GB`,
    ``,
    `Kapazitätsformel (${level}):`,
    `  ${capFormula}`,
    ``,
    `Anzeige: ${displayValue} ${unit}`,
    ``,
    `Ausfallsicherheit (${level}):`,
    `  ${tolFormula}`,
    ``,
    `Ergebnis:`,
    `  Nutzbare Kapazität: ${displayValue} ${unit}`,
    `  Ausfallsicherheit: ${faultTolerance}`,
  ];
}
