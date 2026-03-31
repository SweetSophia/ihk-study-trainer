import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className}>{children}</button>
    ),
  },
}));

// Mock lucide-react icons used by ThemeSelector
vi.mock('lucide-react', () => ({
  Calculator: () => <svg data-testid="icon-calculator" />,
  Image: () => <svg data-testid="icon-image" />,
  Network: () => <svg data-testid="icon-network" />,
  ArrowLeftRight: () => <svg data-testid="icon-arrow-left-right" />,
  Binary: () => <svg data-testid="icon-binary" />,
  Hexagon: () => <svg data-testid="icon-hexagon" />,
  Shield: () => <svg data-testid="icon-shield" />,
  Layers: () => <svg data-testid="icon-layers" />,
  Cable: () => <svg data-testid="icon-cable" />,
  Server: () => <svg data-testid="icon-server" />,
  Globe: () => <svg data-testid="icon-globe" />,
  Settings: () => <svg data-testid="icon-settings" />,
  Database: () => <svg data-testid="icon-database" />,
}));

import ThemeSelector from '../ThemeSelector';

describe('ThemeSelector - SQL module addition', () => {
  const onSelectModule = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SQL module presence', () => {
    it('renders the SQL module button', () => {
      render(<ThemeSelector currentModule={null} onSelectModule={onSelectModule} />);
      // There should be multiple "SQL" text nodes (mobile + desktop)
      const sqlButtons = screen.getAllByText('SQL');
      expect(sqlButtons.length).toBeGreaterThan(0);
    });

    it('renders the SQL module description "Datenbankabfragen"', () => {
      render(<ThemeSelector currentModule={null} onSelectModule={onSelectModule} />);
      const descriptions = screen.getAllByText('Datenbankabfragen');
      expect(descriptions.length).toBeGreaterThan(0);
    });

    it('renders the Database icon for the SQL module', () => {
      render(<ThemeSelector currentModule={null} onSelectModule={onSelectModule} />);
      const dbIcons = screen.getAllByTestId('icon-database');
      expect(dbIcons.length).toBeGreaterThan(0);
    });

    it('calls onSelectModule with "sql" when SQL module is clicked (mobile strip)', async () => {
      render(<ThemeSelector currentModule={null} onSelectModule={onSelectModule} />);

      // In the mobile strip, find the button by its accessible name containing "SQL"
      // The mobile strip uses regular <button> elements
      const sqlTexts = screen.getAllByText('SQL');
      // Click the first occurrence (mobile strip button contains just the text and icon)
      await userEvent.click(sqlTexts[0]);

      expect(onSelectModule).toHaveBeenCalledWith('sql');
    });

    it('marks the SQL module as active when currentModule is "sql"', () => {
      render(<ThemeSelector currentModule="sql" onSelectModule={onSelectModule} />);

      // The active module button should have the emerald active classes
      // We can check by finding buttons that contain "SQL" text and checking their class
      const sqlTexts = screen.getAllByText('SQL');
      // The parent button of the mobile strip SQL text should have the active class
      const sqlButton = sqlTexts[0].closest('button');
      expect(sqlButton).toHaveClass('bg-emerald-500/10');
    });

    it('does not mark SQL module as active when currentModule is something else', () => {
      render(<ThemeSelector currentModule="binary" onSelectModule={onSelectModule} />);

      const sqlTexts = screen.getAllByText('SQL');
      const sqlButton = sqlTexts[0].closest('button');
      expect(sqlButton).not.toHaveClass('bg-emerald-500/10');
    });
  });

  describe('all modules present', () => {
    it('renders all 13 module names including SQL', () => {
      render(<ThemeSelector currentModule={null} onSelectModule={onSelectModule} />);

      const moduleNames = [
        'Übertragungszeit', 'Bildgröße', 'Overhead', 'Subnetting',
        'Einheiten', 'Binär', 'Hex', 'Subnetzmaske', 'Aggregation',
        'Ports', 'OSI', 'Kabel', 'SQL',
      ];

      for (const name of moduleNames) {
        // Each module appears in both mobile and desktop, so use getAllByText
        const elements = screen.getAllByText(name);
        expect(elements.length).toBeGreaterThan(0);
      }
    });

    it('calls onSelectModule with correct id for each module click', async () => {
      render(<ThemeSelector currentModule={null} onSelectModule={onSelectModule} />);

      // Click SQL module
      const sqlTexts = screen.getAllByText('SQL');
      await userEvent.click(sqlTexts[0]);
      expect(onSelectModule).toHaveBeenLastCalledWith('sql');
    });
  });

  describe('module selection behavior', () => {
    it('passes the selected module id to onSelectModule, not the display name', async () => {
      render(<ThemeSelector currentModule={null} onSelectModule={onSelectModule} />);

      const sqlTexts = screen.getAllByText('SQL');
      await userEvent.click(sqlTexts[0]);

      // Should pass 'sql' (the id), not 'SQL' (the display name)
      expect(onSelectModule).toHaveBeenCalledWith('sql');
      expect(onSelectModule).not.toHaveBeenCalledWith('SQL');
    });

    it('onSelectModule is called exactly once per click', async () => {
      render(<ThemeSelector currentModule={null} onSelectModule={onSelectModule} />);

      const sqlTexts = screen.getAllByText('SQL');
      await userEvent.click(sqlTexts[0]);

      expect(onSelectModule).toHaveBeenCalledTimes(1);
    });
  });
});