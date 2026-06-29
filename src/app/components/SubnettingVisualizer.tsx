'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Network, Eye } from 'lucide-react';
import type { Question } from '../types';

// ===========================================================================
// Pure helpers (exported for unit testing)
// ===========================================================================

/**
 * Match an IPv4 address with a `/CIDR` suffix.
 * Tolerates whitespace around the slash and accepts 1–3 digit octets.
 *
 * The pattern intentionally anchors on a digit so it doesn't catch IPs that
 * appear inside larger numbers or sentence fragments.
 */
const IPV4_WITH_CIDR =
  /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*\/\s*(\d{1,2})(?!\d)/;

export interface ParsedSubnetInput {
  ip: string;
  cidr: number;
}

/**
 * Parse the first IPv4/CIDR token from a free-form text (the subnetting
 * generator embeds it in `questionText` as `Gegeben: IP-Adresse 10.5.3.4/24`).
 *
 * Returns null when:
 *   • no IPv4/CIDR token is found
 *   • any octet is outside 0–255
 *   • the CIDR is outside 0–32
 */
export function parseIpAndCidr(text: string): ParsedSubnetInput | null {
  if (typeof text !== 'string' || text.length === 0) return null;
  const match = text.match(IPV4_WITH_CIDR);
  if (!match) return null;
  const octets = [match[1], match[2], match[3], match[4]].map((s) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  });
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  const cidr = Number(match[5]);
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) return null;
  return { ip: `${octets[0]}.${octets[1]}.${octets[2]}.${octets[3]}`, cidr };
}

function popcountByte(n: number): number {
  let count = 0;
  let value = n;
  while (value > 0) {
    count += value & 1;
    value >>>= 1;
  }
  return count;
}

/**
 * Derive the CIDR prefix length from a dotted-decimal subnet mask.
 *
 * The subnetting generator always emits a valid contiguous mask (`255.0.0.0`,
 * `255.255.252.0`, etc.), so a plain popcount over the four octets is enough
 * for the visualizer. We intentionally don't validate "contiguity" — a mask
 * the generator can't produce should be surfaced as an unexpected value rather
 * than silently coerced.
 *
 * Returns null when `mask` is not a parseable IPv4 dotted-decimal string.
 */
export function countCidrFromMask(mask: string): number | null {
  if (typeof mask !== 'string' || mask.length === 0) return null;
  const parts = mask.split('.');
  if (parts.length !== 4) return null;
  let bits = 0;
  for (const raw of parts) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    bits += popcountByte(n);
  }
  // Each octet is 0–255 (max 8 set bits), so the popcount sum is always
  // ≤ 32 by construction. We trust the per-octet range check above; any
  // non-contiguous mask the generator can't produce would have surfaced
  // as an unexpected value rather than silently being coerced.
  return bits;
}

// ===========================================================================
// Component
// ===========================================================================

interface SubnettingVisualizerProps {
  question: Question;
}

/**
 * SVG-based visual breakdown of a subnetting question.
 *
 * Layers three things:
 *   1. 32-bit split bar (network bits vs host bits, octet boundaries).
 *   2. Address-range bar (Network → Host min → Host max → Broadcast).
 *   3. Detail grid with the exact expected values.
 *
 * Rendered only when the StudyCard gates on `question.module === 'subnetting'`.
 * The component itself is pure and never renders for other module ids — it
 * assumes a well-formed subnetting Question (networkId, broadcast, hostMin,
 * hostMax, subnetMask, usableHosts all present).
 */
export default function SubnettingVisualizer({ question }: SubnettingVisualizerProps) {
  const prefersReducedMotion = useReducedMotion();
  const parsed = useMemo(() => {
    const fromText = parseIpAndCidr(question.questionText);
    const maskStr = String(question.expectedAnswers.subnetMask ?? '');
    const fromMask = countCidrFromMask(maskStr);
    const cidr = fromText?.cidr ?? fromMask ?? null;
    const ip = fromText?.ip ?? null;
    return { ip, cidr, maskStr };
  }, [question.questionText, question.expectedAnswers.subnetMask]);

  const networkId = String(question.expectedAnswers.networkId ?? '');
  const broadcast = String(question.expectedAnswers.broadcast ?? '');
  const hostMin = String(question.expectedAnswers.hostMin ?? '');
  const hostMax = String(question.expectedAnswers.hostMax ?? '');
  const usableHosts = Number(question.expectedAnswers.usableHosts ?? 0);
  const totalAddresses =
    parsed.cidr === null ? null : 2 ** (32 - parsed.cidr);

  return (
    <motion.section
      // Respect prefers-reduced-motion: users with vestibular sensitivity
      // see an instant mount instead of a 6px slide.
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      aria-label="Subnetting Visualisierung"
      data-testid="subnetting-visualizer"
      className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden"
    >
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                              */}
      {/* ----------------------------------------------------------------- */}
      <header className="flex flex-wrap items-baseline gap-3 px-5 py-3 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-400">
            <Network className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Visuelle Aufschlüsselung
          </h3>
        </div>
        <div className="ml-auto flex flex-wrap items-baseline gap-2 text-sm font-mono">
          {parsed.ip && (
            <span className="text-slate-100" data-testid="viz-given-ip">
              {parsed.ip}
            </span>
          )}
          {parsed.cidr !== null && (
            <span className="text-emerald-400 font-semibold" data-testid="viz-cidr">
              /{parsed.cidr}
            </span>
          )}
          {parsed.maskStr && (
            <span className="text-slate-500 text-xs">
              Maske: <span className="text-slate-300">{parsed.maskStr}</span>
            </span>
          )}
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* 32-bit split bar                                                   */}
      {/* ----------------------------------------------------------------- */}
      {parsed.cidr !== null && (
        <div className="px-5 pt-4 pb-3 border-b border-slate-800/60">
          <SectionLabel icon={<Eye className="w-3 h-3" aria-hidden="true" />}>
            32-Bit-Aufteilung
          </SectionLabel>
          <BitBar cidr={parsed.cidr} />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Address range bar                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="px-5 pt-4 pb-4 border-b border-slate-800/60">
        <SectionLabel icon={<Eye className="w-3 h-3" aria-hidden="true" />}>
          Adressbereich im Subnetz
        </SectionLabel>
        <RangeBar
          networkId={networkId}
          broadcast={broadcast}
          hostMin={hostMin}
          hostMax={hostMax}
          totalAddresses={totalAddresses}
          usableHosts={usableHosts}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Detail grid                                                        */}
      {/* ----------------------------------------------------------------- */}
      <dl
        className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 px-5 py-4 text-sm"
        aria-label="Erwartete Subnetz-Werte"
      >
        <DetailRow label="Network ID" value={networkId} tone="emerald" testId="viz-network-id" />
        <DetailRow label="Broadcast" value={broadcast} tone="rose" testId="viz-broadcast" />
        <DetailRow label="Subnetzmaske" value={parsed.maskStr} tone="slate" testId="viz-mask" />
        <DetailRow label="Erster Host" value={hostMin} tone="amber" testId="viz-host-min" />
        <DetailRow label="Letzter Host" value={hostMax} tone="amber" testId="viz-host-max" />
        <DetailRow
          label="Nutzbare Hosts"
          value={usableHosts.toLocaleString('de-DE')}
          tone="emerald"
          testId="viz-usable-hosts"
        />
      </dl>
    </motion.section>
  );
}

// ===========================================================================
// Subcomponents
// ===========================================================================

function SectionLabel({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
      {icon}
      <span>{children}</span>
    </p>
  );
}

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

function DetailRow({
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
 * 32-cell bit bar showing the network/host split, with octet dividers
 * and a vertical "CIDR divider" line at the bit boundary.
 *
 * Geometry (in user units):
 *   viewBox: 0 0 320 60
 *   cell width: 10, gap: 0 (32 cells × 10 = 320 wide)
 *   cells live at y=24..46 (height 22)
 */
function BitBar({ cidr }: { cidr: number }) {
  const networkBits = Math.max(0, Math.min(32, cidr));
  const hostBits = 32 - networkBits;
  const cells = Array.from({ length: 32 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 320 60"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`32-Bit-Aufteilung: ${networkBits} Netzwerk-Bits, ${hostBits} Host-Bits`}
      className="w-full h-auto"
    >
      {/* Octet labels */}
      {['1–8', '9–16', '17–24', '25–32'].map((label, i) => {
        const x = i * 80 + 40; // center of each octet group (80 units wide)
        return (
          <text
            key={label}
            x={x}
            y={12}
            textAnchor="middle"
            fontSize="9"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#64748b"
          >
            {label}
          </text>
        );
      })}

      {/* Octet divider lines (between octets — subtle) */}
      {[1, 2, 3].map((i) => (
        <line
          key={`oct-${i}`}
          x1={i * 80}
          y1={20}
          x2={i * 80}
          y2={50}
          stroke="#1e293b"
          strokeWidth={1}
        />
      ))}

      {/* Bit cells */}
      {cells.map((i) => {
        const isNetwork = i < networkBits;
        return (
          <rect
            key={i}
            x={i * 10 + 0.5}
            y={24}
            width={9}
            height={22}
            rx={1}
            fill={isNetwork ? '#10b981' : '#475569'}
            fillOpacity={isNetwork ? 0.85 : 0.45}
            stroke="#0f172a"
            strokeWidth={0.5}
          />
        );
      })}

      {/* CIDR divider — vertical dashed line at the network/host boundary */}
      {networkBits > 0 && networkBits < 32 && (
        <line
          x1={networkBits * 10}
          y1={18}
          x2={networkBits * 10}
          y2={52}
          stroke="#fb7185"
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
      )}

      {/* Legend */}
      <text
        x={0}
        y={58}
        fontSize="9"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#10b981"
      >
        Netzwerk
      </text>
      <text
        x={320}
        y={58}
        fontSize="9"
        textAnchor="end"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#94a3b8"
      >
        Host
      </text>
    </svg>
  );
}

/**
 * Horizontal bar showing the relative position of Network ID, the host range,
 * and the Broadcast address within the subnet. N is always at the left edge,
 * B at the right edge, and the host range covers everything in between.
 */
function RangeBar({
  networkId,
  broadcast,
  hostMin,
  hostMax,
  totalAddresses,
  usableHosts,
}: {
  networkId: string;
  broadcast: string;
  hostMin: string;
  hostMax: string;
  totalAddresses: number | null;
  usableHosts: number;
}) {
  return (
    <svg
      viewBox="0 0 320 70"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Adressbereich: ${networkId} (Network) bis ${broadcast} (Broadcast), nutzbare Hosts ${hostMin} bis ${hostMax}`}
      className="w-full h-auto"
    >
      {/* Background bar */}
      <rect x={0} y={28} width={320} height={10} rx={2} fill="#1e293b" />

      {/* Host-range highlight (everything except N and B endpoints) */}
      <rect
        x={6}
        y={30}
        width={308}
        height={6}
        rx={1}
        fill="#10b981"
        fillOpacity={0.45}
      />

      {/* Network ID marker (left edge) */}
      <g>
        <line x1={0} y1={18} x2={0} y2={48} stroke="#10b981" strokeWidth={2} />
        <circle cx={0} cy={33} r={3} fill="#10b981" />
        <text
          x={0}
          y={14}
          fontSize="10"
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill="#10b981"
          fontWeight={700}
        >
          N
        </text>
      </g>

      {/* Broadcast marker (right edge) */}
      <g>
        <line x1={320} y1={18} x2={320} y2={48} stroke="#fb7185" strokeWidth={2} />
        <circle cx={320} cy={33} r={3} fill="#fb7185" />
        <text
          x={320}
          y={14}
          fontSize="10"
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill="#fb7185"
          fontWeight={700}
        >
          B
        </text>
      </g>

      {/* IP labels under the bar */}
      <text
        x={0}
        y={60}
        fontSize="9"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#cbd5e1"
      >
        {networkId}
      </text>
      <text
        x={320}
        y={60}
        fontSize="9"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#cbd5e1"
      >
        {broadcast}
      </text>
      <text
        x={160}
        y={60}
        fontSize="9"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#fbbf24"
      >
        {hostMin} … {hostMax}
      </text>

      {/* Count chip top-right */}
      {totalAddresses !== null && (
        <text
          x={320}
          y={12}
          fontSize="9"
          textAnchor="end"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill="#64748b"
        >
          {totalAddresses.toLocaleString('de-DE')} Adressen · {usableHosts.toLocaleString('de-DE')} nutzbar
        </text>
      )}
    </svg>
  );
}
