import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Database: () => <svg data-testid="icon-database" />,
  Play: () => <svg data-testid="icon-play" />,
  RefreshCw: () => <svg data-testid="icon-refresh" />,
  AlertCircle: () => <svg data-testid="icon-alert" />,
  CheckCircle2: () => <svg data-testid="icon-check" />,
  XCircle: () => <svg data-testid="icon-xcircle" />,
  Lock: () => <svg data-testid="icon-lock" />,
}));

// Mock the server action
vi.mock('../../actions/generate-sql-exercise', () => ({
  generateSqlExercise: vi.fn(),
}));

vi.mock('../../lib/sql-grading', () => ({ gradeSqlAnswer: vi.fn() }));
import { gradeSqlAnswer } from '../../lib/sql-grading';
import { generateSqlExercise } from '../../actions/generate-sql-exercise';
import SqlTrainer from '../SqlTrainer';

const mockGenerateSqlExercise = vi.mocked(generateSqlExercise);

// Helper to render SqlTrainer with default test accessHash
const renderSqlTrainer = (props?: Partial<React.ComponentProps<typeof SqlTrainer>>) => {
  return render(<SqlTrainer accessHash="test-access-hash" {...props} />);
};

const sampleExercise = {
  theme: 'Network Infrastructure Asset Inventory',
  themeDescription: 'Verwaltung von Netzwerkgeräten im Unternehmen',
  setup_sql: `CREATE TABLE devices (id SERIAL PRIMARY KEY, name VARCHAR(50), type VARCHAR(20));
INSERT INTO devices VALUES (1, 'Router-01', 'router');
INSERT INTO devices VALUES (2, 'Switch-01', 'switch');`,
  question: 'Welche Geräte vom Typ "router" sind im System erfasst?',
  solution_query: "SELECT * FROM devices WHERE type = 'router';",
  difficulty: 'easy' as const,
  grading: { kind: 'select', ordered: false } as const,
};

describe('SqlTrainer', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  describe('initial render', () => {
    it('renders the heading', () => {
      renderSqlTrainer();
      expect(screen.getByText('SQL-Übungen (PostgreSQL)')).toBeInTheDocument();
    });

    it('renders the "Neue Übung" button', () => {
      renderSqlTrainer();
      expect(screen.getByRole('button', { name: /Neue Übung/i })).toBeInTheDocument();
    });

    it('shows the empty state message before any exercise is loaded', () => {
      renderSqlTrainer();
      expect(screen.getByText(/Klicke auf/i)).toBeInTheDocument();
    });

    it('shows the dynamic generation hint in initial state', () => {
      renderSqlTrainer();
      expect(screen.getByText(/dynamisch mit echten PostgreSQL-Abfragen/i)).toBeInTheDocument();
    });

    it('"Neue Übung" button is enabled initially', () => {
      renderSqlTrainer();
      const btn = screen.getByRole('button', { name: /Neue Übung/i });
      expect(btn).not.toBeDisabled();
    });

    it('does not render the exercise area before fetch', () => {
      renderSqlTrainer();
      expect(screen.queryByText('Szenario')).not.toBeInTheDocument();
      expect(screen.queryByText('Aufgabe')).not.toBeInTheDocument();
    });

    it('shows locked UI when accessHash is null', () => {
      render(<SqlTrainer accessHash={null} />);
      // Lock icon and message should be visible
      expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
      expect(screen.getByText(/Anmeldung erforderlich/i)).toBeInTheDocument();
      // No exercise generation should occur - mock should not have been called
      expect(mockGenerateSqlExercise).not.toHaveBeenCalled();
    });
  });

  describe('fetchNewExercise', () => {
    it('shows exercise content after successful fetch', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      renderSqlTrainer();
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByText(sampleExercise.theme)).toBeInTheDocument();
      });

      expect(screen.getByText(sampleExercise.themeDescription)).toBeInTheDocument();
      expect(screen.getByText(sampleExercise.question)).toBeInTheDocument();
    });

    it('shows the setup SQL schema after fetch', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      renderSqlTrainer();
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        // The setup_sql is multiline; use partial regex to find it
        expect(screen.getByText(/CREATE TABLE devices/i)).toBeInTheDocument();
      });

      // Also verify the section heading
      expect(screen.getByText('Datenbank-Struktur')).toBeInTheDocument();
    });

    it('shows a textarea for SQL input after exercise is loaded', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      renderSqlTrainer();
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT.*FROM.*WHERE/i)).toBeInTheDocument();
      });
    });

    it('stays in the empty state when generateSqlExercise throws', async () => {
      mockGenerateSqlExercise.mockRejectedValueOnce(new Error('API error'));

      renderSqlTrainer();
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      // After a failed fetch, the empty state should still be shown (no exercise loaded)
      await waitFor(() => {
        expect(screen.getByText(/dynamisch mit echten PostgreSQL-Abfragen/i)).toBeInTheDocument();
      });
      // No exercise content should appear
      expect(screen.queryByText('Szenario')).not.toBeInTheDocument();
    });

    it('clears the previous exercise and shows a new one on re-fetch', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);
      renderSqlTrainer();
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
      await waitFor(() => {
        expect(screen.getByText(sampleExercise.theme)).toBeInTheDocument();
      });

      const secondExercise = { ...sampleExercise, theme: 'IT-Helpdesk Ticket System' };
      mockGenerateSqlExercise.mockResolvedValueOnce(secondExercise);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByText('IT-Helpdesk Ticket System')).toBeInTheDocument();
      });
      expect(screen.queryByText(sampleExercise.theme)).not.toBeInTheDocument();
    });

    it('clears the user query when a new exercise is loaded', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      renderSqlTrainer();
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/SELECT/i) as HTMLTextAreaElement;
      await userEvent.type(textarea, 'SELECT * FROM devices;');
      expect(textarea.value).toBe('SELECT * FROM devices;');

      // Fetch a second exercise - query should be cleared
      mockGenerateSqlExercise.mockResolvedValueOnce({
        ...sampleExercise,
        theme: 'Second Exercise',
      });
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByText('Second Exercise')).toBeInTheDocument();
      });

      const newTextarea = screen.getByPlaceholderText(/SELECT/i) as HTMLTextAreaElement;
      expect(newTextarea.value).toBe('');
    });
  });


  async function load(onCorrect = vi.fn(), onIncorrect = vi.fn()) {
    mockGenerateSqlExercise.mockResolvedValue(sampleExercise);
    const view = renderSqlTrainer({ onCorrect, onIncorrect });
    await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
    await userEvent.type(await screen.findByRole('textbox'), 'SELECT 1');
    return { ...view, onCorrect, onIncorrect, run: screen.getByRole('button', { name: /Query ausführen/i }) };
  }

  it('shows feedback and scores a correct submission only once', async () => {
    vi.mocked(gradeSqlAnswer).mockResolvedValue({ correct: true });
    const { run, onCorrect } = await load();
    await userEvent.click(run);
    expect(await screen.findByText(/Korrekt!/)).toBeInTheDocument();
    await userEvent.click(run);
    expect(onCorrect).toHaveBeenCalledOnce();
    expect(run).toBeDisabled();
  });

  it('allows retry after an incorrect answer', async () => {
    vi.mocked(gradeSqlAnswer).mockResolvedValueOnce({ correct: false }).mockResolvedValueOnce({ correct: true });
    const { run, onIncorrect, onCorrect } = await load();
    await userEvent.click(run);
    expect(await screen.findByText(/Ergebnis weicht ab/)).toBeInTheDocument();
    expect(onIncorrect).toHaveBeenCalledOnce();
    await userEvent.click(run);
    expect(await screen.findByText(/Korrekt!/)).toBeInTheDocument();
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it('shows SQL errors and does not score fixture failures', async () => {
    vi.mocked(gradeSqlAnswer).mockResolvedValueOnce({ correct: false, message: 'SQL Fehler: syntax error' }).mockRejectedValueOnce(new Error('Musterlösung enthält einen Fehler'));
    const { run, onIncorrect, onCorrect } = await load();
    await userEvent.click(run);
    expect(await screen.findByText(/SQL Fehler: syntax error/)).toBeInTheDocument();
    await userEvent.click(run);
    expect(await screen.findByText(/technisch nicht geprüft/)).toBeInTheDocument();
    expect(screen.queryByText(/Musterlösung enthält einen Fehler/)).not.toBeInTheDocument();
    expect(onIncorrect).toHaveBeenCalledOnce();
    expect(onCorrect).not.toHaveBeenCalled();
  });

  it('ignores repeated clicks while a submission is running', async () => {
    let finish!: (value: { correct: boolean }) => void;
    vi.mocked(gradeSqlAnswer).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { run, onCorrect } = await load();
    fireEvent.click(run);
    fireEvent.click(run);
    expect(run).toBeDisabled();
    expect(gradeSqlAnswer).toHaveBeenCalledOnce();
    await act(async () => finish({ correct: true }));
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it.each(['success', 'error'] as const)('ignores stale %s after a new exercise', async outcome => {
    let finish!: (value: { correct: boolean }) => void;
    let fail!: (reason: Error) => void;
    vi.mocked(gradeSqlAnswer).mockReturnValue(new Promise((resolve, reject) => { finish = resolve; fail = reject; }));
    const { run, onCorrect, onIncorrect } = await load();
    fireEvent.click(run);
    await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
    await act(async () => { if (outcome === 'success') finish({ correct: true }); else fail(new Error('stale')); });
    expect(onCorrect).not.toHaveBeenCalled();
    expect(onIncorrect).not.toHaveBeenCalled();
    expect(screen.queryByText(/Korrekt!|stale/)).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('ignores completion and hides the old exercise after the account changes', async () => {
    let finish!: (value: { correct: boolean }) => void;
    vi.mocked(gradeSqlAnswer).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { run, rerender, onCorrect, onIncorrect } = await load();
    fireEvent.click(run);
    rerender(<SqlTrainer accessHash="another-hash" onCorrect={onCorrect} onIncorrect={onIncorrect} />);
    await act(async () => finish({ correct: true }));
    expect(onCorrect).not.toHaveBeenCalled();
    expect(onIncorrect).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('ignores completion after unmount', async () => {
    let finish!: (value: { correct: boolean }) => void;
    vi.mocked(gradeSqlAnswer).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { run, unmount, onCorrect, onIncorrect } = await load();
    fireEvent.click(run);
    unmount();
    await act(async () => finish({ correct: true }));
    expect(onCorrect).not.toHaveBeenCalled();
    expect(onIncorrect).not.toHaveBeenCalled();
  });

  it('announces an initial generation failure even without an exercise', async () => {
    mockGenerateSqlExercise.mockRejectedValueOnce(new Error('429 private provider detail'));
    renderSqlTrainer();
    const status = screen.getByRole('status');
    await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
    await waitFor(() => expect(status).toHaveTextContent(/Rate limit erreicht/));
    expect(status).not.toHaveTextContent('private provider detail');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('retains the old exercise and draft while replacement is pending and after failure', async () => {
    const { run } = await load();
    let fail!: (reason: Error) => void;
    mockGenerateSqlExercise.mockReturnValueOnce(new Promise((_, reject) => { fail = reject; }));
    await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
    expect(screen.getByText(sampleExercise.theme)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('SELECT 1');
    expect(run).toBeDisabled();
    await act(async () => fail(new Error('offline')));
    expect(screen.getByRole('status')).toHaveTextContent(/Aufgaben-Generierung/);
    expect(screen.getByRole('textbox')).toHaveValue('SELECT 1');
    expect(run).toBeEnabled();
  });

  it('keeps a completed exercise unscorable after replacement fails', async () => {
    vi.mocked(gradeSqlAnswer).mockResolvedValue({ correct: true });
    const { run, onCorrect } = await load();
    await userEvent.click(run);
    mockGenerateSqlExercise.mockRejectedValueOnce(new Error('offline'));
    await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
    expect(screen.getByRole('textbox')).toHaveValue('SELECT 1');
    expect(run).toBeDisabled();
    await userEvent.click(run);
    expect(onCorrect).toHaveBeenCalledOnce();
  });

  it('requests strict infrastructure classification and never scores a thrown engine failure', async () => {
    vi.mocked(gradeSqlAnswer).mockRejectedValueOnce(new WebAssembly.RuntimeError('private engine trap'));
    const { run, onCorrect, onIncorrect } = await load();
    await userEvent.click(run);
    expect(gradeSqlAnswer).toHaveBeenCalledWith(sampleExercise, 'SELECT 1', { rejectInfrastructureErrors: true });
    expect(screen.getByRole('status')).toHaveTextContent(/technisch/);
    expect(screen.getByRole('status')).not.toHaveTextContent('private engine trap');
    expect(onCorrect).not.toHaveBeenCalled();
    expect(onIncorrect).not.toHaveBeenCalled();
    expect(run).toBeEnabled();
  });

  it('does not show old identity feedback after an account transition', async () => {
    vi.mocked(gradeSqlAnswer).mockResolvedValue({ correct: false, message: 'SQL Fehler: old identity detail' });
    const { run, rerender } = await load();
    await userEvent.click(run);
    expect(screen.getByText(/old identity detail/)).toBeInTheDocument();
    rerender(<SqlTrainer accessHash="another-synthetic-identity" />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('announces that checking is in progress while the grading promise is pending', async () => {
    let finish!: (result: { correct: boolean }) => void;
    vi.mocked(gradeSqlAnswer).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const { run } = await load();
    fireEvent.click(run);
    expect(screen.getByRole('status')).toHaveTextContent(/wird geprüft/);
    await act(async () => finish({ correct: true }));
    expect(screen.getByRole('status')).toHaveTextContent(/Korrekt!/);
  });
});
