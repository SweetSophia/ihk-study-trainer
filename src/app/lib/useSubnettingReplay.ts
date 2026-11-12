'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Question } from '../types';
import { createSubnettingSnapshot, SubnettingReplayError, type SubnettingReplayState } from './subnettingReplay';
import { clearSubnettingReplays, isSubnettingReplayConfigured, loadSubnettingReplays, resolveSubnettingReplay, saveSubnettingReplay } from './subnettingReplayApi';

type Status = 'guest' | 'loading' | 'ready' | 'unavailable';
type View = { session: number; hash: string | null; status: Status; data: SubnettingReplayState | null; message: string | null; uncertain: boolean; loadFailed: boolean };
const initial = (hash: string | null, session: number): View => ({ session, hash, status: !hash ? 'guest' : isSubnettingReplayConfigured() ? 'loading' : 'unavailable', data: null, message: null, uncertain: false, loadFailed: false });

export function useSubnettingReplay(hash: string | null, session = 0) {
  const [view, setView] = useState<View>(() => initial(hash, session));
  const identity = useRef({ session: 0, hash: null as string | null, revision: 0, request: 0, epoch: 0, data: null as SubnettingReplayState | null });
  const refresh = useCallback(async () => {
    const ctx = identity.current; const account = ctx.hash; const revision = ctx.revision; const currentSession = ctx.session;
    if (!account || !isSubnettingReplayConfigured()) return;
    const request = ++ctx.request;
    setView(old => old.hash === account && old.session === currentSession ? { ...old, status: 'loading' } : old);
    try {
      const data = await loadSubnettingReplays(account);
      if (ctx.hash !== account || ctx.revision !== revision || ctx.request !== request) return;
      ctx.data = data;
      setView(old => ({ ...old, session: currentSession, hash: account, status: 'ready', data, loadFailed: false }));
    } catch {
      if (ctx.hash !== account || ctx.revision !== revision || ctx.request !== request) return;
      ctx.data = null;
      setView(old => ({ ...old, session: currentSession, hash: account, status: 'unavailable', data: null, loadFailed: true }));
    }
  }, []);
  useEffect(() => {
    const ctx = identity.current;
    ctx.hash = hash; ctx.session = session; ctx.revision++; ctx.request++; ctx.epoch++; ctx.data = null;
    // Reset account-scoped state at the same boundary as the external subscription.
    setView(initial(hash, session));
    if (hash && isSubnettingReplayConfigured()) void refresh();
    return () => { ctx.revision++; ctx.request++; ctx.epoch++; ctx.hash = null; ctx.data = null; };
  }, [hash, session, refresh]);

  const write = useCallback(async (kind: 'capture' | 'resolve' | 'clear', questionOrId?: Question | string, source?: string | null) => {
    const ctx = identity.current; const account = ctx.hash; const data = ctx.data;
    if (!account) return;
    if (kind === 'capture' && !source) {
      setView(old => ({ ...old, message: 'Diese Aufgabe wurde nicht für die Wiederholung gespeichert, weil keine sichere Aufgabenkennung erstellt werden konnte.' }));
      return;
    }
    if (!data || !isSubnettingReplayConfigured()) {
      setView(old => ({ ...old, message: kind === 'capture' ? 'Diese Aufgabe wurde nicht für die Wiederholung gespeichert. Die Fehlerliste ist noch nicht verfügbar.' : 'Die Fehlerliste ist noch nicht verfügbar.' }));
      return;
    }
    const revision = ctx.revision; const epoch = ctx.epoch;
    try {
      const result = kind === 'capture'
        ? await saveSubnettingReplay(account, data.generation, source!, createSubnettingSnapshot(questionOrId as Question))
        : kind === 'resolve'
          ? await resolveSubnettingReplay(account, data.generation, questionOrId as string)
          : await clearSubnettingReplays(account, data.generation);
      if (ctx.hash !== account || ctx.revision !== revision || ctx.epoch !== epoch) return;
      if (kind === 'clear' && result.status === 'cleared') { ctx.epoch++; ctx.request++; ctx.data = null; }
      const stale = result.status === 'stale' || result.status === 'missing';
      if (stale) ctx.data = null;
      setView(old => ({ ...old, uncertain: kind === 'clear' && result.status === 'cleared' ? false : old.uncertain, message: stale ? 'Die Fehlerliste hat sich geändert. Diese Änderung wurde nicht gespeichert; die Liste wird aktualisiert.' : kind === 'clear' ? 'Gespeicherte Fehler wurden gelöscht.' : null }));
      void refresh();
    } catch (error) {
      if (ctx.hash !== account || ctx.revision !== revision || ctx.epoch !== epoch) return;
      const definite = error instanceof SubnettingReplayError && (error.code === 'unavailable' || error.code === 'rejected');
      setView(old => ({ ...old, uncertain: old.uncertain || !definite, message: definite ? (error.code === 'unavailable' ? 'Die Änderung wurde nicht gespeichert. Die Fehlerliste ist derzeit nicht verfügbar.' : 'Die Änderung wurde nicht gespeichert. Sie wurde vom Server abgelehnt.') : null }));
    }
  }, [refresh]);

  const invalidate = useCallback(() => {
    const ctx = identity.current; ctx.revision++; ctx.request++; ctx.epoch++; ctx.hash = null; ctx.data = null;
  }, []);
  const visible = view.hash === hash && view.session === session ? view : initial(hash, session);
  return {
    status: visible.status, records: visible.data?.records ?? [], generation: visible.data?.generation ?? null, message: [visible.uncertain ? 'Eine frühere Änderung konnte nicht bestätigt werden und wird nicht automatisch erneut gesendet.' : null, visible.message ?? (visible.loadFailed ? 'Fehlerliste konnte nicht geladen werden.' : null)].filter(Boolean).join(' ') || null,
    refresh, invalidate,
    capture: (question: Question, source: string | null) => { void write('capture', question, source); },
    resolve: (id: string) => { void write('resolve', id); },
    clear: () => { void write('clear'); },
  };
}
