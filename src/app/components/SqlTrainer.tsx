'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gradeSqlAnswer } from '../lib/sql-grading';
import { Database, Play, RefreshCw, AlertCircle, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { generateSqlExercise, SqlExercise } from '../actions/generate-sql-exercise';

// ---------------------------------------------------------------------------
// Type guard for error objects
// ---------------------------------------------------------------------------
function isErrorWithMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (isErrorWithMessage(error)) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface SqlTrainerProps {
  accessHash: string | null;
  onCorrect?: () => void;
  onIncorrect?: () => void;
}

export default function SqlTrainer({ accessHash, onCorrect, onIncorrect }: SqlTrainerProps) {
  const [loadedExercise, setExercise] = useState<{ value: SqlExercise; accessHash: string } | null>(null);
  const exercise = loadedExercise?.accessHash === accessHash ? loadedExercise.value : null;
  const [userQuery, setUserQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  type Feedback = { type: 'success' | 'error' | 'info'; message: string };
  const [feedbackState, setFeedbackState] = useState<{ accessHash: string | null; value: Feedback } | null>(null);
  const feedback = feedbackState?.accessHash === accessHash ? feedbackState.value : null;
  const setFeedback = useCallback((value: Feedback | null) => {
    setFeedbackState(value ? { accessHash, value } : null);
  }, [accessHash]);

  const [isValidating, setIsValidating] = useState(false);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const completed = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    generation.current++;
    return () => { mounted.current = false; };
  }, [accessHash]);

  const fetchNewExercise = useCallback(() => {
    if (!accessHash) {
      setFeedback({ type: 'info', message: 'Bitte melde dich an, um SQL-Übungen zu nutzen.' });
      return;
    }

    const token = ++generation.current;
    startTransition(async () => {
      try {
        setFeedback({ type: 'info', message: 'SQL-Aufgabe wird geladen…' });
        const newExercise = await generateSqlExercise(accessHash);
        if (mounted.current && token === generation.current) {
          setExercise({ value: newExercise, accessHash });
          setUserQuery('');
          completed.current = false;
          setFeedback(null);
        }
      } catch (error: unknown) {
        if (!mounted.current || token !== generation.current) return;
        const message = getErrorMessage(error, 'Unbekannter Fehler');
        console.error('Error generating exercise:', message);
        if (message.includes('rate limit') || message.includes('429')) {
          setFeedback({
            type: 'error',
            message: 'Rate limit erreicht. Bitte warte einen Moment.',
          });
        } else {
          setFeedback({
            type: 'error',
            message: 'Fehler bei der Aufgaben-Generierung. Bitte erneut versuchen.',
          });
        }
      }
    });
  }, [accessHash, setFeedback]);

  const validateAnswer = useCallback(async () => {
    if (!exercise || !userQuery.trim()) {
      setFeedback({ type: 'info', message: 'Bitte eine SQL-Query eingeben.' });
      return;
    }

    if (isPending || inFlight.current || completed.current) return;
    inFlight.current = true;
    setIsValidating(true);
    setFeedback({ type: 'info', message: 'SQL-Antwort wird geprüft…' });
    const token = generation.current;
    const isCurrent = () => mounted.current && token === generation.current;
    try {
      const result = await gradeSqlAnswer(exercise, userQuery, { rejectInfrastructureErrors: true });
      if (!isCurrent()) return;
      setFeedback({
        type: result.correct ? 'success' : 'error',
        message: result.message ?? (result.correct
          ? '✅ Korrekt! Das Ergebnis stimmt mit der Musterlösung überein.'
          : '❌ Das Ergebnis weicht ab. Überprüfe deine Query.'),
      });
      if (result.correct) {
        completed.current = true;
        onCorrect?.();
      } else {
        onIncorrect?.();
      }
    } catch {
      if (isCurrent()) setFeedback({ type: 'error', message: 'Die SQL-Aufgabe konnte technisch nicht geprüft werden. Bitte erneut versuchen oder eine neue Übung laden.' });
    } finally {
      inFlight.current = false;
      if (mounted.current) setIsValidating(false);
    }
  }, [exercise, userQuery, onCorrect, onIncorrect, isPending, setFeedback]);

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
          <Database className="w-5 h-5 text-accent" />
          SQL-Übungen (PostgreSQL)
        </h2>
        <button
          onClick={fetchNewExercise}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-action hover:bg-action-hover disabled:bg-subtle disabled:text-muted disabled:border-line disabled:hover:bg-subtle disabled:hover:text-muted text-onaction rounded-lg font-medium transition-colors"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generiere...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Neue Übung
            </>
          )}
        </button>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true">
        {feedback && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              feedback.type === 'success'
                ? 'bg-accent-soft text-accent border border-accent'
                : feedback.type === 'error'
                ? 'bg-danger-soft text-danger border border-danger'
                : 'bg-info-soft text-info border border-info'
            }`}
          >
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {feedback.type === 'error' && <XCircle className="w-4 h-4" />}
            {feedback.type === 'info' && <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Exercise Display */}
      {exercise && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-line rounded-xl p-6 space-y-5"
        >
          {/* Theme */}
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">Szenario</h3>
            <p className="text-accent font-semibold">{exercise.theme}</p>
            <p className="text-ink text-sm mt-1">{exercise.themeDescription}</p>
          </div>

          {/* Database Schema */}
          <div>
            <h3 className="text-sm font-medium text-muted mb-2">Datenbank-Struktur</h3>
            <pre className="bg-canvas border border-line rounded-lg p-4 text-xs text-ink font-mono whitespace-pre-wrap break-word overflow-x-auto max-h-64 overflow-y-auto">
              <code>{exercise.setup_sql}</code>
            </pre>
          </div>

          {/* Question */}
          <div className="bg-subtle rounded-lg p-4 border-l-4 border-accent">
            <h3 className="text-sm font-medium text-muted mb-2">Aufgabe</h3>
            <p className="text-ink font-medium">{exercise.question}</p>
          </div>

          {/* Query Input */}
          <div>
            <label htmlFor="user-query" className="text-sm font-medium text-muted mb-2 block">
              Deine Query
            </label>
            <textarea
              id="user-query"
              value={userQuery}
              disabled={isPending}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full h-36 p-4 bg-canvas border border-control rounded-lg text-ink font-mono text-sm placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y"
              placeholder="SELECT ... FROM ... WHERE ...;"
              spellCheck={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={validateAnswer}
              disabled={!userQuery.trim() || isPending || isValidating || completed.current}
              className="flex items-center gap-2 px-5 py-2.5 bg-action hover:bg-action-hover disabled:bg-subtle disabled:text-muted disabled:border-line disabled:hover:bg-subtle disabled:hover:text-muted disabled:cursor-not-allowed text-onaction font-semibold rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Query ausführen & prüfen
            </button>

          </div>

          {/* Solution Hint */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted hover:text-ink">
              💡 Musterlösung anzeigen
            </summary>
            <div className="mt-3">
              <pre className="bg-canvas border border-line rounded-lg p-4 text-xs text-accent font-mono whitespace-pre-wrap break-word overflow-x-auto">
                <code>{exercise.solution_query}</code>
              </pre>
            </div>
          </details>
        </motion.div>
      )}

      {/* Locked State - User not authenticated */}
      {!accessHash && (
        <div className="bg-surface border border-line rounded-xl p-12 text-center">
          <Lock className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-ink font-medium mb-2">
            Anmeldung erforderlich
          </p>
          <p className="text-muted text-sm mb-4">
            Melde dich an, um SQL-Übungen zu nutzen.
          </p>
          <p className="text-xs text-muted">
            Die SQL-Übungen verwenden AI-generierte Aufgaben und erfordern eine Anmeldung.
          </p>
        </div>
      )}

      {/* Initial State - Authenticated but no exercise loaded */}
      {accessHash && !exercise && !isPending && (
        <div className="bg-surface border border-line rounded-xl p-12 text-center">
          <Database className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted mb-2">
            Klicke auf &quot;Neue Übung&quot;, um eine SQL-Aufgabe zu generieren.
          </p>
          <p className="text-sm text-muted">
            Jede Aufgabe wird dynamisch mit echten PostgreSQL-Abfragen erstellt.
          </p>
        </div>
      )}
    </div>
  );
}
