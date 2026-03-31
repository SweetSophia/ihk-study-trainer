import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Database: () => <svg data-testid="icon-database" />,
  Play: () => <svg data-testid="icon-play" />,
  RefreshCw: () => <svg data-testid="icon-refresh" />,
  AlertCircle: () => <svg data-testid="icon-alert" />,
  CheckCircle2: () => <svg data-testid="icon-check" />,
  XCircle: () => <svg data-testid="icon-xcircle" />,
}));

// Mock the server action
vi.mock('../../actions/generate-sql-exercise', () => ({
  generateSqlExercise: vi.fn(),
}));

// Mock PGlite as a class constructor
let mockQueryFn = vi.fn();
vi.mock('@electric-sql/pglite', () => ({
  PGlite: vi.fn().mockImplementation(function (this: any) {
    this.query = mockQueryFn;
  }),
}));

import { generateSqlExercise } from '../../actions/generate-sql-exercise';
import { PGlite } from '@electric-sql/pglite';
import SqlTrainer from '../SqlTrainer';

const mockGenerateSqlExercise = vi.mocked(generateSqlExercise);

const sampleExercise = {
  theme: 'Network Infrastructure Asset Inventory',
  themeDescription: 'Verwaltung von Netzwerkgeräten im Unternehmen',
  setup_sql: `CREATE TABLE devices (id SERIAL PRIMARY KEY, name VARCHAR(50), type VARCHAR(20));
INSERT INTO devices VALUES (1, 'Router-01', 'router');
INSERT INTO devices VALUES (2, 'Switch-01', 'switch');`,
  question: 'Welche Geräte vom Typ "router" sind im System erfasst?',
  solution_query: "SELECT * FROM devices WHERE type = 'router';",
  difficulty: 'easy' as const,
};

describe('SqlTrainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockQueryFn to a fresh mock
    mockQueryFn = vi.fn();
    // Re-assign to the PGlite mock implementation
    vi.mocked(PGlite).mockImplementation(function (this: any) {
      this.query = mockQueryFn;
    });
  });

  describe('initial render', () => {
    it('renders the heading', () => {
      render(<SqlTrainer />);
      expect(screen.getByText('SQL-Übungen (PostgreSQL)')).toBeInTheDocument();
    });

    it('renders the "Neue Übung" button', () => {
      render(<SqlTrainer />);
      expect(screen.getByRole('button', { name: /Neue Übung/i })).toBeInTheDocument();
    });

    it('shows the empty state message before any exercise is loaded', () => {
      render(<SqlTrainer />);
      expect(screen.getByText(/Klicke auf/i)).toBeInTheDocument();
    });

    it('shows the dynamic generation hint in initial state', () => {
      render(<SqlTrainer />);
      expect(screen.getByText(/dynamisch mit echten PostgreSQL-Abfragen/i)).toBeInTheDocument();
    });

    it('"Neue Übung" button is enabled initially', () => {
      render(<SqlTrainer />);
      const btn = screen.getByRole('button', { name: /Neue Übung/i });
      expect(btn).not.toBeDisabled();
    });

    it('does not render the exercise area before fetch', () => {
      render(<SqlTrainer />);
      expect(screen.queryByText('Szenario')).not.toBeInTheDocument();
      expect(screen.queryByText('Aufgabe')).not.toBeInTheDocument();
    });
  });

  describe('fetchNewExercise', () => {
    it('shows exercise content after successful fetch', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByText(sampleExercise.theme)).toBeInTheDocument();
      });

      expect(screen.getByText(sampleExercise.themeDescription)).toBeInTheDocument();
      expect(screen.getByText(sampleExercise.question)).toBeInTheDocument();
    });

    it('shows the setup SQL schema after fetch', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      render(<SqlTrainer />);
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

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT.*FROM.*WHERE/i)).toBeInTheDocument();
      });
    });

    it('stays in the empty state when generateSqlExercise throws', async () => {
      mockGenerateSqlExercise.mockRejectedValueOnce(new Error('API error'));

      render(<SqlTrainer />);
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
      render(<SqlTrainer />);
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

      render(<SqlTrainer />);
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

  describe('validateAnswer', () => {
    it('"Query ausführen" button is disabled when textarea is empty', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Query ausführen/i })).toBeInTheDocument();
      });

      const runBtn = screen.getByRole('button', { name: /Query ausführen/i });
      expect(runBtn).toBeDisabled();
    });

    it('"Query ausführen" button is enabled after typing in textarea', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), 'SELECT 1;');

      const runBtn = screen.getByRole('button', { name: /Query ausführen/i });
      expect(runBtn).not.toBeDisabled();
    });

    it('shows success feedback when user query matches solution', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      const solutionRows = [{ id: 1, name: 'Router-01', type: 'router' }];
      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })           // setup_sql
        .mockResolvedValueOnce({ rows: solutionRows })  // solution_query
        .mockResolvedValueOnce({ rows: solutionRows }); // user query

      const onCorrect = vi.fn();
      render(<SqlTrainer onCorrect={onCorrect} />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), "SELECT * FROM devices WHERE type = 'router';");
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/Korrekt!/i)).toBeInTheDocument();
      });

      expect(onCorrect).toHaveBeenCalledOnce();
    });

    it('shows error feedback when user query result differs from solution', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Router-01', type: 'router' }] })
        .mockResolvedValueOnce({ rows: [{ id: 2, name: 'Switch-01', type: 'switch' }] });

      const onIncorrect = vi.fn();
      render(<SqlTrainer onIncorrect={onIncorrect} />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), "SELECT * FROM devices WHERE type = 'switch';");
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/Ergebnis weicht ab/i)).toBeInTheDocument();
      });

      expect(onIncorrect).toHaveBeenCalledOnce();
    });

    it('shows SQL error feedback when user query is invalid SQL', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockRejectedValueOnce(new Error('syntax error at or near "SELEXT"'));

      const onIncorrect = vi.fn();
      render(<SqlTrainer onIncorrect={onIncorrect} />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), 'SELEXT * FROM devices;');
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/SQL Fehler/i)).toBeInTheDocument();
      });

      expect(onIncorrect).toHaveBeenCalledOnce();
    });

    it('shows error when solution query itself fails', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error('column "nonexistent" does not exist'));

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), 'SELECT * FROM devices;');
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/Musterlösung enthält einen Fehler/i)).toBeInTheDocument();
      });
    });

    it('shows generic validation error when PGlite throws on construction', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      vi.mocked(PGlite).mockImplementationOnce(function (this: any) {
        throw new Error('PGlite init failed');
      });

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), 'SELECT 1;');
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/Validierungsfehler/i)).toBeInTheDocument();
      });
    });

    it('does not call onCorrect or onIncorrect when solution query fails', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error('solution error'));

      const onCorrect = vi.fn();
      const onIncorrect = vi.fn();
      render(<SqlTrainer onCorrect={onCorrect} onIncorrect={onIncorrect} />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), 'SELECT * FROM devices;');
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/Musterlösung enthält einen Fehler/i)).toBeInTheDocument();
      });

      expect(onCorrect).not.toHaveBeenCalled();
      expect(onIncorrect).not.toHaveBeenCalled();
    });

    it('normalizes column key order when comparing result rows', async () => {
      // sortRows normalizes the key ordering within each row object.
      // A user query returning {type:'router', id:1, name:'Router-01'} (different key order)
      // should match a solution that returns {id:1, name:'Router-01', type:'router'}.
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      const solutionRow = { id: 1, name: 'Router-01', type: 'router' };
      const userRow = { type: 'router', name: 'Router-01', id: 1 }; // same data, different key order
      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [solutionRow] })
        .mockResolvedValueOnce({ rows: [userRow] });

      const onCorrect = vi.fn();
      render(<SqlTrainer onCorrect={onCorrect} />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), "SELECT type, name, id FROM devices WHERE type = 'router';");
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/Korrekt!/i)).toBeInTheDocument();
      });

      expect(onCorrect).toHaveBeenCalledOnce();
    });

    it('treats empty result sets as equal (both queries return no rows)', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const onCorrect = vi.fn();
      render(<SqlTrainer onCorrect={onCorrect} />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), "SELECT * FROM devices WHERE type = 'nonexistent';");
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/Korrekt!/i)).toBeInTheDocument();
      });

      expect(onCorrect).toHaveBeenCalledOnce();
    });

    it('shows the solution query in the "Musterlösung" details element', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));

      await waitFor(() => {
        expect(screen.getByText(/Musterlösung anzeigen/i)).toBeInTheDocument();
      });

      expect(screen.getByText(sampleExercise.solution_query)).toBeInTheDocument();
    });
  });

  describe('feedback display', () => {
    it('renders success feedback with CheckCircle2 icon', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      const rows = [{ id: 1 }];
      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows })
        .mockResolvedValueOnce({ rows });

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
      await waitFor(() => expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument());

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), 'SELECT 1;');
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByTestId('icon-check')).toBeInTheDocument();
      });
    });

    it('renders error feedback with XCircle icon for wrong answer', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 2 }] });

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
      await waitFor(() => expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument());

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), 'SELECT 2;');
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByTestId('icon-xcircle')).toBeInTheDocument();
      });
    });

    it('error message contains the SQL error detail from the exception', async () => {
      mockGenerateSqlExercise.mockResolvedValueOnce(sampleExercise);

      mockQueryFn
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockRejectedValueOnce(new Error('relation "unknown_table" does not exist'));

      render(<SqlTrainer />);
      await userEvent.click(screen.getByRole('button', { name: /Neue Übung/i }));
      await waitFor(() => expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument());

      await userEvent.type(screen.getByPlaceholderText(/SELECT/i), 'SELECT * FROM unknown_table;');
      await userEvent.click(screen.getByRole('button', { name: /Query ausführen/i }));

      await waitFor(() => {
        expect(screen.getByText(/relation "unknown_table" does not exist/i)).toBeInTheDocument();
      });
    });
  });

  describe('SqlTrainer props', () => {
    it('renders without onCorrect/onIncorrect props (optional)', () => {
      expect(() => render(<SqlTrainer />)).not.toThrow();
    });

    it('renders with both callback props', () => {
      const onCorrect = vi.fn();
      const onIncorrect = vi.fn();
      expect(() => render(<SqlTrainer onCorrect={onCorrect} onIncorrect={onIncorrect} />)).not.toThrow();
    });
  });
});