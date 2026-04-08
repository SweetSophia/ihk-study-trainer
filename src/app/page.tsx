'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, LogOut, GraduationCap } from 'lucide-react';
import StudyCard from './components/StudyCard';
import AuthModal from './components/AuthModal';
import ThemeSelector from './components/ThemeSelector';
import ProgressDashboard from './components/ProgressDashboard';
import SqlTrainer from './components/SqlTrainer';
import { Question, User as UserType } from './types';
import {
  generateUniqueUser,
  getUserByHash,
  getAllProgress,
  updateProgress
} from './lib/auth';
import { validateQuestionAnswers } from './lib/answerValidation';
import { toCanonicalModuleId } from './lib/moduleIds';

// Import all generators
import { generateBandwidthQuestion } from './lib/generators/bandwidth';
import { generateImageCalcQuestion } from './lib/generators/imageCalc';
import { generateImageTransferComboQuestion } from './lib/generators/imageTransferCombo';
import { generateOverheadQuestion } from './lib/generators/overhead';
import { generateSubnettingQuestion } from './lib/generators/subnetting';
import { generateUnitConversionQuestion } from './lib/generators/unitConversion';
import { generateBinaryQuestion } from './lib/generators/binary';
import { generateHexQuestion } from './lib/generators/hex';
import { generateHexBinaryQuestion } from './lib/generators/hexBinary';
import { generateSubnetMaskQuestion } from './lib/generators/subnetMask';
import { generateAggregationQuestion } from './lib/generators/aggregation';
import { generatePortQuestion } from './lib/generators/ports';
import { generateOsiQuestion } from './lib/generators/osi';
import { generateCableQuestion, CABLE_TYPES, ALL_CABLE_PROS } from './lib/generators/cables';
import { generateLinuxQuestion } from './lib/generators/linux';
import { generateCloudQuestion } from './lib/generators/cloud';
import { generateHandelskalkulationQuestion, generateVorwaertsKalkulationQuestion, generateRueckwaertsKalkulationQuestion } from './lib/generators/handelskalkulation';

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
  hexBinary: () => {
    const q = generateHexBinaryQuestion();
    return {
      id: `hexBinary-${Date.now()}`,
      theme: q.theme,
      module: 'hexBinary',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: q.difficulty,
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
  },
  linux: () => {
    const q = generateLinuxQuestion();
    return {
      id: `linux-${Date.now()}`,
      theme: q.theme,
      module: 'linux',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: q.difficulty,
      answerInputs: q.answerInputs,
      direction: q.direction,
    };
  },
  cloud: () => {
    const q = generateCloudQuestion();
    return {
      id: `cloud-${Date.now()}`,
      theme: q.theme,
      module: 'cloud',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: q.difficulty,
      answerInputs: q.answerInputs,
      scenario: q.scenario,
    };
  },
  handelskalkulation: () => {
    const q = generateHandelskalkulationQuestion();
    return {
      id: `handelskalkulation-${Date.now()}`,
      theme: q.theme,
      module: 'handelskalkulation',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: q.difficulty,
      answerInputs: q.answerInputs,
    };
  },
  'handelskalkulation-vorwaerts': () => {
    const q = generateVorwaertsKalkulationQuestion();
    return { ...q, id: `handelskalkulation-vorwaerts-${Date.now()}` };
  },
  'handelskalkulation-rueckwaerts': () => {
    const q = generateRueckwaertsKalkulationQuestion();
    return { ...q, id: `handelskalkulation-rueckwaerts-${Date.now()}` };
  },
};

export default function Home() {
  const [user, setUser] = useState<UserType | null>(null);
  const [accessHash, setAccessHash] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<{ module: string; questions_attempted: number; questions_correct: number; streak_days?: number | null }[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = useCallback(async (hash: string) => {
    try {
      const userProgress: { module: string; questions_attempted: number; questions_correct: number; streak_days?: number | null }[] = await getAllProgress(hash);
      setProgress(userProgress);
      
      // Calculate streak (simplified)
      const maxStreak = Math.max(0, ...userProgress.map(p => p.streak_days ?? 0));
      setStreakDays(maxStreak);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, []);

  const handleLogin = useCallback(async (hash: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userData = await getUserByHash(hash);
      if (userData) {
        setUser(userData);
        setAccessHash(hash);
        localStorage.setItem('ihk_access_hash', hash);
        await loadProgress(hash);
        setShowAuthModal(false);
        setIsLoading(false);
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
  }, [loadProgress]);

  useEffect(() => {
    const verifyStoredHash = async () => {
      const storedHash = localStorage.getItem('ihk_access_hash');

      if (!storedHash) {
        setShowAuthModal(true);
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getUserByHash(storedHash);
        if (userData) {
          setUser(userData);
          setAccessHash(storedHash);
          setShowAuthModal(false);
          setIsLoading(false);
          loadProgress(storedHash);
        } else {
          localStorage.removeItem('ihk_access_hash');
          setIsLoading(false);
          setShowAuthModal(true);
        }
      } catch (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        setShowAuthModal(true);
      }
    };

    verifyStoredHash();
  }, [loadProgress]);

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
    const canonicalModule = toCanonicalModuleId(module);
    setCurrentModule(canonicalModule);
    generateNewQuestion(canonicalModule);
  };

  const generateNewQuestion = (module: string) => {
    const generator = GENERATORS[module];
    if (generator) {
      const question = generator();
      setCurrentQuestion(question);
    }
  };

  const handleCheckAnswer = useCallback((answers: Record<string, string>): boolean => {
    if (!currentQuestion) return false;

    const correct = validateQuestionAnswers(currentQuestion, answers);

    if (accessHash) {
      updateProgress(accessHash, currentQuestion.module, correct)
        .then(() => loadProgress(accessHash))
        .catch((err) => console.error('Error updating progress:', err));
    }

    return correct;
  }, [currentQuestion, accessHash, loadProgress]);

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
                isAuthenticated={!!accessHash}
              />
            </div>
          </div>

          {/* Main Study Area */}
          <div className="lg:col-span-8 xl:col-span-9 2xl:col-span-9 min-w-0 flex-1">
            {currentModule === 'sql' ? (
              <SqlTrainer
                accessHash={accessHash}
                onCorrect={() => {
                  if (accessHash) {
                    updateProgress(accessHash, 'sql', true)
                      .then(() => loadProgress(accessHash))
                      .catch((err) => console.error('Error updating progress:', err));
                  }
                }}
                onIncorrect={() => {
                  if (accessHash) {
                    updateProgress(accessHash, 'sql', false)
                      .then(() => loadProgress(accessHash))
                      .catch((err) => console.error('Error updating progress:', err));
                  }
                }}
              />
            ) : (
              <StudyCard
                question={currentQuestion}
                onCheckAnswer={handleCheckAnswer}
                onNextQuestion={handleNextQuestion}
              />
            )}
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
