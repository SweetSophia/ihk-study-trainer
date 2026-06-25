'use client';

import { useState, useEffect, type ClipboardEvent } from 'react';
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
  /** True for ~3s after a paste, so the "Eingefügt" hint is visible. */
  const [pasteHint, setPasteHint] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode('select');
      setHash('');
      setInputHash('');
      setError('');
      setCopied(false);
      setPasteHint(false);
    }
  }, [isOpen]);

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const newHash = await onRegister();
      if (newHash) {
        setHash(newHash);
        setMode('register');
      } else {
        setError('Fehler bei der Registrierung. Bitte versuche es erneut.');
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
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
      if (result.success) {
        setInputHash(''); // Clear the input for next time
      } else {
        setError(result.error || 'Anmeldung fehlgeschlagen.');
      }
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithHash = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await onLogin(hash);
      if (result.success) {
        setHash(''); // Clear registered hash after successful login
      } else {
        setError(result.error || 'Anmeldung fehlgeschlagen.');
      }
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
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

  /** Pasted input — auto-extract the hash from surrounding noise and
   *  surface a brief confirmation so the user knows it landed. */
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const normalized = normalizePastedHash(pasted);
    // Use rAF + setTimeout so we apply AFTER React's default paste behavior
    // (which would otherwise put the full clipboard text into the input
    // and break our length-counter). We let the paste propagate, then
    // overwrite the input value with the cleaned hash on the next tick.
    e.preventDefault();
    if (!normalized) {
      setError('Eingefügter Text enthält keinen gültigen Code.');
      return;
    }
    setInputHash(normalized);
    setError('');
    setPasteHint(true);
    setTimeout(() => setPasteHint(false), 3000);
  };

  if (!isOpen) return null;

  // For the login view: derived validation state for inline feedback.
  const loginValidation = validateHashShape(inputHash);
  const loginHintClass = !loginValidation.length
    ? 'text-slate-500'
    : loginValidation.isValid
      ? 'text-emerald-400'
      : loginValidation.formatOk
        ? 'text-amber-400'
        : 'text-rose-400';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl shadow-slate-950/50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-slate-100">
              {mode === 'select' && 'Anmelden'}
              {mode === 'register' && 'Dein Zugangscode'}
              {mode === 'login' && 'Mit Code anmelden'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {mode === 'select' && (
              <div className="space-y-4">
                <p className="text-slate-400 text-center">
                  Wähle eine Option, um fortzufahren
                </p>

                <p className="text-slate-500 text-sm text-center">
                  Anmeldung nur erforderlich für SQL Aufgaben und Übungsstand sichern. Sonst X drücken.
                </p>
                
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/30 rounded-xl transition-all group"
                >
                  <div className="p-3 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                    <Key className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-200">Zugangscode erstellen</p>
                    <p className="text-sm text-slate-500">Neuen Account anlegen</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('login')}
                  className="w-full flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/30 rounded-xl transition-all group"
                >
                  <div className="p-3 bg-slate-700/50 rounded-lg group-hover:bg-slate-700 transition-colors">
                    <LogIn className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-200">Ich habe einen Code</p>
                    <p className="text-sm text-slate-500">Mit bestehendem Code anmelden</p>
                  </div>
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-6">
                <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-300">Wichtig!</p>
                      <p className="text-sm text-amber-400/80 mt-1">
                        Speichere diesen Code an einem sicheren Ort. Er kann nicht wiederhergestellt werden!
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Dein Zugangscode
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <code className="text-2xl font-mono text-emerald-400 tracking-wider">
                        {hash}
                      </code>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                      aria-label="Code in die Zwischenablage kopieren"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Tipp: Mit dem Button oben kopieren und sicher notieren.
                  </p>
                </div>

                <button
                  onClick={handleLoginWithHash}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:text-emerald-200 text-slate-950 font-semibold rounded-lg transition-colors"
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
                    className="flex items-center justify-between text-sm font-medium text-slate-400 mb-2"
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
                      aria-describedby="access-hash-hint"
                      className={`w-full px-4 py-3 pr-11 bg-slate-950 border rounded-lg text-slate-100 font-mono text-lg tracking-wider placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50 ${
                        error
                          ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/40'
                          : loginValidation.isValid
                            ? 'border-emerald-500/50 focus:border-emerald-500/50'
                            : 'border-slate-800 focus:border-emerald-500/50'
                      }`}
                    />
                    {/* Inline status icon — only renders once something's
                        in the input, so the placeholder isn't cluttered. */}
                    {loginValidation.length > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {loginValidation.isValid ? (
                          <CircleCheck className="w-5 h-5 text-emerald-400" />
                        ) : !loginValidation.formatOk ? (
                          <CircleAlert className="w-5 h-5 text-rose-400" />
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
                        Noch {HASH_LENGTH - loginValidation.length} Zeichen
                        {loginValidation.length === 1 ? '' : ''} fehlen.
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
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-300"
                    >
                      <ClipboardPaste className="w-4 h-4" />
                      Code aus Zwischenablage übernommen.
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg">
                    <p className="text-sm text-rose-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading || !loginValidation.isValid}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Anmeldung läuft...' : 'Anmelden'}
                </button>

                <button
                  onClick={() => setMode('select')}
                  className="w-full py-3 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300 rounded-lg transition-colors"
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
