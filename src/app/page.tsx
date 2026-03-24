'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, LogOut, GraduationCap } from 'lucide-react';
import StudyCard from './components/StudyCard';
import AuthModal from './components/AuthModal';
import ThemeSelector from './components/ThemeSelector';
import ProgressDashboard from './components/ProgressDashboard';
import { Question, User as UserType } from './types';
import { 
  generateUniqueUser, 
  getUserByHash, 
  getAllProgress,
  updateProgress 
} from './lib/auth';

// Import all generators
import { generateBandwidthQuestion } from './lib/generators/bandwidth';
import { generateImageCalcQuestion } from './lib/generators/imageCalc';
import { generateOverheadQuestion } from './lib/generators/overhead';
import { generateSubnettingQuestion } from './lib/generators/subnetting';
import { generateUnitConversionQuestion } from './lib/generators/unitConversion';
import { generateBinaryQuestion } from './lib/generators/binary';
import { generateHexQuestion } from './lib/generators/hex';
import { generateSubnetMaskQuestion } from './lib/generators/subnetMask';
import { generateAggregationQuestion } from './lib/generators/aggregation';
import { generatePortQuestion } from './lib/generators/ports';
import { generateOsiQuestion } from './lib/generators/osi';
import { generateCableQuestion } from './lib/generators/cables';

const GENERATORS: Record<string, () => Question> = {
  bandwidth: generateBandwidthQuestion,
  imageCalc: generateImageCalcQuestion,
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
      difficulty: 'easy'
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
      difficulty: 'medium'
    };
  },
  cables: () => {
    const q = generateCableQuestion();
    return {
      id: `cables-${Date.now()}`,
      theme: q.theme,
      module: 'cables',
      questionText: q.questionText,
      expectedAnswers: q.expectedAnswers,
      solutionSteps: q.solutionSteps,
      difficulty: 'medium'
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

  const loadProgress = useCallback(async (userId: string) => {
    try {
      const userProgress: { module: string; questions_attempted: number; questions_correct: number; streak_days: number }[] = await getAllProgress(userId);
      setProgress(userProgress);
      
      // Calculate streak (simplified)
      const maxStreak = Math.max(0, ...userProgress.map(p => p.streak_days));
      setStreakDays(maxStreak);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, []);

  const handleLogin = async (hash: string) => {
    try {
      const userData = await getUserByHash(hash);
      if (userData) {
        setUser(userData);
        setAccessHash(hash);
        localStorage.setItem('ihk_access_hash', hash);
        await loadProgress(userData.id);
        setShowAuthModal(false);
      } else {
        // Invalid hash
        localStorage.removeItem('ihk_access_hash');
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
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
    if (!currentQuestion || !user) return false;

    // Check if answers match expected
    let correct = true;
    for (const [key, expected] of Object.entries(currentQuestion.expectedAnswers)) {
      if (key === 'unit') continue; // Skip unit key
      const userAnswer = answers[key]?.trim().toLowerCase();
      const expectedStr = String(expected).toLowerCase();
      
      // Allow for some flexibility (numeric tolerance)
      const userNum = parseFloat(userAnswer);
      const expectedNum = parseFloat(expectedStr);
      
      if (!isNaN(userNum) && !isNaN(expectedNum)) {
        // Numeric comparison with 5% tolerance
        const tolerance = expectedNum * 0.05;
        if (Math.abs(userNum - expectedNum) > tolerance) {
          correct = false;
        }
      } else if (userAnswer !== expectedStr) {
        correct = false;
      }
    }

    // Update progress
    updateProgress(user.id, currentQuestion.module, correct);
    
    // Reload progress
    loadProgress(user.id);

    return correct;
  }, [currentQuestion, user, loadProgress]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Progress */}
          <div className="lg:col-span-1 space-y-6">
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
          <div className="lg:col-span-7 xl:col-span-8">
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
        onClose={() => user && setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}

