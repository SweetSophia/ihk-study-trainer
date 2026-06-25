import type { LucideIcon } from 'lucide-react';
import {
  Calculator,
  Image as ImageIcon,
  Network,
  ArrowLeftRight,
  Binary,
  Hexagon,
  Shield,
  Layers,
  Cable,
  Server,
  Globe,
  Settings,
  Database,
  Terminal,
  Cloud,
  Repeat,
} from 'lucide-react';

/**
 * Canonical module descriptor: a single IHK topic the user can practice.
 * The `id`, `name`, `icon`, and `description` are the single source of truth
 * for module selection UI, the generators registry, and progress tracking.
 */
export interface ModuleDescriptor {
  /** Stable, kebab-free identifier used across DB rows, generators, and analytics. */
  id: string;
  /** Human-readable German name (full form, used in dashboards and detail views). */
  name: string;
  /**
   * Optional compact form for tight spaces like the module grid button.
   * Falls back to `name` when not set. Mirrors the historical split between
   * the grid's compact labels and the dashboard's full names.
   */
  shortName?: string;
  /** Lucide icon component rendered in module selection cards. */
  icon: LucideIcon;
  /** Short German description shown beneath the name in the desktop grid. */
  description: string;
}

/**
 * All non-auth-gated modules. Order in this array drives display order in
 * the module selector — group by topic (math → networking → security → …).
 *
 * Adding a new module = (1) add an entry here, (2) add a generator and
 * register it in `lib/generators/registry.ts`, (3) ensure DB rows use the
 * canonical id (or add a mapping in `lib/moduleIds.ts` for legacy stored
 * forms).
 */
export const BASE_MODULES: readonly ModuleDescriptor[] = [
  { id: 'bandwidth', name: 'Übertragungszeit', icon: ArrowLeftRight, description: 'Dateitransfer' },
  { id: 'imageCalc', name: 'Bildgröße', icon: ImageIcon, description: 'Speicher' },
  { id: 'imageTransferCombo', name: 'Bild-Transfer', icon: ImageIcon, description: 'Bild + Übertragung' },
  { id: 'overhead', name: 'Overhead', icon: Calculator, description: 'Protokoll' },
  { id: 'subnetting', name: 'Subnetting', icon: Network, description: 'IP-Subnetze' },
  { id: 'unitConversion', name: 'Einheiten', icon: Settings, description: 'Umrechnung' },
  { id: 'binary', name: 'Binär', icon: Binary, description: 'Binär/Dezimal' },
  { id: 'hex', name: 'Hexadezimal', shortName: 'Hex', icon: Hexagon, description: 'Hex/Dezimal' },
  { id: 'hexBinary', name: 'Hex/Binär', icon: Repeat, description: 'Hex/Binär' },
  { id: 'subnetMask', name: 'Subnetzmaske', icon: Shield, description: 'CIDR→Maske' },
  { id: 'aggregation', name: 'Aggregation', icon: Layers, description: 'Summarization' },
  { id: 'ports', name: 'Ports', icon: Server, description: 'Port/Protokoll' },
  { id: 'osi', name: 'OSI-Modell', shortName: 'OSI', icon: Globe, description: 'OSI-Schichten' },
  { id: 'cables', name: 'Kabel', icon: Cable, description: 'Kabelauswahl' },
  { id: 'linux', name: 'Linux', icon: Terminal, description: 'Linux-Befehle' },
  { id: 'cloud', name: 'Cloud', icon: Cloud, description: 'Cloud Computing' },
  { id: 'handelskalkulation', name: 'Kalkulation', icon: Calculator, description: 'Gemischt' },
  { id: 'handelskalkulationVorwaerts', name: 'Vorwärtskalkulation', shortName: 'Vorwärtskalk.', icon: Calculator, description: 'LEP → Brutto-VK' },
  { id: 'handelskalkulationRueckwaerts', name: 'Rückwärtskalkulation', shortName: 'Rückwärtskalk.', icon: Calculator, description: 'Brutto-VK → LEP' },
] as const;

/**
 * The SQL module requires authentication. The component layer adds it
 * to the displayed list only when `isAuthenticated === true`. It also
 * has no entry in `lib/generators/registry.ts` — its exercises come
 * from an AI server action (`actions/generate-sql-exercise.ts`).
 */
export const SQL_MODULE: ModuleDescriptor = {
  id: 'sql',
  name: 'SQL',
  icon: Database,
  description: 'Datenbankabfragen',
};

/** Every module, including auth-gated ones. Derived from BASE_MODULES + SQL_MODULE. */
export const ALL_MODULES: readonly ModuleDescriptor[] = [...BASE_MODULES, SQL_MODULE];

/** Quick lookup: id → German name. Use this anywhere a label is needed. */
export const MODULE_NAMES: Record<string, string> = Object.fromEntries(
  ALL_MODULES.map((m) => [m.id, m.name]),
);

/** Quick lookup: id → description. */
export const MODULE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  ALL_MODULES.map((m) => [m.id, m.description]),
);

/** Quick lookup: id → Lucide icon component. */
export const MODULE_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  ALL_MODULES.map((m) => [m.id, m.icon]),
);
