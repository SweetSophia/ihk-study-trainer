'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { RaidConfig } from '../types';

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing)
// ---------------------------------------------------------------------------

export type DiskRole = 'data' | 'parity';

/**
 * One row in the disk grid: which slot, what it stores, and how big it is.
 *
 * The visualizer doesn't draw individual stripes — it draws one tile per
 * physical disk and labels the role (data vs parity). For RAID 5/6 the
 * canonical pedagogical simplification is "one (or two) disk's worth of
 * parity space"; we mark the last N disks as parity, the rest as data.
 * Real RAID 5 distributes parity across disks (rotating), but a flat
 * one-disk-as-parity view is what IHK exam questions expect.
 */
export interface ClassifiedDisk {
  index: number;
  role: DiskRole;
  diskSizeGb: number;
}

/**
 * Decide which disks hold data and which hold parity for the chosen level.
 *
 * Exported so the tests can assert the role layout without rendering the
 * component. The function is total: every disk in [0, total) gets exactly
 * one role, and the count of parity disks matches the level's redundancy
 * overhead (1 for RAID 5, 2 for RAID 6, 0 for RAID 0/1/10).
 */
export function classifyDisks(raid: RaidConfig): ClassifiedDisk[] {
  const parityCount =
    raid.level === 'RAID 5'
      ? 1
      : raid.level === 'RAID 6'
        ? 2
        : 0;

  const disks: ClassifiedDisk[] = [];
  for (let i = 0; i < raid.disks; i++) {
    const role: DiskRole =
      parityCount > 0 && i >= raid.disks - parityCount ? 'parity' : 'data';
    disks.push({ index: i, role, diskSizeGb: raid.diskSizeGb });
  }
  return disks;
}

/**
 * Format the usable capacity for display in the visualizer.
 *
 * Mirrors the generator's `formatCapacity` rule (TB when ≥ 1000 GB) and the
 * expected-answer trimming (`5` instead of `5.00`). Pure: no I/O, no
 * randomness, safe to call inside render.
 */
export function formatUsableCapacity(raid: RaidConfig): string {
  const valueGb = raid.usableCapacityGb;
  if (valueGb >= 1000) {
    const tb = Math.round((valueGb / 1000) * 100) / 100;
    return `${tb.toFixed(2).replace(/\.00$/, '')} TB`;
  }
  return `${valueGb} GB`;
}

/**
 * Short German descriptor for a disk's role. Used both as a visible label
 * under each tile and (concatenated) inside the aria-label. Keeping this
 * as a constant table means the visual copy is grep-able from tests.
 */
const DISK_ROLE_LABEL: Record<DiskRole, string> = {
  data: 'Datenträger',
  parity: 'Parität',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RaidVisualizerProps {
  raid: RaidConfig;
}

/**
 * Visual breakdown of a RAID configuration.
 *
 * Layout (top → bottom):
 *   1. Header — level badge + level name + short description
 *   2. Disk grid — one tile per physical disk, color-coded by role
 *   3. Stat grid — level, disk count, per-disk size, formatted usable
 *      capacity, and the fault-tolerance status badge
 *
 * Rendered only when the parent StudyCard gates on `question.module ===
 * 'raid' && question.raid && (checked || showSolution)`. The component
 * itself trusts that the `RaidConfig` it receives satisfies the level's
 * constraints — the generator's `calculateRaid` is the source of truth.
 */
export default function RaidVisualizer({ raid }: RaidVisualizerProps) {
  const prefersReducedMotion = useReducedMotion();
  const disks = useMemo(() => classifyDisks(raid), [raid]);
  const usableLabel = useMemo(() => formatUsableCapacity(raid), [raid]);
  const totalDataDisks = disks.filter((d) => d.role === 'data').length;
  const totalParityDisks = disks.length - totalDataDisks;

  // Stagger fade-in for the disk tiles. Cap the delay so an 8-disk array
  // doesn't take 8 × 60ms = nearly half a second to settle.
  const baseDelay = prefersReducedMotion ? 0 : 0.04;
  const stepDelay = prefersReducedMotion ? 0 : 0.06;

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      aria-label="Visualisierung der RAID-Konfiguration"
      data-testid="raid-visualizer"
      className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden"
    >
      {/* Header */}
      <header className="flex flex-wrap items-baseline gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-400">
            <DiskGlyph role="data" className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            RAID-Array Visualisierung
          </h3>
        </div>
        <div className="ml-auto flex flex-wrap items-baseline gap-2 text-sm">
          <span
            className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono text-xs"
            data-testid="viz-level"
          >
            {raid.level}
          </span>
          <span className="text-slate-500 text-xs" data-testid="viz-disks-total">
            {raid.disks} Festplatten à {raid.diskSizeGb} GB
          </span>
        </div>
      </header>

      {/* Disk grid */}
      <div
        className="px-5 pt-4 pb-4 border-b border-slate-800/60"
        aria-label={`${raid.disks} Festplatten im Array`}
      >
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
          Festplatten
        </p>
        <div
          className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4"
          data-testid="raid-disk-grid"
        >
          {disks.map((disk, i) => (
            <motion.div
              key={disk.index}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                ease: 'easeOut',
                delay: baseDelay + i * stepDelay,
              }}
              aria-label={`Festplatte ${disk.index + 1}: ${disk.diskSizeGb} GB (${
                DISK_ROLE_LABEL[disk.role]
              })`}
              data-testid="raid-disk-tile"
              data-disk-index={disk.index}
              data-disk-role={disk.role}
              className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-colors ${
                disk.role === 'parity'
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-emerald-500/30 bg-emerald-500/5'
              }`}
            >
              <DiskGlyph
                role={disk.role}
                className="w-7 h-7"
                aria-hidden="true"
              />
              <span
                className={`text-xs font-mono font-semibold ${
                  disk.role === 'parity' ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                Platte {disk.index + 1}
              </span>
              <span
                className={`text-[10px] uppercase tracking-wider ${
                  disk.role === 'parity' ? 'text-amber-400/80' : 'text-emerald-400/80'
                }`}
              >
                {DISK_ROLE_LABEL[disk.role]}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {disk.diskSizeGb} GB
              </span>
            </motion.div>
          ))}
        </div>

        {/* Compact legend so the colour code is also conveyed in text form
            (don't rely on colour alone — accessibility requirement). */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <LegendSwatch tone="emerald" label="Datenträger" />
          {totalParityDisks > 0 && (
            <LegendSwatch tone="amber" label="Parität" />
          )}
          {raid.faultTolerance === 0 && (
            <LegendSwatch tone="rose" label="Keine Redundanz" />
          )}
        </div>
      </div>

      {/* Stat grid */}
      <dl
        className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 px-5 py-4 text-sm border-b border-slate-800/60"
        aria-label="RAID-Konfigurationswerte"
      >
        <StatRow label="RAID-Level" value={raid.level} tone="emerald" testId="viz-stat-level" />
        <StatRow
          label="Festplatten"
          value={String(raid.disks)}
          tone="slate"
          testId="viz-stat-disks"
        />
        <StatRow
          label="Größe pro Platte"
          value={`${raid.diskSizeGb} GB`}
          tone="slate"
          testId="viz-stat-disk-size"
        />
        <StatRow
          label="Nutzbare Kapazität"
          value={usableLabel}
          tone="emerald"
          testId="viz-stat-usable"
        />
        <StatRow
          label="Datenträger / Parität"
          value={`${totalDataDisks} / ${totalParityDisks}`}
          tone={totalParityDisks > 0 ? 'amber' : 'slate'}
          testId="viz-stat-split"
        />
        <StatRow
          label="Ausfallsicherheit"
          value={String(raid.faultTolerance)}
          tone={raid.faultTolerance > 0 ? 'emerald' : 'rose'}
          testId="viz-stat-fault-tolerance"
        />
      </dl>

      {/* Fault-tolerance badge */}
      <FaultToleranceBadge faultTolerance={raid.faultTolerance} />
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

type Tone = 'emerald' | 'rose' | 'amber' | 'slate';

const TONE_TEXT: Record<Tone, string> = {
  emerald: 'text-emerald-400',
  rose: 'text-rose-400',
  amber: 'text-amber-300',
  slate: 'text-slate-400',
};

const TONE_VALUE: Record<Tone, string> = {
  emerald: 'text-emerald-200',
  rose: 'text-rose-200',
  amber: 'text-amber-200',
  slate: 'text-slate-200',
};

function StatRow({
  label,
  value,
  tone,
  testId,
}: {
  label: string;
  value: string;
  tone: Tone;
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className={`text-[10px] uppercase tracking-wider ${TONE_TEXT[tone]}`}>
        {label}
      </dt>
      <dd
        className={`font-mono text-sm break-all ${TONE_VALUE[tone]}`}
        data-testid={testId}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Status pill at the bottom of the visualizer. Two branches:
 *   - faultTolerance > 0  → emerald check + "toleriert N Ausfälle"
 *   - faultTolerance === 0 → rose warning + "keine Ausfallsicherheit"
 *
 * Carries `role="status"` so screen readers announce it when it mounts.
 */
function FaultToleranceBadge({ faultTolerance }: { faultTolerance: number }) {
  const safe = faultTolerance > 0;
  const label = safe
    ? `toleriert ${faultTolerance} ${faultTolerance === 1 ? 'Ausfall' : 'Ausfälle'}`
    : 'keine Ausfallsicherheit';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2.5 px-5 py-3 text-sm font-medium ${
        safe
          ? 'bg-emerald-500/5 text-emerald-300'
          : 'bg-rose-500/10 text-rose-300'
      }`}
      data-testid="viz-fault-tolerance-badge"
      data-fault-tolerance={faultTolerance}
    >
      {safe ? (
        <CheckBadge className="w-4 h-4 text-emerald-400" />
      ) : (
        <WarningBadge className="w-4 h-4 text-rose-400" />
      )}
      <span>
        Ausfallsicherheit: <span className="font-mono">{label}</span>
      </span>
    </div>
  );
}

function LegendSwatch({ tone, label }: { tone: Tone; label: string }) {
  const dotClass =
    tone === 'emerald'
      ? 'bg-emerald-400'
      : tone === 'amber'
        ? 'bg-amber-400'
        : 'bg-rose-400';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/**
 * Inline-SVG disk glyph. Renders in two role-coloured tones (emerald /
 * amber). No lucide-react dependency — keeps the StudyCard test mock
 * unchanged and matches the inline-SVG style of SubnettingVisualizer.
 */
function DiskGlyph({
  role,
  className,
}: {
  role: DiskRole;
  className?: string;
}) {
  const fill = role === 'parity' ? '#fbbf24' : '#10b981';
  const stroke = role === 'parity' ? '#b45309' : '#047857';
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Outer chassis */}
      <rect
        x={2}
        y={5}
        width={20}
        height={14}
        rx={2}
        fill={fill}
        fillOpacity={0.18}
        stroke={stroke}
        strokeWidth={1.2}
      />
      {/* Platter ring */}
      <circle
        cx={12}
        cy={12}
        r={4.5}
        fill="none"
        stroke={stroke}
        strokeWidth={1}
        strokeOpacity={0.7}
      />
      {/* Spindle dot */}
      <circle cx={12} cy={12} r={1.5} fill={stroke} />
      {/* Activity LED */}
      <circle cx={19} cy={7.5} r={0.8} fill={stroke} fillOpacity={0.7} />
    </svg>
  );
}

function CheckBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 10.5l3.5 3.5L16 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 3l8 14H2L10 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <line x1={10} y1={8} x2={10} y2={12} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={10} cy={14.5} r={0.9} fill="currentColor" />
    </svg>
  );
}
