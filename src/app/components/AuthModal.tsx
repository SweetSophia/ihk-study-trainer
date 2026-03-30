'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, AlertTriangle, LogIn, Key } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (hash: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: () => Promise<string | null>;
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [mode, setMode] = useState<'select' | 'register' | 'login'>('select');
  const [hash, setHash] = useState('');
  const [inputHash, setInputHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode('select');
      setHash('');
      setInputHash('');
      setError('');
      setCopied(false);
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
    if (!inputHash.trim() || inputHash.length !== 12) {
      setError('Bitte gib einen gültigen 12-stelligen Code ein.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await onLogin(inputHash.trim());
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
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
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
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

  if (!isOpen) return null;

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
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
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
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Zugangscode
                  </label>
                  <input
                    type="text"
                    value={inputHash}
                    onChange={(e) => setInputHash(e.target.value.toUpperCase())}
                    maxLength={12}
                    disabled={loading}
                    placeholder="XXXXXXXXXXXX"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-lg tracking-wider uppercase placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    12-stelliger alphanumerischer Code
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg">
                    <p className="text-sm text-rose-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:text-emerald-200 text-slate-950 font-semibold rounded-lg transition-colors"
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
