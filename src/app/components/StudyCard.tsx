'use client';

import { useEffect, useRef, useState, type MutableRefObject, type Ref } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sparkles,
  X as CloseIcon,
  Keyboard,
} from 'lucide-react';
import { Question } from '../types';
import { fireFirstCorrectConfetti } from '../lib/celebrations';
import { CHANGELOG_ENTRIES } from '../lib/changelog';
import LinuxTerminal from './LinuxTerminal';

interface StudyCardProps {
  question: Question | null;
  onCheckAnswer: (answers: Record<string, string>) => boolean;
  onNextQuestion: () => void;
}

/** localStorage key for the dismissible "Was ist neu?" pill. */
const CHANGELOG_DISMISSED_KEY = 'ihk_changelog_dismissed';

function readChangelogDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CHANGELOG_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeChangelogDismissed(value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(CHANGELOG_DISMISSED_KEY, '1');
    } else {
      window.localStorage.removeItem(CHANGELOG_DISMISSED_KEY);
    }
  } catch {
    // localStorage may be disabled (private mode, quota) — fail silently.
  }
}

/**
 * Hook that returns a ref to attach to the first focusable answer input.
 * Auto-focuses the element when the question changes (not just on mount,
 * because React re-uses DOM nodes across same-keyed renders, so a plain
 * callback ref wouldn't re-fire when `questionId` flips).
 */
function useAutoFocusFirst<T extends HTMLElement>(
  triggerKey: string | null | undefined,
  enabled: boolean,
  isDisabled: boolean,
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!enabled) return;
    if (isDisabled) return;
    // Defer one frame so the new input has time to mount and the previous
    // question's disabled state doesn't block .focus() with a warning.
    const handle = requestAnimationFrame(() => {
      ref.current?.focus({ preventScroll: false });
    });
    return () => cancelAnimationFrame(handle);
  }, [triggerKey, enabled, isDisabled]);
  return ref;
}

export default function StudyCard({ question, onCheckAnswer, onNextQuestion }: StudyCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  // Welcome-state changelog
  const [changelogDismissed, setChangelogDismissed] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  // Stepped solution reveal — start with step 1 visible.
  const [revealedSteps, setRevealedSteps] = useState(1);

  // Read dismissal state once on mount (client component — window is safe).
  useEffect(() => {
    setChangelogDismissed(readChangelogDismissed());
  }, []);

  // Celebrate the first correct answer of the session. The "once per session"
  // guard lives inside `fireFirstCorrectConfetti` (sessionStorage) so a refresh
  // within the same tab doesn't double-trigger.
  useEffect(() => {
    if (isCorrect === true) {
      void fireFirstCorrectConfetti();
    }
  }, [isCorrect]);

  // Reset the transient answer state whenever the question changes so the
  // card looks fresh and the previous feedback doesn't bleed through.
  const questionId = question?.id ?? null;
  useEffect(() => {
    setAnswers({});
    setShowSolution(false);
    setIsCorrect(null);
    setChecked(false);
    setRevealedSteps(1);
  }, [questionId]);

  // Derived values used by both the active-question UI and the keyboard
  // shortcut effect. These are gated on `question` so they remain safe to
  // compute before the early-return for the welcome state below.
  const isLinuxTerminal = !!(
    question &&
    question.module === 'linux' &&
    (question.direction === 'descriptionToCommand' ||
      (question.answerInputs?.length === 1 && !question.answerInputs[0].valueOptions))
  );

  const linuxTerminalConfig = isLinuxTerminal && question?.answerInputs
    ? question.answerInputs[0]
    : null;

  const answerKeys = question
    ? Object.keys(question.expectedAnswers).filter((k) => k !== 'unit')
    : [];

  // Determine whether all required fields have been filled.
  const allAnswered = question
    ? question.answerInputs
      ? question.answerInputs.every(
          (cfg) =>
            answers[cfg.valueKey]?.trim() &&
            (!cfg.unitKey || answers[cfg.unitKey]?.trim()),
        )
      : answerKeys.every((k) => answers[k]?.trim())
    : false;

  // Auto-focus the first answer input. Skipped for the welcome state and
  // when the question is a Linux terminal (it manages its own focus).
  const firstInputRef = useAutoFocusFirst<HTMLInputElement | HTMLSelectElement>(
    questionId,
    !!question && !isLinuxTerminal,
    checked,
  );

  const handleCheck = (inputValueOrEvent?: string | React.MouseEvent) => {
    // Linux terminal passes a string directly to avoid stale state
    // Regular buttons pass a MouseEvent which we ignore
    const inputValue = typeof inputValueOrEvent === 'string' ? inputValueOrEvent : undefined;
    const linuxKey = linuxTerminalConfig?.valueKey;

    const answersToCheck =
      inputValue !== undefined && linuxKey
        ? { ...answers, [linuxKey]: inputValue }
        : answers;
    const correct = onCheckAnswer(answersToCheck);
    setIsCorrect(correct);
    setChecked(true);
  };

  const handleNext = () => {
    setAnswers({});
    setShowSolution(false);
    setIsCorrect(null);
    setChecked(false);
    setRevealedSteps(1);
    onNextQuestion();
  };

  const dismissChangelog = () => {
    setChangelogDismissed(true);
    setChangelogOpen(false);
    writeChangelogDismissed(true);
  };

  const reopenChangelog = () => {
    setChangelogDismissed(false);
    setChangelogOpen(true);
    writeChangelogDismissed(false);
  };

  // -----------------------------------------------------------------
  // Keyboard shortcuts (Enter → check, N → next). Attached at window
  // level so the user doesn't have to tab to the buttons first.
  // Computed eagerly (before any early return) so hook ordering stays
  // stable regardless of `question` being null.
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!question) return;
    const isTextEntryTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      if (target instanceof HTMLTextAreaElement) return true;
      if (target instanceof HTMLSelectElement) return false; // selects don't accept free text
      if (target instanceof HTMLInputElement) {
        // Free-text-ish types — Enter/N should not hijack these.
        const typingTypes = new Set([
          'text',
          'search',
          'email',
          'url',
          'tel',
          'password',
          'number',
        ]);
        return typingTypes.has(target.type);
      }
      return false;
    };

    const ownsEnterKey = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      return !!target.closest('button,a,select,textarea,[role="button"],[role="link"],[role="combobox"]');
    };

    const handler = (e: KeyboardEvent) => {
      // Don't fire while the user holds a modifier (browser shortcuts).
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;

      if (e.key === 'Enter') {
        // LinuxTerminal already owns Enter inside its hidden input — it
        // forwards the value via onSubmit. Skip our handler there to avoid
        // double-checking with a stale `answers` state.
        if (isLinuxTerminal) return;
        // If focus is already on an interactive control that owns Enter
        // (button, link, select, textarea), let the browser/control handle it.
        if (ownsEnterKey(target)) return;
        if (!checked && allAnswered) {
          e.preventDefault();
          handleCheck();
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        // Don't steal the key from a text input (the user is typing).
        if (isTextEntryTarget(target)) return;
        if (checked) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // We re-attach when these change so the closure sees fresh state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, allAnswered, isLinuxTerminal, questionId, answers]);

  // -----------------------------------------------------------------
  // Welcome state (no question selected yet)
  // -----------------------------------------------------------------
  if (!question) {
    return (
      <div className="bg-slate-900/80 backdrop-blur rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Lightbulb className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Willkommen</h2>
              <p className="text-sm text-slate-400">
                Wähle links ein Modul aus, um direkt mit dem Lernen zu starten.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="text-sm text-slate-500 leading-relaxed">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Keyboard className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Tastenkürzel</span>
            </div>
            <ul className="space-y-1">
              <li>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-300">
                  Enter
                </kbd>{' '}
                Antwort prüfen
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-300">
                  N
                </kbd>{' '}
                nächste Frage laden
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
            Tipp: Für den schnellsten Einstieg eignen sich{' '}
            <span className="text-slate-300">Subnetting</span>,{' '}
            <span className="text-slate-300">Linux</span> und{' '}
            <span className="text-slate-300">Cloud</span>. Sobald du ein Modul
            auswählst, verschwindet dieses Panel automatisch.
          </div>
        </div>

        {/* Dismissible "Was ist neu?" pill */}
        {!changelogDismissed && (
          <div className="px-6 pb-5">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <button
                type="button"
                onClick={() => setChangelogOpen((v) => !v)}
                className="text-sm font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                Was ist neu?
              </button>
              <span className="text-[11px] text-slate-500 font-mono">
                {CHANGELOG_ENTRIES.length} Einträge
              </span>
              <button
                type="button"
                onClick={dismissChangelog}
                aria-label="Hinweis schließen"
                className="ml-auto p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {changelogOpen && (
                <motion.div
                  key="changelog-popover"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    {CHANGELOG_ENTRIES.map((entry) => {
                      const isHighlighted = entry.highlight === true;
                      return (
                        <div
                          key={`${entry.date}-${entry.summary}`}
                          className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm rounded-lg px-3 py-2 ${
                            isHighlighted
                              ? 'bg-emerald-500/10 border border-emerald-500/20'
                              : 'bg-slate-900/40 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-emerald-400">{entry.date}</span>
                            {entry.tag && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                  isHighlighted
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {entry.tag}
                              </span>
                            )}
                          </div>
                          <span
                            className={
                              isHighlighted
                                ? 'text-slate-200 font-medium'
                                : 'text-slate-300'
                            }
                          >
                            {entry.summary}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Re-open entry after dismissal */}
        {changelogDismissed && (
          <div className="px-6 pb-5">
            <button
              type="button"
              onClick={reopenChangelog}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              „Was ist neu?“ wieder anzeigen
            </button>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Active question state
  // -----------------------------------------------------------------
  const getDifficultyColor = () => {
    switch (question.difficulty) {
      case 'easy':
        return 'text-emerald-400';
      case 'medium':
        return 'text-amber-400';
      case 'hard':
        return 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  const getDifficultyLabel = () => {
    switch (question.difficulty) {
      case 'easy':
        return 'Einfach';
      case 'medium':
        return 'Mittel';
      case 'hard':
        return 'Schwer';
      default:
        return 'Unbekannt';
    }
  };

  // Linux-terminal input: direction is explicit or fall back to single
  // value input without options. `isLinuxTerminal` is also computed at the
  // top of the component (before the welcome-state early return) so the
  // auto-focus hook and keyboard-shortcut effect can read it safely.
  // The local `question` here is non-null because we're past the early
  // return, so we use the same expression without the null guard.
  // Shared class string for text/number inputs
  const inputClass = (extra = '') =>
    `w-full px-4 py-3 bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
      checked
        ? isCorrect
          ? 'border-emerald-500/50 bg-emerald-950/20'
          : 'border-rose-500/50 bg-rose-950/20'
        : 'border-slate-800 focus:border-emerald-500/50'
    } ${extra}`;

  // Shared class string for select dropdowns
  const selectClass = inputClass('cursor-pointer');

  // -----------------------------------------------------------------
  // Solution stepped-reveal helpers
  // -----------------------------------------------------------------
  const totalSteps = question.solutionSteps.length;
  const allStepsRevealed = revealedSteps >= totalSteps;
  const revealNext = () => {
    setRevealedSteps((n) => Math.min(totalSteps, n + 1));
  };
  const revealAll = () => setRevealedSteps(totalSteps);

  return (
    <div className="bg-slate-900/80 backdrop-blur rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              {question.theme}
            </span>
            <h2 className="text-lg font-semibold text-slate-100 mt-1">{question.module}</h2>
          </div>
          <span className={`text-sm font-medium ${getDifficultyColor()}`}>
            {getDifficultyLabel()}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="px-6 py-6">
        <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-line">
          {question.questionText}
        </p>
      </div>

      {/* Answer Inputs */}
      <div className="px-6 pb-4 space-y-4">
        {isLinuxTerminal && linuxTerminalConfig ? (
          /* Linux terminal-style input for description→command questions */
          <LinuxTerminal
            disabled={checked}
            value={answers[linuxTerminalConfig.valueKey] || ''}
            onChange={(v) =>
              setAnswers({ ...answers, [linuxTerminalConfig.valueKey]: v })
            }
            onSubmit={handleCheck}
            isCorrect={isCorrect}
            checked={checked}
            correctAnswer={String(
              question.expectedAnswers[linuxTerminalConfig.valueKey] ??
                question.expectedAnswers.answer ??
                '',
            )}
          />
        ) : question.answerInputs ? (
          /* Structured answer inputs – supports dropdown-only and value+unit pairs */
          question.answerInputs.map((cfg, idx) => {
            // Attach the auto-focus ref to the first input only.
            const attachFirst = idx === 0;
            return (
              <div key={cfg.valueKey} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {cfg.label ?? 'Wert'}
                  </label>
                  {cfg.valueOptions ? (
                    <select
                      ref={attachFirst ? (firstInputRef as Ref<HTMLSelectElement>) : undefined}
                      value={answers[cfg.valueKey] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [cfg.valueKey]: e.target.value })
                      }
                      disabled={checked}
                      className={selectClass}
                    >
                      <option value="">Bitte wählen…</option>
                      {cfg.valueOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      ref={attachFirst ? (firstInputRef as Ref<HTMLInputElement>) : undefined}
                      type="number"
                      value={answers[cfg.valueKey] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [cfg.valueKey]: e.target.value })
                      }
                      disabled={checked}
                      className={inputClass()}
                      placeholder="Wert eingeben..."
                      autoComplete="off"
                    />
                  )}
                </div>
                {cfg.unitKey && cfg.unitOptions && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Einheit
                    </label>
                    <select
                      value={answers[cfg.unitKey] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [cfg.unitKey!]: e.target.value })
                      }
                      disabled={checked}
                      className={selectClass}
                    >
                      <option value="">Einheit wählen…</option>
                      {cfg.unitOptions.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Generic text-input fallback for modules without answerInputs */
          answerKeys.map((key, idx) => {
            const attachFirst = idx === 0;
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-400 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  ref={attachFirst ? (firstInputRef as Ref<HTMLInputElement>) : undefined}
                  type="text"
                  value={answers[key] || ''}
                  onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                  disabled={checked}
                  className={inputClass()}
                  placeholder={`${key} eingeben...`}
                  autoComplete="off"
                />
              </div>
            );
          })
        )}

        {/* Feedback — wrapped in a live region so screen readers announce
            correctness when the user submits. */}
        <div role="status" aria-live="polite" aria-atomic="true">
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  isCorrect
                    ? 'bg-emerald-950/30 border border-emerald-500/30'
                    : 'bg-rose-950/30 border border-rose-500/30'
                }`}
              >
                {isCorrect ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">
                      Richtig! Sehr gut gemacht.
                    </span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-rose-400" />
                    <span className="text-rose-300 font-medium">
                      Das ist nicht ganz richtig.
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/30 flex flex-wrap gap-3">
        {!checked ? (
          <button
            type="button"
            onClick={() => handleCheck()}
            disabled={!allAnswered}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold rounded-lg transition-colors"
            title="Antwort prüfen (Enter)"
          >
            <Check className="w-4 h-4" />
            Antwort prüfen
            <kbd className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 bg-emerald-600/40 border border-emerald-300/30 rounded text-[10px] font-mono">
              Enter
            </kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg transition-colors"
            title="Nächste Frage (N)"
          >
            <ArrowRight className="w-4 h-4" />
            Nächste Frage
            <kbd className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 bg-emerald-600/40 border border-emerald-300/30 rounded text-[10px] font-mono">
              N
            </kbd>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowSolution(!showSolution)}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-lg transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          {showSolution ? 'Lösung ausblenden' : 'Lösung anzeigen'}
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 rounded-lg transition-colors ml-auto"
          title="Frage überspringen"
        >
          <RotateCcw className="w-4 h-4" />
          Überspringen
        </button>
      </div>

      {/* Stepped solution */}
      <AnimatePresence>
        {showSolution && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-800 bg-slate-950/50"
          >
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                  Schritt-für-Schritt Lösung
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {Math.min(revealedSteps, totalSteps)} / {totalSteps}
                </span>
              </div>

              <div className="space-y-2">
                {question.solutionSteps.map((step, idx) => {
                  const isRevealed = idx < revealedSteps;
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 rounded-lg border transition-colors ${
                        isRevealed
                          ? 'border-slate-800 bg-slate-900/40'
                          : 'border-slate-800/50 bg-slate-900/20 opacity-60'
                      }`}
                    >
                      <div
                        className={`shrink-0 w-9 flex items-start justify-center pt-3 font-mono text-sm border-r ${
                          isRevealed
                            ? 'border-slate-800 text-emerald-400'
                            : 'border-slate-800/50 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 py-2 pr-3">
                        {isRevealed ? (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className="text-slate-200 text-sm font-mono whitespace-pre-wrap"
                          >
                            {step || ' '}
                          </motion.p>
                        ) : (
                          <p className="text-slate-600 text-sm italic">
                            Schritt {idx + 1} – noch nicht aufgedeckt
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step controls */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {!allStepsRevealed && (
                  <>
                    <button
                      type="button"
                      onClick={revealNext}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg transition-colors text-sm"
                    >
                      Nächster Schritt
                    </button>
                    <button
                      type="button"
                      onClick={revealAll}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
                    >
                      Alle anzeigen
                    </button>
                  </>
                )}
                {allStepsRevealed && (
                  <span className="text-xs text-slate-500">
                    Alle Schritte angezeigt.
                  </span>
                )}
              </div>

              {/* Expected answers — always visible (not part of the reveal). */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400">
                  <span className="text-emerald-400 font-medium">
                    Erwartete Antworten:
                  </span>
                </p>
                <div className="mt-2 space-y-1">
                  {Object.entries(question.expectedAnswers).map(([key, value]) => (
                    <p key={key} className="text-sm text-slate-300">
                      <span className="text-slate-500 capitalize">{key}:</span>{' '}
                      <span className="text-emerald-300 font-mono">{value}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
