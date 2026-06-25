import Link from 'next/link';
import { Shield, Home, SearchX } from 'lucide-react';

/**
 * Friendly 404 page. Server component (no event handlers needed beyond the
 * next/link navigation), so the missing-route HTML is rendered without a
 * client JS bundle.
 *
 * Dark cyber/tech palette matches the rest of the app: slate base with
 * emerald accent. The 404 numeral itself glows like a HUD readout to
 * reinforce the IHK / Fachinformatiker study-tool vibe.
 */
export default function NotFound() {
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

        <div className="relative mb-2 select-none">
          <div
            aria-hidden
            className="text-[7rem] sm:text-[9rem] font-bold leading-none font-mono text-emerald-400/15 blur-[2px]"
          >
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[5rem] sm:text-[6.5rem] font-bold font-mono text-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]">
              404
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2 text-slate-500">
          <SearchX className="w-4 h-4" />
          <span className="text-xs font-mono uppercase tracking-wider">
            Route nicht gefunden
          </span>
        </div>

        <h1 className="mt-6 text-2xl sm:text-3xl font-semibold text-slate-100">
          Diese Seite existiert nicht.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
          Vielleicht ist der Link veraltet oder du hast dich vertippt. Zurück
          im Dashboard geht es mit einem Klick — deine Lerneinheit wartet
          schon.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Zurück zum Lernen
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-600 font-mono">
          Fehler-Code: 404 · Route nicht im Routing-Tree
        </p>
      </div>
    </div>
  );
}
