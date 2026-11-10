'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { Shield, User, LogOut, GraduationCap } from 'lucide-react';
import StudyCard from './components/StudyCard';
import SubnettingReplay from './components/SubnettingReplay';
import { useSubnettingReplay } from './lib/useSubnettingReplay';
import AuthModal from './components/AuthModal';
import ThemeSelector, { useDesktopNavigation } from './components/ThemeSelector';
import AppearanceSelector from './components/AppearanceSelector';
import ProgressDashboard from './components/ProgressDashboard';
import SqlTrainer from './components/SqlTrainer';
import TroubleshootingTrainer from './components/TroubleshootingTrainer';
import AlgorithmTracingTrainer from './components/AlgorithmTracingTrainer';
import AccessControlTrainer from './components/AccessControlTrainer';
import TrainingRun from './components/TrainingRun';
import BackupRecoveryTrainer from './components/BackupRecoveryTrainer';
import CostComparisonTrainer from './components/CostComparisonTrainer';
import ProjectPlanningTrainer from './components/ProjectPlanningTrainer';
import DatabaseDesignTrainer from './components/DatabaseDesignTrainer';
import NetworkPlanningTrainer from './components/NetworkPlanningTrainer';
import { Question, User as UserType } from './types';
import {
  generateUniqueUser,
  getUserByHash,
  getAllProgress,
  updateProgress
} from './lib/auth';
import { validateQuestionAnswers } from './lib/answerValidation';
import { toCanonicalModuleId } from './lib/moduleIds';
import { useLastFocusWithin } from './lib/useLastFocusWithin';
import { getModuleTopic } from './lib/moduleTopics';
import { isModuleId, MODULE_NAMES } from './lib/modules';
import { GENERATORS } from './lib/generators/registry';

// Capture identities require secure randomness. If unavailable, normal grading
// still works and the replay hook reports that the attempt was not saved.
function createReplayAttemptId(): string | null {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    if (!globalThis.crypto?.getRandomValues) return null;
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch { return null; }
}

export default function Home() {
  const [user, setUser] = useState<UserType | null>(null);
  const [accessHash, setAccessHash] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<{ module: string; questions_attempted: number; questions_correct: number; streak_days?: number | null }[]>([]);
  const [progressError, setProgressError] = useState<{ kind: 'load' | 'write'; message: string } | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingModule, setPendingModule] = useState<string | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [autoFocusAnswers, setAutoFocusAnswers] = useState(true);
  const [replayOpen, setReplayOpen] = useState(false);
  const [replayHasStarted, setReplayHasStarted] = useState(false);
  const [replaySession, setReplaySession] = useState(0);
  const replay = useSubnettingReplay(accessHash, replaySession);
  const { invalidate: invalidateReplay } = replay;
  const pendingReplay = useRef<(() => void) | null>(null);
  const attempt = useRef<{ question: Question; id: string | null; checked: boolean } | null>(null);
  const desktop = useDesktopNavigation();
  const workspace = useRef<HTMLDivElement>(null);
  const pageTitle = useRef<HTMLHeadingElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const selectionTrigger = useRef<HTMLElement | null>(null);
  const progressPanel = useRef<HTMLDivElement>(null);
  const progressRegion = useRef<HTMLElement>(null);
  const lastProgressFocus = useLastFocusWithin(progressRegion);
  const progressToggle = useRef<HTMLButtonElement>(null);
  const replayEntry = useRef<HTMLButtonElement>(null);
  const previousDesktop = useRef(desktop);
  const focusSelection = useRef(false);
  const focusWorkspaceHeading = useCallback(() => {
    const heading = Array.from(workspace.current?.querySelectorAll<HTMLElement>('h2') ?? []).find(item => !item.closest('[hidden]'));
    if (heading) { heading.tabIndex = -1; heading.focus(); }
  }, []);

  useEffect(() => {
    if (!focusSelection.current) return;
    focusSelection.current = false;
    // Children schedule their normal question autofocus first. Module navigation
    // ends at the heading; next-question autofocus remains unchanged.
    const frame = requestAnimationFrame(focusWorkspaceHeading);
    return () => cancelAnimationFrame(frame);
  }, [currentModule, focusWorkspaceHeading]);
  useEffect(() => { if (pendingModule) continueButton.current?.focus(); }, [pendingModule]);
  useEffect(() => {
    if (!replayOpen) return;
    const frame = requestAnimationFrame(focusWorkspaceHeading);
    return () => cancelAnimationFrame(frame);
  }, [replayOpen, focusWorkspaceHeading]);
  useLayoutEffect(() => {
    if (previousDesktop.current !== desktop) {
      const active = document.activeElement;
      const focused = active === document.body || active === document.documentElement ? lastProgressFocus.current : active;
      if (!desktop && progressPanel.current?.contains(focused)) progressToggle.current?.focus();
      if (desktop && focused === progressToggle.current) progressPanel.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
      previousDesktop.current = desktop;
    }
  }, [desktop, lastProgressFocus]);


  const progressIdentity = useRef<string | null>(null);
  const progressRequest = useRef(0);
  const progressSession = useRef(0);

  const loadProgress = useCallback(async (hash: string) => {
    if (progressIdentity.current !== hash) return;
    const request = ++progressRequest.current;
    try {
      const userProgress: { module: string; questions_attempted: number; questions_correct: number; streak_days?: number | null }[] = await getAllProgress(hash);
      if (progressIdentity.current !== hash || request !== progressRequest.current) return;
      setProgressError(previous => previous?.kind === 'load' ? null : previous);
      setProgress(userProgress);
      
      // Calculate streak (simplified)
      const maxStreak = Math.max(0, ...userProgress.map(p => p.streak_days ?? 0));
      setStreakDays(maxStreak);
    } catch {
      if (progressIdentity.current === hash && request === progressRequest.current) {
        setProgressError(previous => previous?.kind === 'write' ? previous : { kind: 'load', message: 'Fortschritt konnte nicht geladen werden. Bitte den Browserspeicher prüfen.' });
      }
    }
  }, []);

  const recordProgress = useCallback(async (hash: string, module: string, correct: boolean) => {
    const session = progressSession.current;
    try {
      const saved = await updateProgress(hash, module, correct);
      if (progressIdentity.current !== hash || progressSession.current !== session) return;
      if (saved === null) setProgressError(previous => previous?.kind === 'write' ? previous : { kind: 'write', message: 'Die Speicherung des Fortschritts konnte nicht bestätigt werden. Spätere erfolgreiche Prüfungen tragen den betroffenen Versuch nicht automatisch nach; bitte die Verbindung prüfen.' });
      await loadProgress(hash);
    } catch {
      if (progressIdentity.current === hash && progressSession.current === session) {
        setProgressError({ kind: 'write', message: 'Fortschritt konnte nicht gespeichert werden. Spätere erfolgreiche Prüfungen tragen den betroffenen Versuch nicht automatisch nach; bitte den Browserspeicher prüfen.' });
      }
    }
  }, [loadProgress]);

  const handleLogin = useCallback(async (hash: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userData = await getUserByHash(hash);
      if (userData) {
        invalidateReplay();
        setReplaySession(value => value + 1);
        pendingReplay.current = null;
        setReplayOpen(false);
        ++progressSession.current;
        progressIdentity.current = hash;
        ++progressRequest.current;
        setProgressError(null);
        setPendingModule(null);
        setProgress([]);
        setStreakDays(0);
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
  }, [loadProgress, invalidateReplay]);

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
          ++progressSession.current;
          progressIdentity.current = storedHash;
          ++progressRequest.current;
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
    invalidateReplay();
    setReplaySession(value => value + 1);
    ++progressSession.current;
    progressIdentity.current = null;
    ++progressRequest.current;
    setProgressError(null);
    setUser(null);
    setAccessHash(null);
    setPendingModule(null);
    pendingReplay.current = null;
    setReplayOpen(false);
    setCurrentModule(null);
    setCurrentQuestion(null);
    setProgress([]);
    setStreakDays(0);
    localStorage.removeItem('ihk_access_hash');
    setShowAuthModal(true);
  };

  const commitModule = (module: string) => {
    pendingReplay.current = null;
    setReplayOpen(false);
    setPendingModule(null);
    focusSelection.current = true;
    setAutoFocusAnswers(false);
    setCurrentModule(module);
    generateNewQuestion(module);
  };
  const handleSelectModule = (module: string) => {
    const canonicalModule = toCanonicalModuleId(module);
    if (!isModuleId(canonicalModule) || (canonicalModule === 'sql' && !accessHash)) return;
    if (canonicalModule === currentModule && (!replayOpen || canonicalModule === 'ap2TrainingRun')) {
      setReplayOpen(false);
      setPendingModule(null);
      if (replayOpen) requestAnimationFrame(focusWorkspaceHeading); else focusWorkspaceHeading();
      return;
    }
    if (currentModule === 'ap2TrainingRun') {
      selectionTrigger.current = document.activeElement as HTMLElement | null;
      setPendingModule(canonicalModule);
      // Re-requesting the same target does not rerun the pending-state effect.
      if (pendingModule === canonicalModule) continueButton.current?.focus();
      return;
    }
    commitModule(canonicalModule);
  };
  const cancelDeparture = () => {
    pendingReplay.current = null;
    setPendingModule(null);
    const previous = selectionTrigger.current;
    const fallback = document.querySelector<HTMLElement>(desktop ? 'nav[aria-label="Lernmodule"] .navigation-panel button' : 'nav[aria-label="Lernmodule"] > button');
    (previous?.isConnected && previous !== document.body && previous !== document.documentElement && previous.getClientRects().length ? previous : fallback)?.focus();
  };

  const generateNewQuestion = (module: string) => {
    // Dedicated trainers do not use the exact-answer question registry.
    if (!isModuleId(module) || module === 'ap2AccessControl' || module === 'ap2TrainingRun' || module === 'sql' || module === 'ap2NetworkPlanning' || module === 'ap2DatabaseDesign' || module === 'ap2ProjectPlanning' || module === 'ap2AlgorithmTracing' || module === 'ap2Troubleshooting' || module === 'ap2CostComparison' || module === 'ap2BackupRecovery') return;
    const question = GENERATORS[module]();
    attempt.current = { question, id: module === 'subnetting' ? createReplayAttemptId() : null, checked: false };
    setCurrentQuestion(question);
  };

  const handleCheckAnswer = useCallback((answers: Record<string, string>): boolean => {
    if (!currentQuestion) return false;

    const correct = validateQuestionAnswers(currentQuestion, answers);

    if (accessHash) {
      recordProgress(accessHash, currentQuestion.module, correct);
      const source = attempt.current;
      if (source && source.question === currentQuestion && !source.checked) {
        source.checked = true;
        if (!correct && currentQuestion.module === 'subnetting') replay.capture(currentQuestion, source.id);
      }
    }

    return correct;
  }, [currentQuestion, accessHash, recordProgress, replay]);

  const handleNextQuestion = () => {
    setAutoFocusAnswers(true);
    if (currentModule) {
      generateNewQuestion(currentModule);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div role="status" aria-label="Lernumgebung wird geladen" className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header data-study-chrome className="relative lg:sticky top-0 z-40 border-b border-line bg-canvas backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-soft rounded-lg">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 ref={pageTitle} tabIndex={-1} className="text-lg sm:text-xl font-bold text-ink">
                  IHK Study Trainer
                </h1>
                <p className="text-xs text-muted hidden sm:block">
                  Fachinformatiker Systemintegration
                </p>
              </div>
            </div>

            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
              <AppearanceSelector />
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-line">
                    <User className="w-4 h-4 text-muted" />
                    <code className="text-sm font-mono text-accent">
                      {accessHash?.slice(0, 6)}...
                    </code>
                  </div>
                  <button
                    aria-label="Abmelden"
                    onClick={handleLogout}
                    className="p-2 text-muted hover:text-danger hover:bg-danger-soft rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex min-w-0 items-center gap-2 px-3 sm:px-4 py-2 bg-action hover:bg-action-hover text-onaction font-medium rounded-lg transition-colors"
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
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {progressError && <p role="alert" className="mb-4 rounded-lg border border-warning bg-warning-soft p-3 text-warning">{progressError.message}</p>}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside data-study-chrome className="trainer-sidebar flex min-w-0 flex-col gap-4 lg:w-[260px] lg:shrink-0" aria-label="Lernbereich auswählen">
            <div className="order-1 lg:order-2 rounded-xl border border-line bg-surface p-3">
              <button ref={replayEntry} type="button" onClick={() => { if (replayOpen) { focusWorkspaceHeading(); return; } setAutoFocusAnswers(false); setReplayHasStarted(false); setReplayOpen(true); replay.refresh(); }} className="font-semibold text-left">Gespeicherte Subnetting-Fehler</button>
              <p className="text-sm text-muted">{replay.status === 'guest' ? 'Anmeldung erforderlich' : replay.status === 'loading' ? 'Verbindung wird hergestellt …' : replay.status === 'unavailable' ? 'Synchronisierung nicht verfügbar' : 'Fehlerliste verfügbar'}</p>
              {replay.message && <p role="status" className="text-sm">{replay.message}</p>}
            </div>
            <div className="order-1 lg:order-2 rounded-xl border border-line bg-surface p-3">
              <ThemeSelector currentModule={currentModule} onSelectModule={handleSelectModule}
                isAuthenticated={!!accessHash} onDismiss={cancelDeparture} />
            </div>
            {user && <section ref={progressRegion} className="order-2 lg:order-1 rounded-xl border border-line bg-surface p-3" aria-label="Lernfortschritt">
              <button ref={progressToggle} type="button" className="min-h-11 w-full text-left font-semibold lg:hidden" aria-expanded={progressOpen} aria-controls="progress-panel" onClick={() => {
                if (progressOpen && progressPanel.current?.contains(document.activeElement)) progressToggle.current?.focus();
                setProgressOpen(old => !old);
              }}>Fortschritt</button>
              <div ref={progressPanel} id="progress-panel" hidden={!desktop && !progressOpen}>
                <ProgressDashboard key={accessHash} progress={progress} streakDays={streakDays} onSelectModule={handleSelectModule} />
              </div>
            </section>}
          </aside>

          <div ref={workspace} className="workspace min-w-0 flex-1">
            {currentModule && isModuleId(currentModule) && <p className="mb-3 text-sm text-muted">{getModuleTopic(currentModule)?.label}{getModuleTopic(currentModule) ? ' / ' : ''}{MODULE_NAMES[currentModule]}</p>}
            {pendingModule && (isModuleId(pendingModule) || pendingModule === '__replay__') && <section role="group" aria-label="Trainingslauf verlassen" className="mb-5 space-y-3 rounded-xl border border-warning bg-warning-soft p-4" onKeyDown={event => {
              if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelDeparture(); }
            }}>
              <p className="font-semibold">Trainingslauf verlassen? Sitzungseingaben und Auswertung gehen verloren. Gespeicherter Themenfortschritt bleibt erhalten.</p>
              <p>Ziel: {pendingModule === '__replay__' ? 'Subnetting-Wiederholung' : MODULE_NAMES[pendingModule as keyof typeof MODULE_NAMES]}</p>
              <div className="flex flex-wrap gap-2">
                <button ref={continueButton} type="button" className="min-h-11 rounded-lg border border-control bg-surface px-4" onClick={cancelDeparture}>Weiterarbeiten</button>
                <button type="button" className="min-h-11 rounded-lg bg-action px-4 font-semibold text-onaction" onClick={() => { if (pendingModule === '__replay__') { const start = pendingReplay.current; pendingReplay.current = null; setPendingModule(null); setCurrentModule(null); setCurrentQuestion(null); setReplayHasStarted(true); start?.(); } else commitModule(pendingModule); }}>Trainingslauf verlassen</button>
              </div>
            </section>}
            {replayOpen && <SubnettingReplay key={accessHash ?? 'guest'} records={replay.records} status={replay.status} message={replay.message} onRefresh={replay.refresh} onClear={replay.clear} onResolve={replay.resolve}
              onStart={start => { if (currentModule === 'ap2TrainingRun') { selectionTrigger.current = document.activeElement as HTMLElement; pendingReplay.current = start; setPendingModule('__replay__'); } else { setCurrentModule(null); setCurrentQuestion(null); setReplayHasStarted(true); start(); } }}
              onReturn={() => handleSelectModule('subnetting')} /> }
            {replayOpen && <button type="button" onClick={() => { setPendingModule(null); pendingReplay.current = null; if (!replayHasStarted) { setReplayOpen(false); requestAnimationFrame(() => replayEntry.current?.focus()); } else commitModule('subnetting'); }}>Fehlerliste schließen</button>}
            <div hidden={replayOpen} inert={replayOpen}>
            {currentModule === 'ap2AccessControl' ? (
              <AccessControlTrainer key={accessHash ?? 'guest'} isAuthenticated={!!accessHash}
                onAttempt={correct => {
                  if (accessHash) recordProgress(accessHash, 'ap2AccessControl', correct);
                }} />
            ) : currentModule === 'ap2TrainingRun' ? (
              <TrainingRun key={accessHash ?? 'guest'} isAuthenticated={!!accessHash}
                onAttempt={(module, correct) => {
                  if (accessHash) recordProgress(accessHash, module, correct);
                }} />
            ) : currentModule === 'ap2BackupRecovery' ? (
              <BackupRecoveryTrainer key={accessHash ?? 'guest'} isAuthenticated={!!accessHash}
                onAttempt={correct => {
                  if (accessHash) recordProgress(accessHash, 'ap2BackupRecovery', correct);
                }} />
            ) : currentModule === 'ap2CostComparison' ? (
              <CostComparisonTrainer key={accessHash ?? 'guest'} isAuthenticated={!!accessHash}
                onAttempt={correct => {
                  if (accessHash) recordProgress(accessHash, 'ap2CostComparison', correct);
                }} />
            ) : currentModule === 'ap2Troubleshooting' ? (
              <TroubleshootingTrainer key={accessHash ?? 'guest'} isAuthenticated={!!accessHash}
                onAttempt={correct => {
                  if (accessHash) recordProgress(accessHash, 'ap2Troubleshooting', correct);
                }} />
            ) : currentModule === 'ap2AlgorithmTracing' ? (
              <AlgorithmTracingTrainer key={accessHash ?? 'guest'} isAuthenticated={!!accessHash}
                onAttempt={correct => {
                  if (accessHash) recordProgress(accessHash, 'ap2AlgorithmTracing', correct);
                }} />
            ) : currentModule === 'ap2ProjectPlanning' ? (
              <ProjectPlanningTrainer key={accessHash ?? 'guest'} isAuthenticated={!!accessHash}
                onAttempt={correct => {
                  if (accessHash) recordProgress(accessHash, 'ap2ProjectPlanning', correct);
                }} />
            ) : currentModule === 'ap2DatabaseDesign' ? (
              <DatabaseDesignTrainer key={accessHash ?? 'guest'} isAuthenticated={!!accessHash}
                onAttempt={correct => {
                  if (accessHash) recordProgress(accessHash, 'ap2DatabaseDesign', correct);
                }} />
            ) : currentModule === 'ap2NetworkPlanning' ? (
              <NetworkPlanningTrainer
                isAuthenticated={!!accessHash}
                onAttempt={(correct) => {
                  if (accessHash) {
                    recordProgress(accessHash, 'ap2NetworkPlanning', correct);
                  }
                }}
              />
            ) : currentModule === 'sql' ? (
              <SqlTrainer
                accessHash={accessHash}
                onCorrect={() => {
                  if (accessHash) {
                    recordProgress(accessHash, 'sql', true);
                  }
                }}
                onIncorrect={() => {
                  if (accessHash) {
                    recordProgress(accessHash, 'sql', false);
                  }
                }}
              />
            ) : (
              <StudyCard
                autoFocusAnswers={autoFocusAnswers && !replayOpen}
                shortcutsActive={!replayOpen}
                question={currentQuestion}
                onCheckAnswer={handleCheckAnswer}
                onNextQuestion={handleNextQuestion}
              />
            )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted">
              IHK Study Trainer © {new Date().getFullYear()}
            </p>
            <p className="text-xs text-muted">
              Für die IHK-Prüfung zum Fachinformatiker Systemintegration
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        fallbackFocusRef={pageTitle}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
