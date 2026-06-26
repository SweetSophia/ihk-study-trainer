/**
 * Celebration effects for learner motivation.
 *
 * - Lazy-imports `canvas-confetti` so the initial JS bundle stays small
 *   (confetti only ships when a celebration actually fires).
 * - Honours `prefers-reduced-motion`: returns immediately if the user has
 *   opted out at the OS/browser level.
 * - Session-persisted "already celebrated" flags live in `sessionStorage`
 *   so refreshes within the same tab/session don't double-trigger.
 *
 * Milestones for streak celebrations follow standard habit-formation
 * thresholds (1, 3, 7, 14, 30, 100 days).
 */

import type { Options as ConfettiOptions } from 'canvas-confetti';

const FIRST_CORRECT_KEY = 'ihk_celebrated_first_correct';
const STREAK_MILESTONE_PREFIX = 'ihk_celebrated_streak_';

export const STREAK_MILESTONES = [1, 3, 7, 14, 30, 100] as const;
export type StreakMilestone = typeof STREAK_MILESTONES[number];

export function isStreakMilestone(days: number): days is StreakMilestone {
  return (STREAK_MILESTONES as readonly number[]).includes(days);
}

let confettiPromise: Promise<(opts?: ConfettiOptions) => void> | null = null;

function loadConfetti(): Promise<(opts?: ConfettiOptions) => void> {
  if (!confettiPromise) {
    confettiPromise = import('canvas-confetti').then((m) => m.default);
  }
  return confettiPromise;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function safeSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Small celebratory burst on the user's first correct answer in this session.
 * Returns a promise so callers can `void` it for fire-and-forget semantics.
 */
export async function fireFirstCorrectConfetti(): Promise<void> {
  if (prefersReducedMotion()) return;
  const storage = safeSessionStorage();
  if (storage?.getItem(FIRST_CORRECT_KEY) === '1') return;

  const confetti = await loadConfetti();
  confetti({
    particleCount: 70,
    spread: 70,
    startVelocity: 30,
    origin: { y: 0.6 },
    colors: ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24'],
  });

  try {
    storage?.setItem(FIRST_CORRECT_KEY, '1');
  } catch {
    // sessionStorage may throw in private modes — celebration still works,
    // we just lose the "once per session" guard.
  }
}

/**
 * Bigger, more colourful burst when the streak hits a milestone day.
 * No-op if the same milestone already celebrated in this session.
 */
export async function fireStreakConfetti(days: number): Promise<void> {
  if (prefersReducedMotion()) return;
  if (!isStreakMilestone(days)) return;

  const storage = safeSessionStorage();
  const key = `${STREAK_MILESTONE_PREFIX}${days}`;
  if (storage?.getItem(key) === '1') return;

  const confetti = await loadConfetti();

  // Scale intensity with the milestone so a 100-day streak feels bigger than
  // day 1 — but cap so we don't melt the tab.
  const intensity = Math.min(days, 100);
  const particleCount = Math.min(80 + intensity * 1.5, 240);
  const spread = Math.min(80 + intensity / 2, 130);
  const startVelocity = Math.min(35 + intensity / 5, 55);

  confetti({
    particleCount,
    spread,
    startVelocity,
    origin: { y: 0.4 },
    colors: ['#f97316', '#fbbf24', '#a78bfa', '#22d3ee', '#34d399'],
  });

  try {
    storage?.setItem(key, '1');
  } catch {
    // Same swallow as above.
  }
}

/**
 * Test-only reset hook. Clears sessionStorage flags and the memoised
 * `canvas-confetti` import so each test starts from a clean slate.
 */
export function __resetCelebrationsForTests(): void {
  confettiPromise = null;
  if (typeof window === 'undefined') return;
  try {
    const storage = window.sessionStorage;
    storage.removeItem(FIRST_CORRECT_KEY);
    for (const days of STREAK_MILESTONES) {
      storage.removeItem(`${STREAK_MILESTONE_PREFIX}${days}`);
    }
  } catch {
    // ignore — tests should not fail on storage reset
  }
}
