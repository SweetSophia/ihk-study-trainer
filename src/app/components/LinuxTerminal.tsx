'use client';

import { useRef, useEffect, useId, type KeyboardEvent } from 'react';
import { Terminal } from 'lucide-react';

interface LinuxTerminalProps {
  autoFocus?: boolean;
  /** Whether the terminal input is currently disabled (after checking answer) */
  disabled: boolean;
  /** Current input value */
  value: string;
  /** Callback when input changes */
  onChange: (value: string) => void;
  /** Callback when Enter is pressed - passes current input value directly to avoid stale state */
  onSubmit: (inputValue: string) => void;
  /** Whether the answer was correct (null = not yet checked) */
  isCorrect: boolean | null;
  /** Whether answer has been checked */
  checked: boolean;
  /** The correct answer to show after checking */
  correctAnswer?: string;
  /** Curated recognized forms from the same configuration used by the validator. */
  acceptedAnswers?: string[];
  /** Explanation of correctAnswer, not of every accepted tool. */
  answerExplanation?: string;
}

export default function LinuxTerminal({
  disabled,
  autoFocus = true,
  value,
  onChange,
  onSubmit,
  isCorrect,
  checked,
  correctAnswer,
  acceptedAnswers,
  answerExplanation,
}: LinuxTerminalProps) {
  const instructionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const accepted = acceptedAnswers?.length ? acceptedAnswers : correctAnswer ? [correctAnswer] : [];
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-focus the hidden input when terminal is clicked
  useEffect(() => {
    if (!disabled && autoFocus) {
      inputRef.current?.focus();
    }
  }, [disabled, autoFocus]);

  // Scroll to bottom on new content
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [value, checked]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && value.trim()) {
      onSubmit(value.trim());
    }
  };

  const handleTerminalClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  // Determine terminal color based on state
  const promptColor = checked
    ? isCorrect
      ? 'text-success'
      : 'text-danger'
    : 'text-success';

  const inputColor = checked
    ? isCorrect
      ? 'text-success'
      : 'text-danger'
    : 'text-warning';

  return (
    <div className="w-full">
      {/* Terminal window chrome */}
      <div
        className={`rounded-lg overflow-hidden border focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-canvas ${
          checked
            ? isCorrect
              ? 'border-success'
              : 'border-danger'
            : 'border-line'
        }`}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-subtle border-b border-line">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-danger-soft" />
            <div className="w-3 h-3 rounded-full bg-warning-soft" />
            <div className="w-3 h-3 rounded-full bg-success-soft" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Terminal className="w-3.5 h-3.5 text-muted" />
            <span className="text-xs text-muted font-mono">user@lernmaschine: ~</span>
          </div>
        </div>

        {/* Terminal body */}
        <div
          ref={terminalRef}
          onClick={handleTerminalClick}
          className="bg-canvas px-4 py-3 font-mono text-sm leading-relaxed cursor-text min-h-[140px]"
        >
          {/* Welcome header */}
          <div className="text-success text-xs mb-3">
            <div>Linux-Zuordnungsübung – keine Befehlsausführung</div>
          </div>

          {/* Command prompt with input */}
          <div className="flex items-center">
            <span className={`whitespace-nowrap ${promptColor}`}>
              user@lernmaschine:~$&nbsp;
            </span>
            {checked ? (
              // Show the entered command after checking
              <span className={`${inputColor} break-all`}>
                {value || correctAnswer || ''}
              </span>
            ) : (
              // Show the typed text with a blinking cursor
              <span className={`${inputColor} break-all relative`}>
                {value}
                <span className="inline-block w-2 h-4 bg-warning animate-pulse align-text-bottom ml-px" />
              </span>
            )}
          </div>

          {/* The parent suppresses its generic verdict here: one live region,
              with the same curated forms the real validator recognizes. */}
          <div role="status" aria-label="Linux-Antwort" aria-atomic="true" className="text-xs">
            {checked && (
              <div className="mt-3 space-y-2 text-ink">
                <p className={isCorrect ? 'text-success' : 'text-danger'}>
                  {isCorrect ? '✓ Richtig! Deine Antwort wird in dieser Aufgabe akzeptiert.' : '✗ Diese Antwort wurde in dieser Aufgabe nicht akzeptiert.'}
                </p>
                {!isCorrect && <p>Diese Übung vergleicht Befehlsformen, keine vollständigen Kommandozeilen. Deine Antwort muss einer der unten aufgeführten Formen entsprechen; Groß-/Kleinschreibung und Leerraum werden dabei normalisiert.</p>}
                {accepted.length > 0 && <div>
                  <p>Hier akzeptierte Antworten:</p>
                  <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {accepted.map(form => <li key={form}><code className="break-all text-accent">{form}</code></li>)}
                  </ul>
                </div>}
                {correctAnswer && answerExplanation && <div className="border-t border-line pt-2">
                  <p className="font-semibold">Erklärung zum Beispiel {correctAnswer}:</p>
                  <p className="mt-1">{answerExplanation}</p>
                </div>}
              </div>
            )}
          </div>
        </div>

        {/* Hidden real input for keyboard capture */}
        {!checked && (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="sr-only"
            aria-label="Linux-Befehl eingeben"
            aria-describedby={instructionId}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        )}
      </div>

      {/* Instruction hint */}
      {!checked && (
        <p id={instructionId} className="text-xs text-muted mt-2 pl-1">
          Gesucht ist der Befehlsname (bei Unterbefehlen: Befehl + Unterbefehl) oder der Operator, ohne zusätzliche Optionen oder Ziele. Es wird nichts ausgeführt. Diese Zuordnungsübung ignoriert Groß-/Kleinschreibung; eine echte Shell nicht. Drücke Enter zum Prüfen.
        </p>
      )}
    </div>
  );
}
