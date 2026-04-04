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

// Mock lucide-react icons used by ProgressDashboard
vi.mock('lucide-react', () => ({
  Trophy: () => <svg data-testid="icon-trophy" />,
  Target: () => <svg data-testid="icon-target" />,
  Flame: () => <svg data-testid="icon-flame" />,
  RotateCcw: () => <svg data-testid="icon-rotatecc" />,
  TrendingUp: () => <svg data-testid="icon-trending-up" />,
  BarChart3: () => <svg data-testid="icon-bar-chart" />,
  CheckCircle: () => <svg data-testid="icon-check-circle" />,
  XCircle: () => <svg data-testid="icon-x-circle" />,
}));

import ProgressDashboard from '../ProgressDashboard';

const noOp = vi.fn();

describe('ProgressDashboard – MODULE_NAMES PR additions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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