export const TIME_UNITS = ['Sekunden', 'Minuten', 'Stunden'];
export const UNIT_SEKUNDEN = TIME_UNITS[0];
export const UNIT_MINUTEN = TIME_UNITS[1];
export const UNIT_STUNDEN = TIME_UNITS[2];

/** Result returned by formatIHKTime. Component fields (hours, minutes, seconds)
 *  always represent the broken-down 60-system components — never the total.
 *  For the total, use `value` (in the unit given by `unit`). */
export interface IHKTimeResult {
  display: string;
  /** Decimal value in the primary unit (hours, minutes, or seconds), based on the rounded total seconds. */
  value: number;
  unit: string;
  /** Total transfer time in whole seconds after adding overhead and rounding once. */
  roundedSeconds: number;
  hours?: number;
  minutes?: number;
  /** Component seconds (0-59). Always the remainder after extracting
   *  higher-order units, so the meaning is consistent across all branches. */
  seconds?: number;
}

/**
 * Formats time according to IHK 60-system rules:
 * - Applies 10 % overhead to the raw transfer time.
 * - If >= 60 seconds, convert to minutes (60-system).
 * - If >= 60 minutes, convert to hours and minutes.
 *
 * `value` and the component fields are both derived from the same rounded
 * total seconds so the decimal value matches the displayed 60-system breakdown.
 */
export function formatIHKTime(totalSeconds: number): IHKTimeResult {
  // Apply 10% overhead (adds to time)
  const effectiveSeconds = totalSeconds * 1.10;
  const roundedSeconds = Math.round(effectiveSeconds);

  if (roundedSeconds >= 3600) {
    // Convert to hours with minutes (60-system)
    const hours = Math.floor(roundedSeconds / 3600);
    const remainingMinutes = Math.floor((roundedSeconds % 3600) / 60);
    const remainingSeconds = roundedSeconds % 60;
    return {
      display: `${hours} Stunde(n) ${remainingMinutes} Minute(n)`,
      value: Number((roundedSeconds / 3600).toFixed(2)),
      unit: 'Stunden',
      roundedSeconds,
      hours,
      minutes: remainingMinutes,
      seconds: remainingSeconds,
    };
  } else if (roundedSeconds >= 60) {
    // Convert to minutes with seconds (60-system)
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = roundedSeconds % 60;
    return {
      display: `${minutes} Minute(n) ${remainingSeconds} Sekunde(n)`,
      value: Number((roundedSeconds / 60).toFixed(2)),
      unit: 'Minuten',
      roundedSeconds,
      minutes,
      seconds: remainingSeconds,
    };
  } else {
    // Keep as seconds
    return {
      display: `${roundedSeconds} Sekunde(n)`,
      value: roundedSeconds,
      unit: 'Sekunden',
      roundedSeconds,
      seconds: roundedSeconds,
    };
  }
}
