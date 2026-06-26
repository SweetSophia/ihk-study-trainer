import type { HTMLAttributes } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: HTMLAttributes<HTMLDivElement>) => (
      <div className={className}>{children}</div>
    ),
  },
}));

// Mock lucide-react icons used by ProgressDashboard (and the module icons
// transitively pulled in via `lib/modules`, which is the new source of truth
// for MODULE_NAMES)
vi.mock('lucide-react', () => ({
  Trophy: () => <svg data-testid="icon-trophy" />,
  Target: () => <svg data-testid="icon-target" />,
  Flame: () => <svg data-testid="icon-flame" />,
  RotateCcw: () => <svg data-testid="icon-rotatecc" />,
  TrendingUp: () => <svg data-testid="icon-trending-up" />,
  BarChart3: () => <svg data-testid="icon-bar-chart" />,
  CheckCircle: () => <svg data-testid="icon-check-circle" />,
  XCircle: () => <svg data-testid="icon-x-circle" />,
  Calculator: () => <svg data-testid="icon-calculator" />,
  Image: () => <svg data-testid="icon-image" />,
  Network: () => <svg data-testid="icon-network" />,
  ArrowLeftRight: () => <svg data-testid="icon-arrow-left-right" />,
  Binary: () => <svg data-testid="icon-binary" />,
  Hexagon: () => <svg data-testid="icon-hexagon" />,
  Repeat: () => <svg data-testid="icon-repeat" />,
  Shield: () => <svg data-testid="icon-shield" />,
  Layers: () => <svg data-testid="icon-layers" />,
  Cable: () => <svg data-testid="icon-cable" />,
  Server: () => <svg data-testid="icon-server" />,
  Globe: () => <svg data-testid="icon-globe" />,
  Settings: () => <svg data-testid="icon-settings" />,
  Database: () => <svg data-testid="icon-database" />,
  Terminal: () => <svg data-testid="icon-terminal" />,
  Cloud: () => <svg data-testid="icon-cloud" />,
}));

// Mock celebration helpers so we can assert they are invoked (or not) without
// exercising the canvas-confetti runtime in unit tests.
const mockFireFirstCorrectConfetti = vi.fn().mockResolvedValue(undefined);
const mockFireStreakConfetti = vi.fn().mockResolvedValue(undefined);
vi.mock('../../lib/celebrations', () => ({
  fireFirstCorrectConfetti: (...args: unknown[]) =>
    mockFireFirstCorrectConfetti(...args),
  fireStreakConfetti: (...args: unknown[]) => mockFireStreakConfetti(...args),
  isStreakMilestone: (days: number) => [1, 3, 7, 14, 30, 100].includes(days),
  STREAK_MILESTONES: [1, 3, 7, 14, 30, 100],
}));

import ProgressDashboard from '../ProgressDashboard';

const noOp = vi.fn();

describe('ProgressDashboard – MODULE_NAMES PR additions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ProgressDashboard now persists `showDetails` to localStorage. Tests
    // share a single jsdom context, so clear the key before each render
    // to keep the button's initial text deterministic.
    window.localStorage.clear();
  });

  function makeProgress(module: string) {
    return [{ module, questions_attempted: 5, questions_correct: 3 }];
  }

  async function openDetails() {
    const btn = screen.getByText('Details anzeigen');
    await userEvent.click(btn);
  }

  it('displays "Bildgröße" for the canonical imageCalc module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('imageCalc')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Bildgröße')).toBeInTheDocument();
  });

  it('displays "Bildgröße" for the legacy image-calc module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('image-calc')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Bildgröße')).toBeInTheDocument();
  });

  it('displays "Bild-Transfer" for the canonical imageTransferCombo module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('imageTransferCombo')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Bild-Transfer')).toBeInTheDocument();
  });

  it('displays "Bild-Transfer" for the legacy image-transfer-combo module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('image-transfer-combo')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Bild-Transfer')).toBeInTheDocument();
  });

  it('displays "Einheiten" for the canonical unitConversion module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('unitConversion')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Einheiten')).toBeInTheDocument();
  });

  it('displays "Einheiten" for the legacy unit-conversion module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('unit-conversion')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Einheiten')).toBeInTheDocument();
  });

  it('displays "Linux" for the linux module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('linux')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Linux')).toBeInTheDocument();
  });

  it('displays "Cloud" for the cloud module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('cloud')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Cloud')).toBeInTheDocument();
  });

  it('displays "Kalkulation" for the handelskalkulation module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('handelskalkulation')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Kalkulation')).toBeInTheDocument();
  });

  it('displays "Vorwärtskalkulation" for the canonical split module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('handelskalkulationVorwaerts')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Vorwärtskalkulation')).toBeInTheDocument();
  });

  it('displays "Rückwärtskalkulation" for the canonical split module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('handelskalkulationRueckwaerts')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Rückwärtskalkulation')).toBeInTheDocument();
  });

  it('displays "Vorwärtskalkulation" for the stored split module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('handelskalkulation-vorwaerts')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Vorwärtskalkulation')).toBeInTheDocument();
  });

  it('displays "Rückwärtskalkulation" for the stored split module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('handelskalkulation-rueckwaerts')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('Rückwärtskalkulation')).toBeInTheDocument();
  });

  it('displays "SQL" for the sql module ID', async () => {
    render(<ProgressDashboard progress={makeProgress('sql')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('SQL')).toBeInTheDocument();
  });

  it('falls back to the raw module ID when no mapping is found', async () => {
    render(<ProgressDashboard progress={makeProgress('unknown-module-xyz')} streakDays={0} onPracticeMistakes={noOp} />);
    await openDetails();
    expect(screen.getByText('unknown-module-xyz')).toBeInTheDocument();
  });
});

describe('ProgressDashboard – "gestartet" counter (PR change: removed hard-coded "von 12")', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // See the first describe block — localStorage carries between renders
    // in the same jsdom context, so reset for isolation.
    window.localStorage.clear();
  });

  it('shows "gestartet" without a hard-coded total count', () => {
    render(
      <ProgressDashboard
        progress={[
          { module: 'bandwidth', questions_attempted: 3, questions_correct: 2 },
          { module: 'imageCalc', questions_attempted: 0, questions_correct: 0 },
        ]}
        streakDays={0}
        onPracticeMistakes={noOp}
      />
    );
    expect(screen.getByText('gestartet')).toBeInTheDocument();
    // The old "von 12 gestartet" text must no longer appear
    expect(screen.queryByText(/von \d+ gestartet/)).toBeNull();
  });

  it('counts only modules with at least one question attempted', () => {
    render(
      <ProgressDashboard
        progress={[
          { module: 'bandwidth', questions_attempted: 5, questions_correct: 3 },
          { module: 'cables', questions_attempted: 0, questions_correct: 0 },
          { module: 'sql', questions_attempted: 2, questions_correct: 1 },
        ]}
        streakDays={0}
        onPracticeMistakes={noOp}
      />
    );
    // 2 out of 3 modules were started (bandwidth and sql)
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('gestartet')).toBeInTheDocument();
  });
});

describe('ProgressDashboard – showDetails persistence (PR 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('starts collapsed when localStorage is empty', () => {
    render(
      <ProgressDashboard
        progress={[{ module: 'bandwidth', questions_attempted: 1, questions_correct: 1 }]}
        streakDays={0}
        onPracticeMistakes={noOp}
      />
    );
    expect(screen.getByText('Details anzeigen')).toBeInTheDocument();
  });

  it('starts expanded when localStorage has "true"', async () => {
    window.localStorage.setItem('ihk_progress_show_details', 'true');
    render(
      <ProgressDashboard
        progress={[{ module: 'bandwidth', questions_attempted: 1, questions_correct: 1 }]}
        streakDays={0}
        onPracticeMistakes={noOp}
      />
    );
    expect(await screen.findByText('Details ausblenden')).toBeInTheDocument();
  });

  it('persists the expanded state to localStorage when toggled', async () => {
    render(
      <ProgressDashboard
        progress={[{ module: 'bandwidth', questions_attempted: 1, questions_correct: 1 }]}
        streakDays={0}
        onPracticeMistakes={noOp}
      />
    );
    await userEvent.click(screen.getByText('Details anzeigen'));
    expect(window.localStorage.getItem('ihk_progress_show_details')).toBe('true');
    expect(screen.getByText('Details ausblenden')).toBeInTheDocument();
  });

  it('persists the collapsed state to localStorage when toggled back', async () => {
    window.localStorage.setItem('ihk_progress_show_details', 'true');
    render(
      <ProgressDashboard
        progress={[{ module: 'bandwidth', questions_attempted: 1, questions_correct: 1 }]}
        streakDays={0}
        onPracticeMistakes={noOp}
      />
    );
    await userEvent.click(await screen.findByText('Details ausblenden'));
    expect(window.localStorage.getItem('ihk_progress_show_details')).toBe('false');
    expect(screen.getByText('Details anzeigen')).toBeInTheDocument();
  });
});

describe('ProgressDashboard – streak milestone confetti', () => {

  beforeEach(() => {

    vi.clearAllMocks();

    window.localStorage.clear();

    mockFireStreakConfetti.mockClear();

    mockFireFirstCorrectConfetti.mockClear();

  });

  

  function makeProgress() {

    return [{ module: 'bandwidth', questions_attempted: 5, questions_correct: 3 }];

  }

  

  it('fires streak confetti when streakDays is a milestone', () => {

    render(

      <ProgressDashboard

        progress={makeProgress()}

        streakDays={7}

        onPracticeMistakes={noOp}

      />,

    );

    expect(mockFireStreakConfetti).toHaveBeenCalledWith(7);

  });

  

  it('does NOT fire streak confetti on a non-milestone day', () => {

    render(

      <ProgressDashboard

        progress={makeProgress()}

        streakDays={5}

        onPracticeMistakes={noOp}

      />,

    );

    expect(mockFireStreakConfetti).not.toHaveBeenCalled();

  });

  

  it('does NOT fire streak confetti on day 0', () => {

    render(

      <ProgressDashboard

        progress={makeProgress()}

        streakDays={0}

        onPracticeMistakes={noOp}

      />,

    );

    expect(mockFireStreakConfetti).not.toHaveBeenCalled();

  });

  

  it('fires for every documented milestone', () => {

    for (const days of [1, 3, 7, 14, 30, 100]) {

      mockFireStreakConfetti.mockClear();

      const { unmount } = render(

        <ProgressDashboard

          progress={makeProgress()}

          streakDays={days}

          onPracticeMistakes={noOp}

        />,

      );

      expect(mockFireStreakConfetti).toHaveBeenCalledWith(days);

      unmount();

    }

  });

  

  it('never fires the first-correct helper (this component only handles streaks)', () => {

    render(

      <ProgressDashboard

        progress={makeProgress()}

        streakDays={7}

        onPracticeMistakes={noOp}

      />,

    );

    expect(mockFireFirstCorrectConfetti).not.toHaveBeenCalled();

  });

});
