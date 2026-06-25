import type { HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Question } from '../../types';

// Mock framer-motion — pass through DOM elements with their props so
// AnimatePresence + motion.div don't fight the test environment.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
    button: ({
      children,
      className,
      onClick,
      ...rest
    }: ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button className={className} onClick={onClick} {...rest}>
        {children}
      </button>
    ),
    p: ({ children, className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
      <p className={className} {...rest}>
        {children}
      </p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react — render tiny stand-ins.
vi.mock('lucide-react', () => ({
  Check: () => <svg data-testid="icon-check" />,
  X: () => <svg data-testid="icon-x" />,
  Lightbulb: () => <svg data-testid="icon-lightbulb" />,
  ArrowRight: () => <svg data-testid="icon-arrow-right" />,
  RotateCcw: () => <svg data-testid="icon-rotatecc" />,
  Sparkles: () => <svg data-testid="icon-sparkles" />,
  Keyboard: () => <svg data-testid="icon-keyboard" />,
}));

// Mock the Linux terminal — we don't want to exercise its full keyboard
// handling in StudyCard tests; that lives in its own suite.
vi.mock('../LinuxTerminal', () => ({
  default: () => <div data-testid="linux-terminal" />,
}));

import StudyCard from '../StudyCard';

const noCheckAnswer = vi.fn().mockReturnValue(true);
const noNextQuestion = vi.fn();

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'test-q-1',
    theme: 'TestTheme',
    module: 'imageCalc',
    questionText: 'Wie groß ist das Bild?',
    expectedAnswers: { width: 1024, height: 768 },
    solutionSteps: [
      'Schritt 1: Multipliziere Breite × Höhe.',
      'Schritt 2: Rechne Byte in KB um.',
      'Schritt 3: Das Ergebnis lautet 768 KB.',
    ],
    difficulty: 'easy',
    ...overrides,
  };
}

describe('StudyCard – welcome screen (no question)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows the keyboard shortcut hints on the welcome screen', () => {
    render(
      <StudyCard
        question={null}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    expect(screen.getByText(/Tastenkürzel/)).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
  });

  it('shows the dismissible "Was ist neu?" pill on first visit', () => {
    render(
      <StudyCard
        question={null}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    expect(screen.getByText('Was ist neu?')).toBeInTheDocument();
  });

  it('hides the pill after dismissing it and persists the choice', async () => {
    render(
      <StudyCard
        question={null}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    const dismissBtn = screen.getByRole('button', { name: 'Hinweis schließen' });
    await userEvent.click(dismissBtn);

    expect(screen.queryByText('Was ist neu?')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('ihk_changelog_dismissed')).toBe('1');
  });

  it('hides the pill by default once localStorage marks it dismissed', () => {
    window.localStorage.setItem('ihk_changelog_dismissed', '1');
    render(
      <StudyCard
        question={null}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    expect(screen.queryByText('Was ist neu?')).not.toBeInTheDocument();
    // And a re-open link is offered.
    expect(screen.getByText(/wieder anzeigen/)).toBeInTheDocument();
  });

  it('expands the changelog when the pill is clicked', async () => {
    render(
      <StudyCard
        question={null}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    await userEvent.click(screen.getByText('Was ist neu?'));
    // Should now reveal the most recent changelog entry.
    expect(screen.getByText(/Hexa \/ Binaer Aufgaben/)).toBeInTheDocument();
  });
});

describe('StudyCard – active question', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders the feedback region with aria-live="polite"', async () => {
    const question = makeQuestion();
    render(
      <StudyCard
        question={question}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    // Fill both required answer fields so the check button enables.
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '1024' } });
    fireEvent.change(inputs[1], { target: { value: '768' } });

    const checkBtn = screen.getByRole('button', { name: /Antwort prüfen/ });
    await userEvent.click(checkBtn);

    const feedback = await screen.findByText(/Richtig!/);
    // The closest ancestor that carries the aria-live attr is the region.
    const region = feedback.closest('[aria-live]');
    expect(region).not.toBeNull();
    expect(region!.getAttribute('aria-live')).toBe('polite');
  });

  it('Enter triggers check when all answers are filled', async () => {
    const question = makeQuestion({
      expectedAnswers: { width: 1024, height: 768 },
    });
    const onCheckAnswer = vi.fn().mockReturnValue(true);
    render(
      <StudyCard
        question={question}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    // Fill both text inputs.
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '1024' } });
    fireEvent.change(inputs[1], { target: { value: '768' } });

    // Click somewhere neutral so the test doesn't fire Enter on the input.
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onCheckAnswer).toHaveBeenCalled();
  });

  it('N triggers next question only after answer has been checked', async () => {
    const question = makeQuestion();
    const onNextQuestion = vi.fn();
    const onCheckAnswer = vi.fn().mockReturnValue(true);
    render(
      <StudyCard
        question={question}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={onNextQuestion}
      />,
    );

    // Before answering, N should NOT advance.
    fireEvent.keyDown(window, { key: 'n' });
    expect(onNextQuestion).not.toHaveBeenCalled();

    // Answer first.
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '1024' } });
    fireEvent.change(inputs[1], { target: { value: '768' } });
    fireEvent.click(screen.getByRole('button', { name: /Antwort prüfen/ }));

    // Now N advances.
    fireEvent.keyDown(window, { key: 'n' });
    expect(onNextQuestion).toHaveBeenCalled();
  });

  it('N is NOT hijacked while the user is typing in a text input', async () => {
    const question = makeQuestion();
    const onNextQuestion = vi.fn();
    const onCheckAnswer = vi.fn().mockReturnValue(true);
    render(
      <StudyCard
        question={question}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={onNextQuestion}
      />,
    );
    // Fill answers so we can check.
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '1024' } });
    fireEvent.change(inputs[1], { target: { value: '768' } });
    fireEvent.click(screen.getByRole('button', { name: /Antwort prüfen/ }));

    // Focus a text input and press N — should NOT trigger next.
    inputs[0].focus();
    fireEvent.keyDown(inputs[0], { key: 'n' });
    expect(onNextQuestion).not.toHaveBeenCalled();
  });
});

describe('StudyCard – stepped solution reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows step 1 immediately and reveals others on demand', async () => {
    const question = makeQuestion();
    render(
      <StudyCard
        question={question}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    // Open the solution panel.
    await userEvent.click(screen.getByRole('button', { name: /Lösung anzeigen/ }));

    // Step 1 is visible by default.
    expect(screen.getByText(/Schritt 1: Multipliziere/)).toBeInTheDocument();
    // Steps 2 and 3 are obscured.
    expect(screen.getByText(/Schritt 2 – noch nicht aufgedeckt/)).toBeInTheDocument();
    expect(screen.getByText(/Schritt 3 – noch nicht aufgedeckt/)).toBeInTheDocument();

    // Reveal next.
    await userEvent.click(screen.getByRole('button', { name: /Nächster Schritt/ }));
    expect(screen.getByText(/Schritt 2: Rechne Byte/)).toBeInTheDocument();
    expect(screen.getByText(/Schritt 3 – noch nicht aufgedeckt/)).toBeInTheDocument();

    // Reveal last.
    await userEvent.click(screen.getByRole('button', { name: /Nächster Schritt/ }));
    expect(screen.getByText(/Schritt 3: Das Ergebnis/)).toBeInTheDocument();
    // Counter shows 3/3 and the "Alle Schritte angezeigt" hint.
    expect(screen.getByText(/3 \/ 3/)).toBeInTheDocument();
    expect(screen.getByText(/Alle Schritte angezeigt/)).toBeInTheDocument();
  });

  it('"Alle anzeigen" reveals every step at once', async () => {
    const question = makeQuestion();
    render(
      <StudyCard
        question={question}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Lösung anzeigen/ }));
    await userEvent.click(screen.getByRole('button', { name: /Alle anzeigen/ }));
    expect(screen.getByText(/Schritt 2: Rechne Byte/)).toBeInTheDocument();
    expect(screen.getByText(/Schritt 3: Das Ergebnis/)).toBeInTheDocument();
  });

  it('keeps the expected answers visible regardless of step reveal state', async () => {
    const question = makeQuestion();
    render(
      <StudyCard
        question={question}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Lösung anzeigen/ }));
    // Expected answers are always shown when the panel is open.
    const labelEl = screen.getByText(/Erwartete Antworten/);
    // Walk up to the wrapper div that contains both the label and the
    // value list (its grandparent is the bordered panel).
    const answersPanel = labelEl.parentElement!.parentElement!;
    expect(within(answersPanel).getByText('1024')).toBeInTheDocument();
    expect(within(answersPanel).getByText('768')).toBeInTheDocument();
  });
});
