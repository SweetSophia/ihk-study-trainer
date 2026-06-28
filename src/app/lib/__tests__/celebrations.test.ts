import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockConfetti = vi.fn();

vi.mock('canvas-confetti', () => ({
  default: (...args: unknown[]) => mockConfetti(...args),
}));

import {
  __resetCelebrationsForTests,
  fireFirstCorrectConfetti,
  fireStreakConfetti,
  isStreakMilestone,
  STREAK_MILESTONES,
} from '../celebrations';

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe('celebrations', () => {
  beforeEach(() => {
    mockConfetti.mockReset();
    window.sessionStorage.clear();
    setMatchMedia(false);
    __resetCelebrationsForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isStreakMilestone', () => {
    it('accepts the documented milestone set', () => {
      for (const days of STREAK_MILESTONES) {
        expect(isStreakMilestone(days)).toBe(true);
      }
    });

    it('rejects non-milestone days', () => {
      for (const days of [0, 2, 4, 8, 15, 31, 99, 365]) {
        expect(isStreakMilestone(days)).toBe(false);
      }
    });
  });

  describe('fireFirstCorrectConfetti', () => {
    it('fires confetti once and persists the session flag', async () => {
      await fireFirstCorrectConfetti();

      expect(mockConfetti).toHaveBeenCalledTimes(1);
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { y: 0.6 },
          colors: expect.arrayContaining(['#22d3ee']),
        }),
      );
      expect(window.sessionStorage.getItem('ihk_celebrated_first_correct')).toBe('1');
    });

    it('does not fire again within the same session', async () => {
      await fireFirstCorrectConfetti();
      await fireFirstCorrectConfetti();
      await fireFirstCorrectConfetti();

      expect(mockConfetti).toHaveBeenCalledTimes(1);
    });

    it('skips entirely when prefers-reduced-motion is enabled', async () => {
      setMatchMedia(true);

      await fireFirstCorrectConfetti();

      expect(mockConfetti).not.toHaveBeenCalled();
      expect(window.sessionStorage.getItem('ihk_celebrated_first_correct')).toBeNull();
    });

    it('re-fires after the session flag is cleared', async () => {
      await fireFirstCorrectConfetti();
      window.sessionStorage.removeItem('ihk_celebrated_first_correct');
      __resetCelebrationsForTests();

      await fireFirstCorrectConfetti();

      expect(mockConfetti).toHaveBeenCalledTimes(2);
    });
  });

  describe('fireStreakConfetti', () => {
    it('fires confetti on a milestone day and stores a per-milestone flag', async () => {
      await fireStreakConfetti(7);

      expect(mockConfetti).toHaveBeenCalledTimes(1);
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { y: 0.4 },
          colors: expect.arrayContaining(['#f97316']),
        }),
      );
      expect(window.sessionStorage.getItem('ihk_celebrated_streak_7')).toBe('1');
    });

    it('does not fire on non-milestone days', async () => {
      await fireStreakConfetti(5);
      await fireStreakConfetti(42);

      expect(mockConfetti).not.toHaveBeenCalled();
    });

    it('fires independently per milestone', async () => {
      await fireStreakConfetti(7);
      await fireStreakConfetti(14);

      expect(mockConfetti).toHaveBeenCalledTimes(2);
      expect(window.sessionStorage.getItem('ihk_celebrated_streak_7')).toBe('1');
      expect(window.sessionStorage.getItem('ihk_celebrated_streak_14')).toBe('1');
    });

    it('does not double-fire for the same milestone in one session', async () => {
      await fireStreakConfetti(30);
      await fireStreakConfetti(30);

      expect(mockConfetti).toHaveBeenCalledTimes(1);
    });

    it('skips entirely when prefers-reduced-motion is enabled', async () => {
      setMatchMedia(true);

      await fireStreakConfetti(100);

      expect(mockConfetti).not.toHaveBeenCalled();
    });

    it('scales particleCount with the milestone day but caps it', async () => {
      await fireStreakConfetti(1);
      const small = (mockConfetti.mock.calls[0]?.[0] as { particleCount: number }).particleCount;

      mockConfetti.mockReset();
      __resetCelebrationsForTests();

      await fireStreakConfetti(100);
      const big = (mockConfetti.mock.calls[0]?.[0] as { particleCount: number }).particleCount;

      expect(big).toBeGreaterThan(small);
      expect(big).toBeLessThanOrEqual(240);
    });
  });

  describe('__resetCelebrationsForTests', () => {
    it('clears every celebration flag and the memoised confetti promise', async () => {
      await fireFirstCorrectConfetti();
      await fireStreakConfetti(7);
      expect(mockConfetti).toHaveBeenCalledTimes(2);

      __resetCelebrationsForTests();
      mockConfetti.mockReset();

      await fireFirstCorrectConfetti();
      await fireStreakConfetti(7);

      expect(mockConfetti).toHaveBeenCalledTimes(2);
    });
  });

  describe('concurrency / in-memory dedup (Gemini #1, Kilo #2-3)', () => {
    it('fires confetti exactly once across N concurrent fireFirstCorrectConfetti calls', async () => {
      await Promise.all([
        fireFirstCorrectConfetti(),
        fireFirstCorrectConfetti(),
        fireFirstCorrectConfetti(),
        fireFirstCorrectConfetti(),
      ]);

      expect(mockConfetti).toHaveBeenCalledTimes(1);
    });

    it('fires confetti exactly once across N concurrent fireStreakConfetti calls for the same milestone', async () => {
      await Promise.all([
        fireStreakConfetti(7),
        fireStreakConfetti(7),
        fireStreakConfetti(7),
      ]);

      expect(mockConfetti).toHaveBeenCalledTimes(1);
    });

    it('fires once per distinct milestone when concurrent calls target different days', async () => {
      await Promise.all([
        fireStreakConfetti(7),
        fireStreakConfetti(14),
        fireStreakConfetti(30),
      ]);

      expect(mockConfetti).toHaveBeenCalledTimes(3);
    });
  });

  describe('failure recovery (Kilo #1 / Gemini #3)', () => {
    it('rolls back the first-correct guard when the confetti call throws so a retry fires', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockConfetti.mockImplementationOnce(() => {
        throw new Error('synthetic canvas error');
      });

      await fireFirstCorrectConfetti();
      expect(mockConfetti).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load or fire confetti:',
        expect.any(Error),
      );

      // Subsequent call should fire — in-memory flag was rolled back.
      mockConfetti.mockReset();
      await fireFirstCorrectConfetti();
      expect(mockConfetti).toHaveBeenCalledTimes(1);
    });

    it('rolls back the streak-milestone guard when confetti throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockConfetti.mockImplementationOnce(() => {
        throw new Error('synthetic canvas error');
      });

      await fireStreakConfetti(7);
      expect(mockConfetti).toHaveBeenCalledTimes(1);

      // The in-memory Set was rolled back, so this call should fire.
      mockConfetti.mockReset();
      await fireStreakConfetti(7);
      expect(mockConfetti).toHaveBeenCalledTimes(1);
      // Suppress unused-var warning while keeping the spy evidence above.
      void consoleErrorSpy;
    });
  });

  describe('in-memory fallback when sessionStorage is unavailable (Gemini #1)', () => {
    it('still dedups confetti when sessionStorage.setItem throws', async () => {
      const originalSetItem = window.sessionStorage.setItem;
      window.sessionStorage.setItem = vi.fn(() => {
        throw new Error('quota exceeded');
      });

      await fireFirstCorrectConfetti();
      await fireFirstCorrectConfetti();
      await fireFirstCorrectConfetti();

      expect(mockConfetti).toHaveBeenCalledTimes(1);
      window.sessionStorage.setItem = originalSetItem;
    });

    it('still dedups streak confetti when sessionStorage.setItem throws', async () => {
      const originalSetItem = window.sessionStorage.setItem;
      window.sessionStorage.setItem = vi.fn(() => {
        throw new Error('quota exceeded');
      });

      await fireStreakConfetti(14);
      await fireStreakConfetti(14);

      expect(mockConfetti).toHaveBeenCalledTimes(1);
      window.sessionStorage.setItem = originalSetItem;
    });
  });
});
