'use client';

import { useState, useTransition, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PGlite } from '@electric-sql/pglite';
import { Database, Play, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { generateSqlExercise, SqlExercise } from '../actions/generate-sql-exercise';

interface SqlTrainerProps {
  onCorrect?: () => void;
  onIncorrect?: () => void;
}

export default function SqlTrainer({ onCorrect, onIncorrect }: SqlTrainerProps) {
  const [exercise, setExercise] = useState<SqlExercise | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchNewExercise = useCallback(() => {
    startTransition(async () => {
      try {
        setFeedback(null);
        setDbError(null);
        setUserQuery('');
        const newExercise = await generateSqlExercise();
        setExercise(newExercise);
      } catch (error) {
        console.error('Error generating exercise:', error);
        setFeedback({
          type: 'error',
          message: 'Fehler bei der Aufgaben-Generierung. Bitte erneut versuchen.',
        });
      }
    });
  }, []);

  const validateAnswer = useCallback(async () => {
    if (!exercise || !userQuery.trim()) {
      setFeedback({ type: 'info', message: 'Bitte eine SQL-Query eingeben.' });
      return;
    }

    setFeedback(null);
    setDbError(null);

    try {
      // Spin up a fresh, isolated PostgreSQL instance in the browser
      const db = new PGlite();

      // Execute the AI's schema and dummy data
      await db.query(exercise.setup_sql);

      // Get the expected result set using the AI's solution
      let expectedResult;
      try {
        expectedResult = await db.query(exercise.solution_query);
      } catch (solError: any) {
        console.error('Solution query failed:', solError);
        setFeedback({
          type: 'error',
          message: `Die generierte Musterlösung enthält einen Fehler: ${solError.message}`,
        });
        return;
      }

      // Get the user's result set
      let userResult;
      try {
        userResult = await db.query(userQuery);
      } catch (userError: any) {
        setFeedback({
          type: 'error',
          message: `SQL Fehler: ${userError.message}`,
        });
        onIncorrect?.();
        return;
      }

      // Compare the result sets (order-independent comparison)
      const expectedRows = JSON.stringify(sortRows(expectedResult.rows || []));
      const userRows = JSON.stringify(sortRows(userResult.rows || []));

      if (expectedRows === userRows) {
        setFeedback({
          type: 'success',
          message: '✅ Korrekt! Das Ergebnis stimmt mit der Musterlösung überein.',
        });
        onCorrect?.();
      } else {
        setFeedback({
          type: 'error',
          message: '❌ Das Ergebnis weicht ab. Überprüfe deine Query.',
        });
        onIncorrect?.();
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      setFeedback({
        type: 'error',
        message: `Validierungsfehler: ${error.message}`,
      });
    }
  }, [exercise, userQuery, onCorrect, onIncorrect]);

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          SQL-Übungen (PostgreSQL)
        </h2>
        <button
          onClick={fetchNewExercise}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
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

      {/* Exercise Display */}
      {exercise && !isPending && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
        >
          {/* Theme */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-1">Szenario</h3>
            <p className="text-emerald-300 font-semibold">{exercise.theme}</p>
            <p className="text-slate-300 text-sm mt-1">{exercise.themeDescription}</p>
          </div>

          {/* Database Schema */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Datenbank-Struktur</h3>
            <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono">
              <code>{exercise.setup_sql}</code>
            </pre>
          </div>

          {/* Question */}
          <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-emerald-500">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Aufgabe</h3>
            <p className="text-slate-100 font-medium">{exercise.question}</p>
          </div>

          {/* Query Input */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Deine Query</h3>
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full h-36 p-4 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-y"
              placeholder="SELECT ... FROM ... WHERE ...;"
              spellCheck={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={validateAnswer}
              disabled={!userQuery.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Query ausführen & prüfen
            </button>

            {feedback && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : feedback.type === 'error'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                }`}
              >
                {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {feedback.type === 'error' && <XCircle className="w-4 h-4" />}
                {feedback.type === 'info' && <AlertCircle className="w-4 h-4" />}
                <span className="text-sm">{feedback.message}</span>
              </div>
            )}
          </div>

          {/* Solution Hint */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
              💡 Musterlösung anzeigen
            </summary>
            <div className="mt-3">
              <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs text-emerald-400 overflow-x-auto font-mono">
                <code>{exercise.solution_query}</code>
              </pre>
            </div>
          </details>
        </motion.div>
      )}

      {/* Initial State */}
      {!exercise && !isPending && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">
            Klicke auf &quot;Neue Übung&quot;, um eine SQL-Aufgabe zu generieren.
          </p>
          <p className="text-sm text-slate-500">
            Jede Aufgabe wird dynamisch mit echten PostgreSQL-Abfragen erstellt.
          </p>
        </div>
      )}
    </div>
  );
}

/** Sort rows by all values to enable order-independent comparison */
function sortRows(rows: any[]): any[] {
  return rows.map(row => Object.entries(row).sort().reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}));
}
