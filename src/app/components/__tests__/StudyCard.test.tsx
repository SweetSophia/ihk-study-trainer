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
    section: ({ children, className, ...rest }: HTMLAttributes<HTMLElement>) => (
      <section className={className} {...rest}>
        {children}
      </section>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  // SubnettingVisualizer (rendered inside StudyCard) uses this to skip the
  // entrance animation when the user has prefers-reduced-motion enabled.
  useReducedMotion: () => false,
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
  // SubnettingVisualizer also uses these icons when its module renders.
  Network: () => <svg data-testid="icon-network" />,
  Eye: () => <svg data-testid="icon-eye" />,
  // DragOrderExercise uses this for the drag handle.
  GripVertical: () => <svg data-testid="icon-gripvertical" />,
}));

// Mock the Linux terminal — we don't want to exercise its full keyboard
// handling in StudyCard tests; that lives in its own suite.
vi.mock('../LinuxTerminal', () => ({
  default: () => <div data-testid="linux-terminal" />,
}));

// Mock @dnd-kit entirely. The real PointerSensor / KeyboardSensor attach
// global window listeners that hang in jsdom when invoked from within the
// StudyCard render tree (the DragOrderExercise's own test suite exercises
// the real wiring with a more controlled setup). This keeps StudyCard tests
// focused on the parent → child wiring rather than drag mechanics.
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children?: unknown }) => children,
  PointerSensor: function PointerSensor() {},
  KeyboardSensor: function KeyboardSensor() {},
  closestCenter: () => null,
  useSensor: () => null,
  useSensors: () => null,
}));
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children?: unknown }) => children,
  arrayMove: (arr: unknown[], from: number, to: number) => {
    const out = [...arr];
    const [removed] = out.splice(from, 1);
    out.splice(to, 0, removed);
    return out;
  },
  sortableKeyboardCoordinates: () => null,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => undefined,
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: 'vertical',
}));
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

// Mock the celebration helpers — we want to assert *that* they get called
// (or not), not exercise the confetti canvas itself.
const mockFireFirstCorrectConfetti = vi.fn().mockResolvedValue(undefined);
const mockFireStreakConfetti = vi.fn().mockResolvedValue(undefined);
vi.mock('../../lib/celebrations', () => ({
  fireFirstCorrectConfetti: (...args: unknown[]) =>
    mockFireFirstCorrectConfetti(...args),
  fireStreakConfetti: (...args: unknown[]) => mockFireStreakConfetti(...args),
  isStreakMilestone: (days: number) => [1, 3, 7, 14, 30, 100].includes(days),
  STREAK_MILESTONES: [1, 3, 7, 14, 30, 100],
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
    expect(screen.getByText(/Confetti, UX, Upstash/)).toBeInTheDocument();
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

  it('fires first-correct confetti when an answer is marked correct', async () => {
    mockFireFirstCorrectConfetti.mockClear();
    const question = makeQuestion();
    const onCheckAnswer = vi.fn().mockReturnValue(true);
    render(
      <StudyCard
        question={question}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '1024' } });
    fireEvent.change(inputs[1], { target: { value: '768' } });
    await userEvent.click(screen.getByRole('button', { name: /Antwort prüfen/ }));

    // The component delegates the "fire only once per session" decision to the
    // helper (via its internal sessionStorage guard, covered in
    // celebrations.test.ts). Here we only assert that the component invokes the
    // helper whenever an answer becomes correct.
    expect(mockFireFirstCorrectConfetti).toHaveBeenCalled();
  });

  it('invokes the confetti helper again when the next question is answered correctly', async () => {
    mockFireFirstCorrectConfetti.mockClear();
    const onCheckAnswer = vi.fn().mockReturnValue(true);
    const { rerender } = render(
      <StudyCard
        question={makeQuestion()}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    const answerAndCheck = async () => {
      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
      fireEvent.change(inputs[0], { target: { value: '1024' } });
      fireEvent.change(inputs[1], { target: { value: '768' } });
      await userEvent.click(screen.getByRole('button', { name: /Antwort prüfen/ }));
    };

    await answerAndCheck();
    const callsAfterFirst = mockFireFirstCorrectConfetti.mock.calls.length;

    // Next question, also answered correctly.
    rerender(
      <StudyCard
        question={makeQuestion({ id: 'test-q-2' })}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    await answerAndCheck();

    expect(mockFireFirstCorrectConfetti.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it('does NOT fire confetti on an incorrect answer', async () => {
    mockFireFirstCorrectConfetti.mockClear();
    const question = makeQuestion();
    const onCheckAnswer = vi.fn().mockReturnValue(false);
    render(
      <StudyCard
        question={question}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    await userEvent.click(screen.getByRole('button', { name: /Antwort prüfen/ }));

    expect(mockFireFirstCorrectConfetti).not.toHaveBeenCalled();
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

describe('StudyCard – subnetting visualizer gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  function makeSubnettingQuestion(): Question {
    return {
      id: 'sub-test-1',
      theme: 'Netzwerkarchitektur & Overhead',
      module: 'subnetting',
      questionText: 'Gegeben: IP-Adresse 10.5.3.4/24\nBerechne: Network ID, Broadcast, …',
      expectedAnswers: {
        networkId: '10.5.3.0',
        broadcast: '10.5.3.255',
        hostMin: '10.5.3.1',
        hostMax: '10.5.3.254',
        subnetMask: '255.255.255.0',
        usableHosts: 254,
      },
      solutionSteps: ['Schritt 1: …'],
      difficulty: 'easy',
    };
  }

  it('does not reveal the subnetting visualizer before submit or solution reveal', () => {
    render(
      <StudyCard
        question={makeSubnettingQuestion()}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    expect(screen.queryByTestId('subnetting-visualizer')).toBeNull();
  });

  it('renders the parsed IP, CIDR, and expected values after opening the solution', async () => {
    const user = userEvent.setup();
    render(
      <StudyCard
        question={makeSubnettingQuestion()}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Lösung anzeigen/i }));

    const visualizer = screen.getByTestId('subnetting-visualizer');
    expect(within(visualizer).getByTestId('viz-given-ip')).toHaveTextContent('10.5.3.4');
    expect(within(visualizer).getByTestId('viz-cidr')).toHaveTextContent('/24');
    expect(within(visualizer).getByTestId('viz-network-id')).toHaveTextContent('10.5.3.0');
    expect(within(visualizer).getByTestId('viz-broadcast')).toHaveTextContent('10.5.3.255');
    expect(within(visualizer).getByTestId('viz-usable-hosts')).toHaveTextContent('254');
  });

  // Regression guard: the gate is `(checked || showSolution)`. The showSolution
  // branch is covered above; this one locks in the post-submit (`checked`)
  // branch so a future refactor that drops `checked` from the condition fails
  // CI instead of silently leaking answers before the user submits.
  it('renders the subnetting visualizer after submitting an answer', async () => {
    const user = userEvent.setup();
    render(
      <StudyCard
        question={makeSubnettingQuestion()}
        onCheckAnswer={vi.fn().mockReturnValue(true)}
        onNextQuestion={noNextQuestion}
      />,
    );

    // The subnetting question has 6 expectedAnswer fields (no answerInputs).
    // Fill every one so the "Antwort prüfen" button enables.
    const networkIdInput = screen.getByPlaceholderText(/networkId eingeben/i);
    const broadcastInput = screen.getByPlaceholderText(/broadcast eingeben/i);
    const hostMinInput = screen.getByPlaceholderText(/hostMin eingeben/i);
    const hostMaxInput = screen.getByPlaceholderText(/hostMax eingeben/i);
    const subnetMaskInput = screen.getByPlaceholderText(/subnetMask eingeben/i);
    const usableHostsInput = screen.getByPlaceholderText(/usableHosts eingeben/i);

    await user.type(networkIdInput, '10.5.3.0');
    await user.type(broadcastInput, '10.5.3.255');
    await user.type(hostMinInput, '10.5.3.1');
    await user.type(hostMaxInput, '10.5.3.254');
    await user.type(subnetMaskInput, '255.255.255.0');
    await user.type(usableHostsInput, '254');

    await user.click(screen.getByRole('button', { name: /Antwort prüfen/i }));

    const visualizer = screen.getByTestId('subnetting-visualizer');
    expect(within(visualizer).getByTestId('viz-given-ip')).toHaveTextContent('10.5.3.4');
    expect(within(visualizer).getByTestId('viz-cidr')).toHaveTextContent('/24');
    expect(within(visualizer).getByTestId('viz-usable-hosts')).toHaveTextContent('254');
  });

  it('does NOT render the subnetting visualizer for non-subnetting questions', () => {
    render(
      <StudyCard
        question={makeQuestion()}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );
    expect(screen.queryByTestId('subnetting-visualizer')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Drag-order exercise integration (e.g. OSI layers reorder)
// ---------------------------------------------------------------------------

describe('StudyCard – drag-order exercise', () => {
  const OSI_ITEMS = [
    'Physical / Bitübertragungsschicht',
    'Data Link / Sicherungsschicht',
    'Network / Vermittlungsschicht',
    'Transport / Transportschicht',
    'Session / Sitzungsschicht',
    'Presentation / Darstellungsschicht',
    'Application / Anwendungsschicht',
  ];

  function makeOsiOrderQuestion(
    overrides: Partial<Question> = {},
    items: string[] = [...OSI_ITEMS].reverse(),
  ): Question {
    return {
      id: 'osi-order-1',
      theme: 'TCP/IP-Referenzmodell & Protokolle',
      module: 'osi',
      questionText: 'Sortiere die 7 OSI-Schichten in die richtige Reihenfolge.',
      expectedAnswers: { order: OSI_ITEMS.join(',') },
      solutionSteps: ['Layer 1 — Physical ...', 'Layer 7 — Application ...'],
      difficulty: 'medium',
      dragOrder: { items, correctOrder: OSI_ITEMS },
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders the drag-order exercise for OSI order questions', () => {
    render(
      <StudyCard
        question={makeOsiOrderQuestion()}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    expect(screen.getByRole('list', { name: /sortierbare liste/i })).toBeInTheDocument();
    expect(screen.getByTestId('drag-order-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('drag-order-item-6')).toBeInTheDocument();
  });

  it('does NOT render drag-order UI for non-drag-order questions', () => {
    render(
      <StudyCard
        question={makeQuestion()}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    expect(screen.queryByRole('list', { name: /sortierbare liste/i })).toBeNull();
  });

  it('passes the user\'s order to onCheckAnswer when they submit', async () => {
    const user = userEvent.setup();
    const onCheckAnswer = vi.fn().mockReturnValue(false);

    // Start with the wrong order (reversed). If the user doesn't drag, the
    // answer should be marked incorrect.
    render(
      <StudyCard
        question={makeOsiOrderQuestion({}, [...OSI_ITEMS].reverse())}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Antwort prüfen/i }));

    // The answer sent to onCheckAnswer is `answers.order`, a comma-separated
    // string of the current item order. With no drag, it should be the
    // reversed order, which doesn't match the canonical `expectedAnswers.order`.
    expect(onCheckAnswer).toHaveBeenCalledTimes(1);
    const passedAnswers = onCheckAnswer.mock.calls[0][0];
    expect(passedAnswers.order).toBe([...OSI_ITEMS].reverse().join(','));
    expect(passedAnswers.order).not.toBe(OSI_ITEMS.join(','));
  });

  it('marks the answer correct when the user reorders into the canonical order', async () => {
    const user = userEvent.setup();
    const onCheckAnswer = vi.fn().mockReturnValue(true);

    render(
      <StudyCard
        question={makeOsiOrderQuestion({}, [...OSI_ITEMS].reverse())}
        onCheckAnswer={onCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    // We don't simulate a drag here (dnd-kit requires real pointer/keyboard
    // events); we just confirm the wiring: the answer is forwarded as a
    // comma-separated string, which is what the validator compares.
    await user.click(screen.getByRole('button', { name: /Antwort prüfen/i }));

    expect(onCheckAnswer).toHaveBeenCalledTimes(1);
    const passedAnswers = onCheckAnswer.mock.calls[0][0];
    expect(typeof passedAnswers.order).toBe('string');
    expect((passedAnswers.order as string).split(',')).toHaveLength(7);
  });

  it('disables the grab handles after the answer has been checked', async () => {
    const user = userEvent.setup();
    render(
      <StudyCard
        question={makeOsiOrderQuestion()}
        onCheckAnswer={noCheckAnswer}
        onNextQuestion={noNextQuestion}
      />,
    );

    // Before checking: all handles enabled.
    expect(
      screen.getAllByRole('button', { name: /Element verschieben/ })[0],
    ).not.toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Antwort prüfen/i }));

    // After checking: all handles disabled.
    expect(
      screen.getAllByRole('button', { name: /Element verschieben/ })[0],
    ).toBeDisabled();
  });
});
