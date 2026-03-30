'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, LogOut, GraduationCap } from 'lucide-react';
import StudyCard from './components/StudyCard';
import AuthModal from './components/AuthModal';
import ThemeSelector from './components/ThemeSelector';
import ProgressDashboard from './components/ProgressDashboard';
import { Question, User as UserType, AnswerInputConfig } from './types';
import { 
  generateUniqueUser, 
  getUserByHash, 
  getAllProgress,
  updateProgress 
} from './lib/auth';

// --- Unit-conversion maps for answer validation ---
const SIZE_TO_BYTES: Record<string, number> = {
  bytes: 1,
  kib: 1024,
  kb: 1000,
  mib: 1024 * 1024,
  mb: 1000 * 1000,
  gib: 1024 * 1024 * 1024,
  gb: 1000 * 1000 * 1000,
};

const TIME_TO_SECONDS: Record<string, number> = {
  sekunden: 1,
  minuten: 60,
  stunden: 3600,
};

// Import all generators
import { generateBandwidthQuestion } from './lib/generators/bandwidth';
import { generateImageCalcQuestion } from './lib/generators/imageCalc';
import { generateImageTransferComboQuestion } from './lib/generators/imageTransferCombo';
import { generateOverheadQuestion } from './lib/generators/overhead';
import { generateSubnettingQuestion } from './lib/generators/subnetting';
import { generateUnitConversionQuestion } from './lib/generators/unitConversion';
import { generateBinaryQuestion } from './lib/generators/binary';
import { generateHexQuestion } from './lib/generators/hex';
import { generateSubnetMaskQuestion } from './lib/generators/subnetMask';
import { generateAggregationQuestion } from './lib/generators/aggregation';
import { generatePortQuestion } from './lib/generators/ports';
import { generateOsiQuestion, OSI_LAYER_NAMES } from './lib/generators/osi';
import { generateCableQuestion, CABLE_TYPES, ALL_CABLE_PROS } from './lib/generators/cables';

/** Parse a numeric string, treating comma as decimal separator (German locale). */
function parseLocaleFloat(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}

// --- Structured answer validation (unit-conversion aware) ---

/**
 * Detect the conversion map that applies for the given unit options.
 * Returns null when no conversion-aware check is needed.
 */
function detectConversionMap(
  unitOptions: string[]
): Record<string, number> | null {
  const lower = unitOptions.map((u) => u.toLowerCase());
  if (lower.some((u) => u in SIZE_TO_BYTES)) return SIZE_TO_BYTES;
  if (lower.some((u) => u in TIME_TO_SECONDS)) return TIME_TO_SECONDS;
  return null;
}

/**
 * Validate structured answers using unit-aware comparison.
 *
 * For file-size or time answers the user may choose a different (but valid)
 * unit and supply the mathematically equivalent value.  We normalise both
 * sides to a common base (bytes / seconds) and compare with 5 % tolerance.
 */
function validateStructuredAnswer(
  inputs: AnswerInputConfig[],
  expected: Record<string, string | number | boolean>,
  answers: Record<string, string>
): boolean {
  const convMap = detectConversionMap(inputs[0].unitOptions ?? []);

  if (convMap) {
    // Sum up expected total in base units
    let expectedTotal = 0;
    for (const cfg of inputs) {
      const val = Number(expected[cfg.valueKey]);
      const unit = String(expected[cfg.unitKey ?? '']).toLowerCase();
      const factor = convMap[unit];
      if (factor === undefined) return false;
      expectedTotal += val * factor;
    }

    // Sum up user total in base units
    let userTotal = 0;
    for (const cfg of inputs) {
      const val = parseLocaleFloat(answers[cfg.valueKey] || '');
      const unit = (answers[cfg.unitKey ?? ''] || '').toLowerCase();
      if (isNaN(val) || convMap[unit] === undefined) return false;
      userTotal += val * convMap[unit];
    }

    // Compare with 5 % tolerance
    if (expectedTotal === 0) return userTotal === 0;
    const tolerance = Math.abs(expectedTotal) * 0.05;
    return Math.abs(userTotal - expectedTotal) <= tolerance;
  }

  // Fallback: per-field comparison (numeric 5 % tolerance or exact string)
  // Build a lookup from valueKey → its AnswerInputConfig
  const configByKey = new Map(inputs.map((cfg) => [cfg.valueKey, cfg]));

  // Collect answers for fields that use acceptedValues (multi-correct)
  const acceptedFieldAnswers: string[] = [];

  for (const [key, exp] of Object.entries(expected)) {
    const cfg = configByKey.get(key);

    if (cfg?.acceptedValues) {
      // Accept any value from the accepted list
      const userAnswer = answers[key]?.trim();
      if (!cfg.acceptedValues.some((v) => v === userAnswer)) return false;
      if (cfg.acceptedValues.length > 1) {
        acceptedFieldAnswers.push(userAnswer);
      }
      continue;
    }

    const userAnswer = answers[key]?.trim().toLowerCase();
    const expectedStr = String(exp).toLowerCase();
    const userNum = parseLocaleFloat(userAnswer);
    const expectedNum = parseLocaleFloat(expectedStr);
    if (!isNaN(userNum) && !isNaN(expectedNum)) {
      const tolerance = expectedNum * 0.05;
      if (Math.abs(userNum - expectedNum) > tolerance) return false;
    } else if (userAnswer !== expectedStr) {
      return false;
    }
  }

  // Prevent duplicate picks among acceptedValues fields
  if (
    acceptedFieldAnswers.length > 1 &&
    new Set(acceptedFieldAnswers).size !== acceptedFieldAnswers.length
  ) {
    return false;
  }

  return true;
}

const GENERATORS: Record<string, () => Question> = {
  bandwidth: generateBandwidthQuestion,
  imageCalc: generateImageCalcQuestion,
  imageTransferCombo: generateImageTransferComboQuestion,
  overhead: generateOverheadQuestion,
  subnetting: generateSubnettingQuestion,
  unitConversion: generateUnitConversionQuestion,
  binary: () => {
    const q = generateBinaryQuestion();
    return {
      id: `binary-${Date.now()}`,
      theme: q.theme,
      module: 'binary',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'easy'
    };
  },
  hex: () => {
    const q = generateHexQuestion();
    return {
      id: `hex-${Date.now()}`,
      theme: q.theme,
      module: 'hex',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'easy'
    };
  },
  subnetMask: () => {
    const q = generateSubnetMaskQuestion();
    return {
      id: `subnetMask-${Date.now()}`,
      theme: q.theme,
      module: 'subnetMask',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'medium'
    };
  },
  aggregation: () => {
    const q = generateAggregationQuestion();
    return {
      id: `aggregation-${Date.now()}`,
      theme: q.theme,
      module: 'aggregation',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'hard'
    };
  },
  ports: () => {
    const q = generatePortQuestion();
    return {
      id: `ports-${Date.now()}`,
      theme: q.theme,
      module: 'ports',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'easy',
      answerInputs: q.answerInputs,
    };
  },
  osi: () => {
    const q = generateOsiQuestion();
    return {
      id: `osi-${Date.now()}`,
      theme: q.theme,
      module: 'osi',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'medium',
      answerInputs: q.answerInputs,
    };
  },
  cables: () => {
    const q = generateCableQuestion();

    // Build reason inputs using the pre-computed reasonCount from the generator
    const reasonInputs = Array.from({ length: q.reasonCount }, (_, i) => ({
      valueKey: `reason${i + 1}`,
      label: `Vorteil ${i + 1}`,
      valueOptions: ALL_CABLE_PROS,
      acceptedValues: q.correctPros,
    }));

    return {
      id: `cables-${Date.now()}`,
      theme: q.theme,
      module: 'cables',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'medium',
      answerInputs: [
        {
          valueKey: 'cableType',
          label: 'Kabeltyp',
          valueOptions: CABLE_TYPES.map(c => c.type),
          acceptedValues: [String(q.expectedAnswers.cableType)],
        },
        ...reasonInputs,
      ],
    };
  }
};

export default function Home() {
  const [user, setUser] = useState<UserType | null>(null);
  const [accessHash, setAccessHash] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<{ module: string; questions_attempted: number; questions_correct: number; streak_days?: number }[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedHash = localStorage.getItem('ihk_access_hash');
    if (storedHash) {
      handleLogin(storedHash);
    } else {
      setIsLoading(false);
      setShowAuthModal(true);
    }
  }, []);

  const loadProgress = useCallback(async (hash: string) => {
    try {
      const userProgress: { module: string; questions_attempted: number; questions_correct: number; streak_days: number }[] = await getAllProgress(hash);
      setProgress(userProgress);
      
      // Calculate streak (simplified)
      const maxStreak = Math.max(0, ...userProgress.map(p => p.streak_days));
      setStreakDays(maxStreak);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, []);

  const handleLogin = async (hash: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userData = await getUserByHash(hash);
      if (userData) {
        setUser(userData);
        setAccessHash(hash);
        localStorage.setItem('ihk_access_hash', hash);
        await loadProgress(hash);
        setShowAuthModal(false);
        return { success: true };
      } else {
        // Confirmed not-found (no error, just null data) – invalid hash
        localStorage.removeItem('ihk_access_hash');
        return { success: false, error: 'Dieser Code wurde nicht gefunden. Bitte überprüfe deinen Code.' };
      }
    } catch (error) {
      // RPC/network error
      console.error('Login error:', error);
      return { success: false, error: 'Verbindungsfehler. Bitte versuche es erneut.' };
    }
  };

  const handleRegister = async (): Promise<string | null> => {
    try {
      const result = await generateUniqueUser();
      if (result) {
        return result.hash;
      }
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAccessHash(null);
    setCurrentModule(null);
    setCurrentQuestion(null);
    setProgress([]);
    localStorage.removeItem('ihk_access_hash');
    setShowAuthModal(true);
  };

  const handleSelectModule = (module: string) => {
    setCurrentModule(module);
    generateNewQuestion(module);
  };

  const generateNewQuestion = (module: string) => {
    const generator = GENERATORS[module];
    if (generator) {
      const question = generator();
      setCurrentQuestion(question);
    }
  };

  const handleCheckAnswer = useCallback((answers: Record<string, string>): boolean => {
    if (!currentQuestion || !user || !accessHash) return false;

    let correct: boolean;

    if (currentQuestion.answerInputs) {
      correct = validateStructuredAnswer(currentQuestion.answerInputs, currentQuestion.expectedAnswers, answers);
    } else {
      // Legacy validation for plain text inputs
      correct = true;
      for (const [key, expected] of Object.entries(currentQuestion.expectedAnswers)) {
        if (key === 'unit') continue;
        const userAnswer = answers[key]?.trim().toLowerCase();
        const expectedStr = String(expected).toLowerCase();

        const userNum = parseLocaleFloat(userAnswer);
        const expectedNum = parseLocaleFloat(expectedStr);

        if (!isNaN(userNum) && !isNaN(expectedNum)) {
          const tolerance = expectedNum * 0.05;
          if (Math.abs(userNum - expectedNum) > tolerance) {
            correct = false;
          }
        } else if (userAnswer !== expectedStr) {
          correct = false;
        }
      }
    }

    // Update progress, then reload once the write is done
    updateProgress(accessHash, currentQuestion.module, correct)
      .then(() => loadProgress(accessHash))
      .catch((err) => console.error('Error updating progress:', err));

    return correct;
  }, [currentQuestion, user, accessHash, loadProgress]);

  const handleNextQuestion = () => {
    if (currentModule) {
      generateNewQuestion(currentModule);
    }
  };

  const handlePracticeMistakes = () => {
    // Find module with most mistakes and switch to it
    const moduleWithMistakes = progress
      .filter(p => p.questions_attempted > p.questions_correct)
      .sort((a, b) => 
        (b.questions_attempted - b.questions_correct) - 
        (a.questions_attempted - a.questions_correct)
      )[0];
    
    if (moduleWithMistakes) {
      handleSelectModule(moduleWithMistakes.module);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">
                  IHK Study Trainer
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Fachinformatiker Systemintegration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
                    <User className="w-4 h-4 text-slate-400" />
                    <code className="text-sm font-mono text-emerald-400">
                      {accessHash?.slice(0, 6)}...
                    </code>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium rounded-lg transition-colors"
                >
                  <GraduationCap className="w-4 h-4" />
                  Anmelden
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar - Progress */}
          <div className="lg:col-span-4 xl:col-span-3 2xl:col-span-3 space-y-6 min-w-[280px]">
            <AnimatePresence mode="wait">
              {user && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
                >
                  <ProgressDashboard
                    progress={progress}
                    streakDays={streakDays}
                    onPracticeMistakes={handlePracticeMistakes}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Lernmodule
              </h2>
              <ThemeSelector
                currentModule={currentModule}
                onSelectModule={handleSelectModule}
              />
            </div>
          </div>

          {/* Main Study Area */}
          <div className="lg:col-span-8 xl:col-span-9 2xl:col-span-9 min-w-0 flex-1">
            <StudyCard
              question={currentQuestion}
              onCheckAnswer={handleCheckAnswer}
              onNextQuestion={handleNextQuestion}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              IHK Study Trainer © {new Date().getFullYear()}
            </p>
            <p className="text-xs text-slate-600">
              Für die IHK-Prüfung zum Fachinformatiker Systemintegration
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
