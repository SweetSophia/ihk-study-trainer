import { formatIHKTime } from './timeFormat';

interface ImageTransferTimeResult {
  display: string;
  /** Nine decimal places below 60 seconds; whole seconds otherwise. */
  roundedSeconds: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

/** Preserve fractional image transfers without changing bandwidth formatting. */
export function formatImageTransferTime(rawSeconds: number): ImageTransferTimeResult {
  const roundedSeconds = Number((rawSeconds * 1.1).toFixed(9));
  if (roundedSeconds >= 60) return formatIHKTime(rawSeconds);

  const displaySeconds = roundedSeconds.toFixed(9).replace(/\.?0+$/, '');
  return {
    display: `${displaySeconds} Sekunde(n)`,
    roundedSeconds,
    seconds: roundedSeconds,
  };
}
