'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { toCanonicalModuleId } from '../lib/moduleIds';
import { MODULE_NAMES, isModuleId, LEGACY_CALCULATION } from '../lib/modules';
import {
  fireStreakConfetti,
  isStreakMilestone,
} from '../lib/celebrations';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Flame, 
  RotateCcw, 
  TrendingUp,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ProgressData {
  module: string;
  questions_attempted: number;
  questions_correct: number;
}

interface ProgressDashboardProps {
  progress: ProgressData[];
  streakDays: number;
  onPracticeMistakes: () => void;
}

/** localStorage key for the persistent "Details anzeigen" toggle. */
const SHOW_DETAILS_KEY = 'ihk_progress_show_details';
const SHOW_DETAILS_CHANGE_EVENT = 'ihk_progress_show_details_change';

function readShowDetails(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SHOW_DETAILS_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeShowDetails(value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SHOW_DETAILS_KEY, value ? 'true' : 'false');
    window.dispatchEvent(new Event(SHOW_DETAILS_CHANGE_EVENT));
  } catch {
    // localStorage may be disabled (private mode, quota) — fail silently.
  }
}

function subscribeShowDetails(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(SHOW_DETAILS_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(SHOW_DETAILS_CHANGE_EVENT, onStoreChange);
  };
}

export default function ProgressDashboard({ 
  progress, 
  streakDays, 
  onPracticeMistakes 
}: ProgressDashboardProps) {
  // SSR-safe localStorage binding: `false` is the server snapshot, then
  // useSyncExternalStore reads the browser value after hydration without a
  // manual setState-in-effect race.
  const showDetails = useSyncExternalStore(
    subscribeShowDetails,
    readShowDetails,
    () => false,
  );

  const toggleShowDetails = () => writeShowDetails(!showDetails);

  // Celebrate streak milestones (1, 3, 7, 14, 30, 100 days). The "once per
  // session" guard lives inside `fireStreakConfetti` (sessionStorage) so the
  // effect can stay simple and reactive to `streakDays`.
  useEffect(() => {
    if (isStreakMilestone(streakDays)) {
      void fireStreakConfetti(streakDays);
    }
  }, [streakDays]);

  const hasActiveMistakes = progress.some(p =>
    isModuleId(toCanonicalModuleId(p.module)) && p.questions_attempted > p.questions_correct,
  );
  const hasMixedHistory = progress.some(p => p.module === LEGACY_CALCULATION.id);

  const totalAttempted = progress.reduce((sum, p) => sum + p.questions_attempted, 0);
  const totalCorrect = progress.reduce((sum, p) => sum + p.questions_correct, 0);
  const overallAccuracy = totalAttempted > 0 
    ? Math.round((totalCorrect / totalAttempted) * 100) 
    : 0;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-accent';
    if (accuracy >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getStreakColor = () => {
    if (streakDays >= 7) return 'text-warning';
    if (streakDays >= 3) return 'text-warning';
    return 'text-muted';
  };

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface border border-line rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-warning" />
            <span className="text-xs font-medium text-muted uppercase">Gesamt</span>
          </div>
          <p className="text-2xl font-bold text-ink">{totalAttempted}</p>
          <p className="text-xs text-muted">Fragen beantwortet</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-surface border border-line rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium text-muted uppercase">Genauigkeit</span>
          </div>
          <p className={`text-2xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
            {overallAccuracy}%
          </p>
          <p className="text-xs text-muted">{totalCorrect} richtig</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-line rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-4 h-4 ${getStreakColor()}`} />
            <span className="text-xs font-medium text-muted uppercase">Streak</span>
          </div>
          <p className={`text-2xl font-bold ${getStreakColor()}`}>
            {streakDays}
          </p>
          <p className="text-xs text-muted">Tage am Stück</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-surface border border-line rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-info" />
            <span className="text-xs font-medium text-muted uppercase">Module</span>
          </div>
          <p className="text-2xl font-bold text-ink">
            {progress.filter(p => p.questions_attempted > 0).length}
          </p>
          <p className="text-xs text-muted">gestartet</p>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onPracticeMistakes}
          disabled={!hasActiveMistakes}
          className="flex items-center gap-2 px-4 py-2.5 bg-danger-soft hover:bg-danger-soft-hover border border-danger text-danger rounded-lg transition-colors disabled:bg-subtle disabled:text-muted disabled:border-line disabled:hover:bg-subtle disabled:hover:text-muted disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">Fehler üben</span>
        </button>

        <button
          onClick={toggleShowDetails}
          className="flex items-center gap-2 px-4 py-2.5 bg-subtle hover:bg-subtle-hover border border-line text-ink rounded-lg transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">
            {showDetails ? 'Details ausblenden' : 'Details anzeigen'}
          </span>
        </button>
      </div>

      {/* Module Details */}
      {showDetails && progress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-line pt-4"
        >
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Fortschritt pro Modul
          </h3>
          {hasMixedHistory && (
            <p className="text-xs text-muted mb-3">
              Gemischte Kalkulationsversuche bleiben im Altbestand und in der Gesamtsumme erhalten.
              Neue Differenzaufgaben werden separat gezählt; den Altbestand kannst du nicht erneut üben.
            </p>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {progress.map((p) => {
              const accuracy = p.questions_attempted > 0 
                ? Math.round((p.questions_correct / p.questions_attempted) * 100)
                : 0;
              const canonicalModuleId = toCanonicalModuleId(p.module);
              
              return (
                <div 
                  key={p.module} 
                  className="flex items-center justify-between p-3 bg-canvas rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {accuracy >= 80 ? (
                      <CheckCircle className="w-4 h-4 text-accent" />
                    ) : accuracy >= 50 ? (
                      <TrendingUp className="w-4 h-4 text-warning" />
                    ) : (
                      <XCircle className="w-4 h-4 text-danger" />
                    )}
                    <span className="text-sm text-ink">
                      {canonicalModuleId === LEGACY_CALCULATION.id
                        ? LEGACY_CALCULATION.name
                        : isModuleId(canonicalModuleId) ? MODULE_NAMES[canonicalModuleId] : p.module}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted">
                      {p.questions_correct}/{p.questions_attempted}
                    </span>
                    <span className={`font-medium w-10 text-right ${getAccuracyColor(accuracy)}`}>
                      {accuracy}%
                    </span>
                  </div>
                </div>
              );
            })}
            
            {progress.length === 0 && (
              <p className="text-sm text-muted text-center py-4">
                Noch keine Daten vorhanden. Starte mit dem Lernen!
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
