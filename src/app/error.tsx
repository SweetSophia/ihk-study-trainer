'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Shield, RotateCcw, Home, AlertTriangle } from 'lucide-react';

/**
 * Client-side error boundary for the App Router. Next.js renders this when
 * a server component throws OR when a client-side error escapes the React
 * tree above it (we don't have per-component error boundaries, so this
 * catches the rest).
 *
 * Surface the real message in `console.error` (the Sentry/Vercel hook would
 * pick this up in prod) but show a friendly, grounded German message in
 * the UI. Never echo the raw stack trace to the user.
 */
interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log for diagnostics. We deliberately do NOT log any user data here.
    console.error('[ErrorBoundary] Caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex items-center justify-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-slate-400 uppercase tracking-[0.2em]">
            IHK Study Trainer
          </span>
        </div>

        <div className="mx-auto mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100">
          Etwas ist schiefgelaufen.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
          Ein unerwarteter Fehler hat die Seite gestoppt. Dein Fortschritt
          ist gespeichert. Versuche es nochmal — wenn es weiter passiert,
          lade die App neu.
        </p>

        {error.digest && (
          <p className="mt-4 text-xs font-mono text-slate-600">
            Fehler-ID: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <RotateCcw className="w-4 h-4" />
            Nochmal versuchen
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Zur Startseite
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-600">
          Tipp: Die Frage überspringen bringt dich zur nächsten Aufgabe.
        </p>
      </div>
    </div>
  );
}

