'use client';

import { useState, useEffect, useRef, type ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  LogIn,
  Key,
  ClipboardPaste,
  CircleAlert,
  CircleCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (hash: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: () => Promise<string | null>;
}

/** Access hash format: 12 alphanumeric chars, case-sensitive. */
const HASH_LENGTH = 12;
const HASH_FORMAT = /^[A-Za-z0-9]+$/;

/** Extract only the characters that match the access-hash format from
 *  arbitrary clipboard content (handles pasted whitespace, newlines,
 *  surrounding "Here is my code: …" prose, leading BOM, etc.).
 *
 *  Strategy: match a 12-char alphanumeric run that's bounded by
 *  non-alphanumerics (or start/end of string). This handles both
 *  "ab12cd34ef56" by itself and
 *  "Hier dein Code: ab12cd34ef56 — viel Erfolg" gracefully: the colon
 *  and em-dash delimit the code, so we don't accidentally pick up
 *  neighboring words like "HierdeinCode".
 *  If no such bounded run exists, fall back to the first HASH_LENGTH
 *  alphanumeric chars (best-effort). */
function normalizePastedHash(raw: string): string {
  const boundedRe = new RegExp(
    `(?:^|[^A-Za-z0-9])([A-Za-z0-9]{${HASH_LENGTH}})(?:[^A-Za-z0-9]|$)`,
  );
  const bounded = raw.match(boundedRe);
  if (bounded) return bounded[1];
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '');
  return cleaned.slice(0, HASH_LENGTH);
}

function validateHashShape(raw: string): {
  trimmed: string;
  length: number;
  lengthOk: boolean;
  formatOk: boolean;
  isValid: boolean;
} {
  const trimmed = raw.trim();
  const length = trimmed.length;
  const formatOk = length === 0 || HASH_FORMAT.test(trimmed);
  const lengthOk = length === HASH_LENGTH;
  return { trimmed, length, lengthOk, formatOk, isValid: lengthOk && formatOk };
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [mode, setMode] = useState<'select' | 'register' | 'login'>('select');
  const [hash, setHash] = useState('');
  const [inputHash, setInputHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Ignore obsolete view feedback while retaining created codes; requests are not retried/cancelled.
  const viewVersion = useRef(0);
  const changeView = (next: 'select' | 'login' | 'register') => {
    ++viewVersion.current;
    setError('');
    setMode(next);
  };
  /** True for ~3s after a paste, so the "Eingefügt" hint is visible. */
  const [pasteHint, setPasteHint] = useState(false);

  useEffect(() => {
    const generationRef = viewVersion;
    ++generationRef.current;
    if (isOpen) {
      setMode('select');
      setInputHash('');
      setError('');
      setCopied(false);
      setPasteHint(false);
    }
    return () => { ++generationRef.current; };
  }, [isOpen]);

  const handleRegister = async () => {
    if (hash) { changeView('register'); return; }
    const version = viewVersion.current;
    setLoading(true);
    setError('');
    try {
      const newHash = await onRegister();
      if (newHash) {
        // Preserve a created credential even if its request outlived the chosen view.
        setHash(newHash);
        if (version === viewVersion.current) setMode('register');
      } else if (version === viewVersion.current) {
        setError('Fehler bei der Registrierung. Bitte versuche es erneut.');
      }
    } catch {
      if (version === viewVersion.current) setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const version = viewVersion.current;
    const { trimmed, isValid } = validateHashShape(inputHash);
    if (!trimmed) {
      setError('Bitte gib einen gültigen 12-stelligen Code ein.');
      return;
    }
    if (!isValid) {
      // Most common cause: pasted text contained more than just the code,
      // or a wrong character snuck in. Guide the user to the inline
      // feedback below the input.
      setError(
        trimmed.length !== HASH_LENGTH
          ? `Der Code muss genau ${HASH_LENGTH} Zeichen haben (aktuell: ${trimmed.length}).`
          : 'Der Code enthält ungültige Zeichen. Erlaubt: A–Z, a–z, 0–9.',
      );
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await onLogin(trimmed);
      if (result.success) setHash(''); // Clear pending credentials at any successful identity transition.
      if (version !== viewVersion.current) return;
      if (result.success) {
        setInputHash(''); // Clear the input for next time
      } else {
        setError(result.error || 'Anmeldung fehlgeschlagen.');
      }
    } catch {
      if (version === viewVersion.current) setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithHash = async () => {
    const version = viewVersion.current;
    setLoading(true);
    setError('');
    try {
      const result = await onLogin(hash);
      if (result.success) setHash('');
      if (version !== viewVersion.current) return;
      if (!result.success) {
        setError(result.error || 'Anmeldung fehlgeschlagen.');
      }
    } catch {
      if (version === viewVersion.current) setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = hash;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /** Pasted input — intercept the raw clipboard text, extract a valid hash
   *  from surrounding noise, and write the cleaned value into this controlled
   *  input. That keeps the counter/validation tied to normalized codes only. */
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const normalized = normalizePastedHash(pasted);
    e.preventDefault();
    if (!normalized) {
      setError('Eingefügter Text enthält keinen gültigen Code.');
      setPasteHint(false);
      return;
    }
    setInputHash(normalized);
    setError('');
    setPasteHint(true);
  };

  useEffect(() => {
    if (!pasteHint) return;
    const timer = window.setTimeout(() => setPasteHint(false), 3000);
    return () => window.clearTimeout(timer);
  }, [pasteHint]);

  if (!isOpen) return null;

  // For the login view: derived validation state for inline feedback.
  const loginValidation = validateHashShape(inputHash);
  const loginHintClass = !loginValidation.length
    ? 'text-muted'
    : loginValidation.isValid
      ? 'text-accent'
      : loginValidation.formatOk
        ? 'text-warning'
        : 'text-danger';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-canvas backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-surface rounded-2xl border border-line shadow-2xl shadow-ink/10 max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <h2 className="text-xl font-semibold text-ink">
              {mode === 'select' && 'Anmelden'}
              {mode === 'register' && 'Dein Zugangscode'}
              {mode === 'login' && 'Mit Code anmelden'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-ink hover:bg-subtle rounded-lg transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div id="auth-error" role="alert" aria-atomic="true" className={error ? 'mb-4 p-3 bg-danger-soft border border-danger rounded-lg' : 'sr-only'}>
              {error && <p className="text-sm text-danger">{error}</p>}
            </div>
            <p role="status" className={loading || (hash && mode !== 'register') ? 'mb-4 text-sm text-ink' : 'sr-only'}>
              {loading ? 'Eine Anfrage läuft noch. Schließen bricht die Anfrage nicht ab.' : hash && mode !== 'register' ? 'Ein Zugangscode wurde erstellt und ist in dieser Sitzung noch verfügbar.' : ''}
            </p>
            {hash && mode !== 'register' && (
              <div className="mb-4 space-y-3 rounded-lg border border-warning bg-warning-soft p-3">
                <p className="text-sm text-warning">Sichere ihn, bevor du dich mit einem anderen Code anmeldest. Nach erfolgreicher Anmeldung wird diese Codeanzeige zurückgesetzt. Beim Neuladen oder Verlassen der Seite geht ein noch nicht gesicherter Code verloren.</p>
                <button type="button" onClick={() => changeView('register')} disabled={loading} className="w-full rounded-lg border border-control px-3 py-2 text-sm text-ink disabled:bg-subtle disabled:text-muted disabled:border-line">Erstellten Zugangscode anzeigen</button>
              </div>
            )}
            {mode === 'select' && (
              <div className="space-y-4">
                <p className="text-muted text-center">
                  Wähle eine Option, um fortzufahren
                </p>

                <p className="text-muted text-sm text-center">
                  Anmeldung nur erforderlich für SQL Aufgaben und Übungsstand sichern. Sonst X drücken.
                </p>
                
                <button
                  onClick={handleRegister}
                  disabled={loading || !!hash}
                  className="w-full flex items-center gap-3 p-4 bg-subtle hover:bg-subtle border border-line hover:border-accent rounded-xl transition-all group"
                >
                  <div className="p-3 bg-accent-soft rounded-lg group-hover:bg-accent-soft transition-colors">
                    <Key className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-ink">Zugangscode erstellen</p>
                    <p className="text-sm text-muted">Neuen Account anlegen</p>
                  </div>
                </button>

                <button
                  onClick={() => changeView('login')}
                  className="w-full flex items-center gap-3 p-4 bg-subtle hover:bg-subtle border border-line hover:border-accent rounded-xl transition-all group"
                >
                  <div className="p-3 bg-subtle rounded-lg group-hover:bg-subtle transition-colors">
                    <LogIn className="w-6 h-6 text-muted" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-ink">Ich habe einen Code</p>
                    <p className="text-sm text-muted">Mit bestehendem Code anmelden</p>
                  </div>
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-6">
                <div className="p-4 bg-warning-soft border border-warning rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Wichtig!</p>
                      <p className="text-sm text-warning mt-1">
                        Speichere diesen Code an einem sicheren Ort. Er kann nicht wiederhergestellt werden!
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Dein Zugangscode
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-canvas border border-line rounded-lg">
                      <code className="text-2xl font-mono text-accent tracking-wider">
                        {hash}
                      </code>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-3 bg-subtle hover:bg-subtle border border-line rounded-lg transition-colors"
                      aria-label="Code in die Zwischenablage kopieren"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-accent" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Tipp: Mit dem Button oben kopieren und sicher notieren.
                  </p>
                </div>

                <button
                  onClick={handleLoginWithHash}
                  disabled={loading}
                  className="w-full py-3 bg-action hover:bg-action-hover disabled:bg-accent-soft disabled:text-accent text-onaction font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Anmeldung läuft...' : 'Weiter zum Lernen'}
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="access-hash-input"
                    className="flex items-center justify-between text-sm font-medium text-muted mb-2"
                  >
                    <span>Zugangscode</span>
                    <span className={`text-xs font-mono ${loginHintClass}`}>
                      {loginValidation.length}/{HASH_LENGTH}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="access-hash-input"
                      type="text"
                      value={inputHash}
                      onChange={(e) => {
                        // Allow only alphanumeric characters as the user
                        // types — paste is normalized separately above.
                        const next = e.target.value
                          .replace(/[^A-Za-z0-9]/g, '')
                          .slice(0, HASH_LENGTH);
                        setInputHash(next);
                        // Clear any prior error once the user is editing.
                        if (error) setError('');
                      }}
                      onPaste={handlePaste}
                      maxLength={HASH_LENGTH}
                      disabled={loading}
                      placeholder="Ab12cD34eF56"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? 'access-hash-hint auth-error' : 'access-hash-hint'}
                      className={`w-full px-4 py-3 pr-11 bg-canvas border rounded-lg text-ink font-mono text-lg tracking-wider placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all disabled:bg-subtle disabled:text-muted disabled:border-line ${
                        error
                          ? 'border-danger focus:border-danger focus:ring-danger'
                          : loginValidation.isValid
                            ? 'border-accent focus:border-accent'
                            : 'border-control focus:border-accent'
                      }`}
                    />
                    {/* Inline status icon — only renders once something's
                        in the input, so the placeholder isn't cluttered. */}
                    {loginValidation.length > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {loginValidation.isValid ? (
                          <CircleCheck className="w-5 h-5 text-accent" />
                        ) : !loginValidation.formatOk ? (
                          <CircleAlert className="w-5 h-5 text-danger" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  <p
                    id="access-hash-hint"
                    className={`mt-2 text-xs flex items-center gap-1.5 transition-colors ${loginHintClass}`}
                  >
                    {loginValidation.length === 0 ? (
                      <>12-stelliger alphanumerischer Code – Groß-/Kleinschreibung beachten</>
                    ) : loginValidation.isValid ? (
                      <>
                        <CircleCheck className="w-3 h-3" />
                        Format OK – bereit zum Anmelden.
                      </>
                    ) : !loginValidation.formatOk ? (
                      <>
                        <CircleAlert className="w-3 h-3" />
                        Ungültige Zeichen. Erlaubt: A–Z, a–z, 0–9.
                      </>
                    ) : (
                      <>
                        Noch {HASH_LENGTH - loginValidation.length} Zeichen{' '}
                        {HASH_LENGTH - loginValidation.length === 1 ? 'fehlt.' : 'fehlen.'}
                      </>
                    )}
                  </p>
                </div>

                {/* Paste confirmation — visible briefly after a paste. */}
                <AnimatePresence>
                  {pasteHint && (
                    <motion.div
                      key="paste-hint"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-2 px-3 py-2 bg-accent-soft border border-accent rounded-lg text-sm text-accent"
                    >
                      <ClipboardPaste className="w-4 h-4" />
                      Code aus Zwischenablage übernommen.
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleLogin}
                  disabled={loading || !loginValidation.isValid}
                  className="w-full py-3 bg-action hover:bg-action-hover disabled:bg-subtle disabled:text-muted text-onaction font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Anmeldung läuft...' : 'Anmelden'}
                </button>

                <button
                  onClick={() => changeView('select')}
                  className="w-full py-3 border border-line hover:border-control text-muted hover:text-ink rounded-lg transition-colors"
                >
                  Zurück
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
