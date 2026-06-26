/**
 * Celebration effects for learner motivation.
 *
 * - Lazy-imports `canvas-confetti` so the initial JS bundle stays small
 *   (confetti only ships when a celebration actually fires).
 * - Honours `prefers-reduced-motion`: returns immediately if the user has
 *   opted out at the OS/browser level.
 * - "Already celebrated" is guarded by an in-memory flag set *synchronously*
 *   before the dynamic import awaits. This closes the TOCTOU race where two
 *   concurrent calls both pass the storage check and fire twice.
 * - sessionStorage is layered on top as best-effort cross-mount persistence
 *   within a tab session; private modes may throw, that's OK.
 * - If the dynamic import ever rejects, we null out the cached promise so
 *   the next call gets a fresh attempt instead of being permanently stuck
 *   on a dead promise. The in-memory flag is also rolled back so retries
 *   are possible within the same session.
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
// In-memory guards are the *primary* dedup mechanism. sessionStorage is just
// best-effort persistence across remounts within the same tab session.
let celebratedFirstCorrectInMemory = false;
const celebratedStreakMilestonesInMemory = new Set<number>();

function loadConfetti(): Promise<(opts?: ConfettiOptions) => void> {
  if (!confettiPromise) {
    confettiPromise = import('canvas-confetti')
      .then((m) => m.default)
      .catch((err) => {
        // Reset so the next call gets a fresh import attempt — otherwise a
        // single transient failure (offline chunk, ad blocker) would silence
        // confetti for the rest of the session.
        confettiPromise = null;
        throw err;
      });
  }
  return confettiPromise;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Small celebratory burst on the user's first correct answer in this session.
 * Returns a promise so callers can `void` it for fire-and-forget semantics.
 */
export async function fireFirstCorrectConfetti(): Promise<void> {
  if (prefersReducedMotion()) return;
  // Synchronous in-memory guard — closes the race between concurrent calls
  // (e.g. two ProgressDashboard remounts before either has awaited the import).
  if (celebratedFirstCorrectInMemory) return;
  celebratedFirstCorrectInMemory = true;

  try {
    const confetti = await loadConfetti();
    confetti({
      particleCount: 70,
      spread: 70,
      startVelocity: 30,
      origin: { y: 0.6 },
      colors: ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24'],
    });
  } catch (error) {
    // Roll back the in-memory flag so the next call gets a retry chance,
    // since the loadConfetti promise reset already allows re-importing.
    celebratedFirstCorrectInMemory = false;
    console.error('Failed to load or fire confetti:', error);
    return;
  }

  // Best-effort cross-mount persistence. Throwing is fine — in-memory guard
  // still prevents double-firing within this tab session.
  try {
    window.sessionStorage?.setItem(FIRST_CORRECT_KEY, '1');
  } catch {
    // Private mode / iframe sandbox — in-memory flag is enough.
  }
}

/**
 * Bigger, more colourful burst when the streak hits a milestone day.
 * No-op if the same milestone already celebrated in this session.
 */
export async function fireStreakConfetti(days: number): Promise<void> {
  if (prefersReducedMotion()) return;
  if (!isStreakMilestone(days)) return;

  // Synchronous in-memory guard — closes the race between concurrent calls.
  if (celebratedStreakMilestonesInMemory.has(days)) return;
  celebratedStreakMilestonesInMemory.add(days);

  try {
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
  } catch (error) {
    celebratedStreakMilestonesInMemory.delete(days);
    console.error('Failed to load or fire confetti:', error);
    return;
  }

  try {
    window.sessionStorage?.setItem(`${STREAK_MILESTONE_PREFIX}${days}`, '1');
  } catch {
    // Same swallow as above.
  }
}

/**
 * Test-only reset hook. Clears sessionStorage flags, the in-memory guards,
 * and the memoised `canvas-confetti` import so each test starts from a
 * clean slate.
 */
export function __resetCelebrationsForTests(): void {
  confettiPromise = null;
  celebratedFirstCorrectInMemory = false;
  celebratedStreakMilestonesInMemory.clear();
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
