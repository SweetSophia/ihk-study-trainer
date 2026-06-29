import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import RaidVisualizer, {
  classifyDisks,
  formatUsableCapacity,
} from '../RaidVisualizer';
import type { RaidConfig } from '../../types';

// ---------------------------------------------------------------------------
// Framer-motion: pass through so AnimatePresence / motion.* don't fight jsdom.
// `useReducedMotion` is also stubbed to false so the entrance animation
// always resolves to the final state in tests.
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
    section: ({
      children,
      className,
      ...rest
    }: {
      children?: ReactNode;
      className?: string;
    } & React.HTMLAttributes<HTMLElement>) => (
      <section className={className} {...rest}>
        {children}
      </section>
    ),
    div: ({
      children,
      className,
      ...rest
    }: {
      children?: ReactNode;
      className?: string;
    } & React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
    span: ({
      children,
      className,
      ...rest
    }: {
      children?: ReactNode;
      className?: string;
    } & React.HTMLAttributes<HTMLSpanElement>) => (
      <span className={className} {...rest}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// ---------------------------------------------------------------------------
// Lucide-react: stand-ins. RaidVisualizer doesn't import any lucide icons
// (it draws everything inline), but we keep this stub so the test file
// matches the convention used by the other visualizer tests in case
// future maintainers add a lucide icon.
// ---------------------------------------------------------------------------
vi.mock('lucide-react', () => ({}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRaid(overrides: Partial<RaidConfig> = {}): RaidConfig {
  return {
    level: 'RAID 5',
    disks: 4,
    diskSizeGb: 1000,
    usableCapacityGb: 3000,
    faultTolerance: 1,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// Pure helpers
// ===========================================================================

describe('classifyDisks', () => {
  it('marks every disk as data for RAID 0', () => {
    const result = classifyDisks(makeRaid({ level: 'RAID 0', disks: 4 }));
    expect(result).toHaveLength(4);
    expect(result.every((d) => d.role === 'data')).toBe(true);
  });

  it('marks every disk as data for RAID 1', () => {
    const result = classifyDisks(makeRaid({ level: 'RAID 1', disks: 2 }));
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.role === 'data')).toBe(true);
  });

  it('marks exactly the last disk as parity for RAID 5', () => {
    const result = classifyDisks(
      makeRaid({ level: 'RAID 5', disks: 5, diskSizeGb: 2000 }),
    );
    expect(result).toHaveLength(5);
    expect(result.slice(0, 4).every((d) => d.role === 'data')).toBe(true);
    expect(result[4]).toEqual({ index: 4, role: 'parity', diskSizeGb: 2000 });
  });

  it('marks exactly the last two disks as parity for RAID 6', () => {
    const result = classifyDisks(
      makeRaid({ level: 'RAID 6', disks: 6, diskSizeGb: 1000 }),
    );
    expect(result).toHaveLength(6);
    expect(result.slice(0, 4).every((d) => d.role === 'data')).toBe(true);
    expect(result[4]).toEqual({ index: 4, role: 'parity', diskSizeGb: 1000 });
    expect(result[5]).toEqual({ index: 5, role: 'parity', diskSizeGb: 1000 });
  });

  it('marks every disk as data for RAID 10', () => {
    const result = classifyDisks(makeRaid({ level: 'RAID 10', disks: 6 }));
    expect(result).toHaveLength(6);
    expect(result.every((d) => d.role === 'data')).toBe(true);
  });

  it('attaches the per-disk size to every entry', () => {
    const result = classifyDisks(
      makeRaid({ level: 'RAID 5', disks: 3, diskSizeGb: 500 }),
    );
    expect(result.every((d) => d.diskSizeGb === 500)).toBe(true);
  });

  it('assigns monotonically increasing indices starting at 0', () => {
    const result = classifyDisks(makeRaid({ disks: 7 }));
    expect(result.map((d) => d.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('formatUsableCapacity', () => {
  it('uses GB for capacities below 1000 GB', () => {
    expect(formatUsableCapacity(makeRaid({ usableCapacityGb: 500 }))).toBe('500 GB');
    expect(formatUsableCapacity(makeRaid({ usableCapacityGb: 999 }))).toBe('999 GB');
  });

  it('uses TB for capacities at or above 1000 GB', () => {
    expect(formatUsableCapacity(makeRaid({ usableCapacityGb: 1000 }))).toBe('1 TB');
    expect(formatUsableCapacity(makeRaid({ usableCapacityGb: 2000 }))).toBe('2 TB');
    expect(formatUsableCapacity(makeRaid({ usableCapacityGb: 12000 }))).toBe('12 TB');
  });

  it('trims trailing .00 in TB values', () => {
    expect(formatUsableCapacity(makeRaid({ usableCapacityGb: 5000 }))).toBe('5 TB');
  });

  it('keeps the two-decimal TB format when the value has a fractional part (matches generator)', () => {
    // The visualizer mirrors the generator's display rule: TB values keep
    // exactly two decimals via toFixed(2). The expected-answer string
    // generated for grading is the same shape, so visualizer + answer key
    // always agree on the displayed number.
    expect(formatUsableCapacity(makeRaid({ usableCapacityGb: 1500 }))).toBe('1.50 TB');
    expect(formatUsableCapacity(makeRaid({ usableCapacityGb: 1234 }))).toBe('1.23 TB');
  });
});

// ===========================================================================
// Component rendering
// ===========================================================================

describe('RaidVisualizer — rendering', () => {
  it('renders a labelled section with the RAID level badge', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 5' })} />);

    expect(screen.getByTestId('raid-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('viz-level')).toHaveTextContent('RAID 5');
  });

  it('renders one disk tile per physical disk (RAID 5 with 5 disks)', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 5', disks: 5 })} />);

    const tiles = screen.getAllByTestId('raid-disk-tile');
    expect(tiles).toHaveLength(5);
  });

  it('renders one disk tile per physical disk (RAID 10 with 6 disks)', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({ level: 'RAID 10', disks: 6, faultTolerance: 1 })}
      />,
    );

    const tiles = screen.getAllByTestId('raid-disk-tile');
    expect(tiles).toHaveLength(6);
  });

  it('reflects the disk count for the RAID 6 minimum (4 disks)', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 6', disks: 4 })} />);
    expect(screen.getAllByTestId('raid-disk-tile')).toHaveLength(4);
  });

  it('uses the configurable disk count for RAID 0 (e.g. 8 disks)', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 0', disks: 8 })} />);
    expect(screen.getAllByTestId('raid-disk-tile')).toHaveLength(8);
  });

  it('numbers the disks sequentially starting at 1', () => {
    render(<RaidVisualizer raid={makeRaid({ disks: 4 })} />);

    const tiles = screen.getAllByTestId('raid-disk-tile');
    expect(tiles[0]).toHaveAttribute('data-disk-index', '0');
    expect(tiles[3]).toHaveAttribute('data-disk-index', '3');

    const labels = screen.getAllByText(/^Platte \d+$/);
    expect(labels.map((el) => el.textContent)).toEqual([
      'Platte 1',
      'Platte 2',
      'Platte 3',
      'Platte 4',
    ]);
  });
});

// ===========================================================================
// Color coding (parity vs data)
// ===========================================================================

describe('RaidVisualizer — disk role colour coding', () => {
  it('marks every tile as data for RAID 0 (no parity)', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 0', disks: 4 })} />);

    const tiles = screen.getAllByTestId('raid-disk-tile');
    expect(tiles.every((t) => t.getAttribute('data-disk-role') === 'data')).toBe(true);
  });

  it('marks exactly one tile as parity for RAID 5', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 5', disks: 5 })} />);

    const tiles = screen.getAllByTestId('raid-disk-tile');
    const roles = tiles.map((t) => t.getAttribute('data-disk-role'));
    expect(roles).toEqual(['data', 'data', 'data', 'data', 'parity']);
  });

  it('marks exactly two tiles as parity for RAID 6', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 6', disks: 6 })} />);

    const tiles = screen.getAllByTestId('raid-disk-tile');
    const roles = tiles.map((t) => t.getAttribute('data-disk-role'));
    expect(roles).toEqual([
      'data',
      'data',
      'data',
      'data',
      'parity',
      'parity',
    ]);
  });

  it('marks every tile as data for RAID 10 (mirrored pairs use the same colour)', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 10', disks: 6 })} />);

    const tiles = screen.getAllByTestId('raid-disk-tile');
    expect(tiles.every((t) => t.getAttribute('data-disk-role') === 'data')).toBe(true);
  });

  it('applies different visual styling to data vs parity tiles', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 5', disks: 4 })} />);

    const tiles = screen.getAllByTestId('raid-disk-tile');
    // Three data tiles carry the emerald palette; one parity tile carries amber.
    const dataClasses = tiles[0].className;
    const parityClasses = tiles[3].className;
    expect(dataClasses).toContain('emerald');
    expect(parityClasses).toContain('amber');
  });

  it('shows the "Parität" text label on every parity tile', () => {
    // RAID 6 with 5 disks → 3 data + 2 parity. The "Parität" text appears
    // once per parity tile (inside the tile) plus once in the legend below
    // the grid — so 3 occurrences total.
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 6', disks: 5 })} />);

    const tiles = screen.getAllByTestId('raid-disk-tile');
    const parityTiles = tiles.filter(
      (t) => t.getAttribute('data-disk-role') === 'parity',
    );
    expect(parityTiles).toHaveLength(2);
    parityTiles.forEach((tile) => {
      expect(within(tile).getByText('Parität')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Capacity formatting
// ===========================================================================

describe('RaidVisualizer — capacity display', () => {
  it('displays usable capacity in GB when under the 1000 GB threshold', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({
          level: 'RAID 1',
          disks: 2,
          diskSizeGb: 500,
          usableCapacityGb: 500,
        })}
      />,
    );

    expect(screen.getByTestId('viz-stat-usable')).toHaveTextContent('500 GB');
  });

  it('displays usable capacity in TB when at or above 1000 GB', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({
          level: 'RAID 0',
          disks: 5,
          diskSizeGb: 1000,
          usableCapacityGb: 5000,
        })}
      />,
    );

    expect(screen.getByTestId('viz-stat-usable')).toHaveTextContent('5 TB');
  });

  it('keeps the two-decimal TB format when the value has a fractional part', () => {
    // 5 disks × 500 GB in RAID 6 = (5 − 2) × 500 = 1500 GB = 1.5 TB.
    render(
      <RaidVisualizer
        raid={makeRaid({
          level: 'RAID 6',
          disks: 5,
          diskSizeGb: 500,
          usableCapacityGb: 1500,
        })}
      />,
    );

    expect(screen.getByTestId('viz-stat-usable')).toHaveTextContent('1.50 TB');
  });

  it('shows the per-disk size next to the disk count in the header', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({ level: 'RAID 5', disks: 6, diskSizeGb: 2000 })}
      />,
    );

    expect(screen.getByTestId('viz-disks-total')).toHaveTextContent(
      '6 Festplatten à 2000 GB',
    );
  });
});

// ===========================================================================
// Fault tolerance badge
// ===========================================================================

describe('RaidVisualizer — fault tolerance badge', () => {
  it('renders an emerald "toleriert 1 Ausfall" badge for RAID 5 (tolerance 1)', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({ level: 'RAID 5', faultTolerance: 1 })}
      />,
    );

    const badge = screen.getByTestId('viz-fault-tolerance-badge');
    expect(badge).toHaveAttribute('data-fault-tolerance', '1');
    expect(badge).toHaveTextContent('toleriert 1 Ausfall');
  });

  it('renders an emerald "toleriert N Ausfälle" badge for tolerance > 1 (plural)', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({ level: 'RAID 6', faultTolerance: 2 })}
      />,
    );

    const badge = screen.getByTestId('viz-fault-tolerance-badge');
    expect(badge).toHaveAttribute('data-fault-tolerance', '2');
    expect(badge).toHaveTextContent('toleriert 2 Ausfälle');
  });

  it('renders a rose "keine Ausfallsicherheit" badge when tolerance is 0', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({ level: 'RAID 0', faultTolerance: 0 })}
      />,
    );

    const badge = screen.getByTestId('viz-fault-tolerance-badge');
    expect(badge).toHaveAttribute('data-fault-tolerance', '0');
    expect(badge).toHaveTextContent('keine Ausfallsicherheit');
    expect(badge.className).toContain('rose');
  });

  it('renders an emerald badge for RAID 1 with multi-disk tolerance', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({
          level: 'RAID 1',
          disks: 3,
          diskSizeGb: 1000,
          usableCapacityGb: 1000,
          faultTolerance: 2,
        })}
      />,
    );

    const badge = screen.getByTestId('viz-fault-tolerance-badge');
    expect(badge).toHaveTextContent('toleriert 2 Ausfälle');
    expect(badge.className).toContain('emerald');
  });
});

// ===========================================================================
// Accessibility
// ===========================================================================

describe('RaidVisualizer — accessibility', () => {
  it('marks the wrapper section with a German aria-label', () => {
    render(<RaidVisualizer raid={makeRaid()} />);

    const section = screen.getByLabelText('Visualisierung der RAID-Konfiguration');
    expect(section.tagName.toLowerCase()).toBe('section');
  });

  it('gives each disk tile a descriptive aria-label with role and capacity', () => {
    render(
      <RaidVisualizer
        raid={makeRaid({ level: 'RAID 5', disks: 3, diskSizeGb: 1000 })}
      />,
    );

    expect(
      screen.getByLabelText('Festplatte 1: 1000 GB (Datenträger)'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Festplatte 3: 1000 GB (Parität)'),
    ).toBeInTheDocument();
  });

  it('marks the fault-tolerance badge with role="status" so screen readers announce it', () => {
    render(<RaidVisualizer raid={makeRaid({ faultTolerance: 1 })} />);

    const badge = screen.getByRole('status');
    expect(badge).toBe(screen.getByTestId('viz-fault-tolerance-badge'));
  });

  it('includes a text-based legend so the colour code is not conveyed by colour alone', () => {
    render(<RaidVisualizer raid={makeRaid({ level: 'RAID 5' })} />);

    // Both the data and parity legend entries are present. The same
    // terminology is used for visible labels and aria-labels so screen-reader
    // and sighted users get the same vocabulary.
    expect(screen.getAllByText('Datenträger').length).toBeGreaterThanOrEqual(1);
    const parityLabels = screen.getAllByText('Parität');
    expect(parityLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('labels the disk-grid container so assistive tech announces the count', () => {
    render(<RaidVisualizer raid={makeRaid({ disks: 4 })} />);

    expect(
      screen.getByLabelText('4 Festplatten im Array'),
    ).toBeInTheDocument();
  });

  it('groups the stat values under a labelled description list', () => {
    render(<RaidVisualizer raid={makeRaid()} />);

    const dl = screen.getByLabelText('RAID-Konfigurationswerte');
    expect(dl.tagName.toLowerCase()).toBe('dl');
    // Sanity-check that the German stat labels are inside the group.
    expect(within(dl).getByText('RAID-Level')).toBeInTheDocument();
    expect(within(dl).getByText('Nutzbare Kapazität')).toBeInTheDocument();
    expect(within(dl).getByText('Ausfallsicherheit')).toBeInTheDocument();
  });
});
