'use client';

import { useState } from 'react';
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

const MODULE_NAMES: Record<string, string> = {
  bandwidth: 'Übertragungszeit',
  imageCalc: 'Bildgröße',
  overhead: 'Overhead',
  subnetting: 'Subnetting',
  unitConversion: 'Einheiten',
  binary: 'Binär',
  hex: 'Hexadezimal',
  subnetMask: 'Subnetzmaske',
  aggregation: 'Aggregation',
  ports: 'Ports',
  osi: 'OSI-Modell',
  cables: 'Kabel'
};

export default function ProgressDashboard({ 
  progress, 
  streakDays, 
  onPracticeMistakes 
}: ProgressDashboardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const totalAttempted = progress.reduce((sum, p) => sum + p.questions_attempted, 0);
  const totalCorrect = progress.reduce((sum, p) => sum + p.questions_correct, 0);
  const overallAccuracy = totalAttempted > 0 
    ? Math.round((totalCorrect / totalAttempted) * 100) 
    : 0;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-emerald-400';
    if (accuracy >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getStreakColor = () => {
    if (streakDays >= 7) return 'text-orange-400';
    if (streakDays >= 3) return 'text-amber-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-slate-500 uppercase">Gesamt</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{totalAttempted}</p>
          <p className="text-xs text-slate-500">Fragen beantwortet</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-slate-500 uppercase">Genauigkeit</span>
          </div>
          <p className={`text-2xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
            {overallAccuracy}%
          </p>
          <p className="text-xs text-slate-500">{totalCorrect} richtig</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-4 h-4 ${getStreakColor()}`} />
            <span className="text-xs font-medium text-slate-500 uppercase">Streak</span>
          </div>
          <p className={`text-2xl font-bold ${getStreakColor()}`}>
            {streakDays}
          </p>
          <p className="text-xs text-slate-500">Tage am Stück</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-slate-500 uppercase">Module</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {progress.filter(p => p.questions_attempted > 0).length}
          </p>
          <p className="text-xs text-slate-500">von 12 gestartet</p>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onPracticeMistakes}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">Fehler üben</span>
        </button>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition-colors"
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
          className="border-t border-slate-800 pt-4"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Fortschritt pro Modul
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {progress.map((p) => {
              const accuracy = p.questions_attempted > 0 
                ? Math.round((p.questions_correct / p.questions_attempted) * 100)
                : 0;
              
              return (
                <div 
                  key={p.module} 
                  className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {accuracy >= 80 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : accuracy >= 50 ? (
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="text-sm text-slate-300">
                      {MODULE_NAMES[p.module] || p.module}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">
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
              <p className="text-sm text-slate-500 text-center py-4">
                Noch keine Daten vorhanden. Starte mit dem Lernen!
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
