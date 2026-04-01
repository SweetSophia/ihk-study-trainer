'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Lightbulb, ArrowRight, RotateCcw } from 'lucide-react';
import { Question } from '../types';
import LinuxTerminal from './LinuxTerminal';

interface StudyCardProps {
  question: Question | null;
  onCheckAnswer: (answers: Record<string, string>) => boolean;
  onNextQuestion: () => void;
}

export default function StudyCard({ question, onCheckAnswer, onNextQuestion }: StudyCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  if (!question) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-xl border border-slate-800">
        <p className="text-slate-400">Wähle ein Modul aus, um zu beginnen</p>
      </div>
    );
  }

  const handleCheck = (inputValueOrEvent?: string | React.MouseEvent) => {
    // Linux terminal passes a string directly to avoid stale state
    // Regular buttons pass a MouseEvent which we ignore
    const inputValue = typeof inputValueOrEvent === 'string' ? inputValueOrEvent : undefined;
    // If inputValue is provided (Linux terminal), use it directly to avoid stale state
    // Otherwise fall back to the answers state (for regular inputs)
    const answersToCheck = inputValue !== undefined && linuxTerminalConfig
      ? { ...answers, [linuxTerminalConfig.valueKey]: inputValue }
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
    onNextQuestion();
  };

  const getDifficultyColor = () => {
    switch (question.difficulty) {
      case 'easy': return 'text-emerald-400';
      case 'medium': return 'text-amber-400';
      case 'hard': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const getDifficultyLabel = () => {
    switch (question.difficulty) {
      case 'easy': return 'Einfach';
      case 'medium': return 'Mittel';
      case 'hard': return 'Schwer';
      default: return 'Unbekannt';
    }
  };

  const answerKeys = Object.keys(question.expectedAnswers).filter(k => k !== 'unit');

  // Determine whether all required fields have been filled
  const allAnswered = question.answerInputs
    ? question.answerInputs.every(
        (cfg) =>
          answers[cfg.valueKey]?.trim() &&
          (!cfg.unitKey || answers[cfg.unitKey]?.trim())
      )
    : answerKeys.every((k) => answers[k]?.trim());

  // Check if we should use the LinuxTerminal component:
  // Linux module + descriptionToCommand direction (explicit) OR fallback inference
  const isLinuxTerminal =
    question.module === 'linux' &&
    (question.direction === 'descriptionToCommand' ||
      (question.answerInputs?.length === 1 && !question.answerInputs[0].valueOptions));

  const linuxTerminalConfig = isLinuxTerminal ? question.answerInputs![0] : null;

  /** Shared class string for text/number inputs */
  const inputClass = (extra = '') =>
    `w-full px-4 py-3 bg-slate-950 border rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
      checked
        ? isCorrect
          ? 'border-emerald-500/50 bg-emerald-950/20'
          : 'border-rose-500/50 bg-rose-950/20'
        : 'border-slate-800 focus:border-emerald-500/50'
    } ${extra}`;

  /** Shared class string for select dropdowns */
  const selectClass = inputClass('cursor-pointer');

  return (
    <div className="bg-slate-900/80 backdrop-blur rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              {question.theme}
            </span>
            <h2 className="text-lg font-semibold text-slate-100 mt-1">
              {question.module}
            </h2>
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
            onChange={(v) => setAnswers({ ...answers, [linuxTerminalConfig.valueKey]: v })}
            onSubmit={handleCheck}
            isCorrect={isCorrect}
            checked={checked}
            correctAnswer={String(question.expectedAnswers[linuxTerminalConfig.valueKey] ?? question.expectedAnswers.answer ?? '')}
          />
        ) : question.answerInputs ? (
          /* Structured answer inputs – supports dropdown-only and value+unit pairs */
          question.answerInputs.map((cfg) => (
            <div key={cfg.valueKey} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {cfg.label ?? 'Wert'}
                </label>
                {cfg.valueOptions ? (
                  <select
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
                    type="number"
                    value={answers[cfg.valueKey] || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [cfg.valueKey]: e.target.value })
                    }
                    disabled={checked}
                    className={inputClass()}
                    placeholder="Wert eingeben..."
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
          ))
        ) : (
          /* Generic text-input fallback for modules without answerInputs */
          answerKeys.map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-400 mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                type="text"
                value={answers[key] || ''}
                onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                disabled={checked}
                className={inputClass()}
                placeholder={`${key} eingeben...`}
              />
            </div>
          ))
        )}

        {/* Feedback */}
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
                  <span className="text-emerald-300 font-medium">Richtig! Sehr gut gemacht.</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-rose-400" />
                  <span className="text-rose-300 font-medium">Das ist nicht ganz richtig.</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/30 flex flex-wrap gap-3">
        {!checked ? (
          <button
            onClick={handleCheck}
            disabled={!allAnswered}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Antwort prüfen
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Nächste Frage
          </button>
        )}

        <button
          onClick={() => setShowSolution(!showSolution)}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-lg transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          {showSolution ? 'Lösung ausblenden' : 'Lösung anzeigen'}
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 rounded-lg transition-colors ml-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Überspringen
        </button>
      </div>

      {/* Solution */}
      <AnimatePresence>
        {showSolution && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-800 bg-slate-950/50"
          >
            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                Schritt-für-Schritt Lösung
              </h3>
              <div className="space-y-2">
                {question.solutionSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-slate-600 font-mono text-sm">{idx + 1}.</span>
                    <p className="text-slate-300 text-sm font-mono whitespace-pre-wrap">
                      {step || '\n'}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400">
                  <span className="text-emerald-400 font-medium">Erwartete Antworten:</span>
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
