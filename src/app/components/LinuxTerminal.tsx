'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

interface LinuxTerminalProps {
  /** Whether the terminal input is currently disabled (after checking answer) */
  disabled: boolean;
  /** Current input value */
  value: string;
  /** Callback when input changes */
  onChange: (value: string) => void;
  /** Callback when Enter is pressed */
  onSubmit: () => void;
  /** Whether the answer was correct (null = not yet checked) */
  isCorrect: boolean | null;
  /** Whether answer has been checked */
  checked: boolean;
  /** The correct answer to show after checking */
  correctAnswer?: string;
}

export default function LinuxTerminal({
  disabled,
  value,
  onChange,
  onSubmit,
  isCorrect,
  checked,
  correctAnswer,
}: LinuxTerminalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-focus the hidden input when terminal is clicked
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  // Scroll to bottom on new content
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [value, checked]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && value.trim()) {
      onSubmit();
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
      ? 'text-green-400'
      : 'text-red-400'
    : 'text-green-400';

  const inputColor = checked
    ? isCorrect
      ? 'text-green-300'
      : 'text-red-300'
    : 'text-amber-300';

  return (
    <div className="w-full">
      {/* Terminal window chrome */}
      <div
        className={`rounded-lg overflow-hidden border ${
          checked
            ? isCorrect
              ? 'border-green-500/50'
              : 'border-red-500/50'
            : 'border-slate-700'
        }`}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500 font-mono">user@lernmaschine: ~</span>
          </div>
        </div>

        {/* Terminal body */}
        <div
          ref={terminalRef}
          onClick={handleTerminalClick}
          className="bg-gray-950 px-4 py-3 font-mono text-sm leading-relaxed cursor-text min-h-[140px]"
        >
          {/* Welcome header */}
          <div className="text-green-600/60 text-xs mb-3">
            <div>Welcome to IHK-Study-Trainer OS (GNU/Linux 6.8.0-106-generic x86_64)</div>
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
                <span className="inline-block w-2 h-4 bg-amber-400/80 animate-pulse align-text-bottom ml-px" />
              </span>
            )}
          </div>

          {/* After checking, show result */}
          {checked && (
            <div className={`mt-3 text-xs ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? (
                <div>✓ Richtig! Befehl akzeptiert.</div>
              ) : (
                <>
                  <div>✗ Falsch. Der richtige Befehl lautet:</div>
                  <div className="text-green-300 mt-1">
                    user@lernmaschine:~$ {correctAnswer}
                  </div>
                </>
              )}
            </div>
          )}
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
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        )}
      </div>

      {/* Instruction hint */}
      {!checked && (
        <p className="text-xs text-slate-500 mt-2 pl-1">
          Tippe den Befehl ein und drücke Enter zum Prüfen.
        </p>
      )}
    </div>
  );
}
