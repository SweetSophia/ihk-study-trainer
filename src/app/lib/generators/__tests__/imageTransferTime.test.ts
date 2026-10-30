import { describe, expect, it } from 'vitest';

import { formatImageTransferTime } from '../imageTransferTime';
import { formatIHKTime } from '../timeFormat';

describe('combo transfer precision boundaries', () => {
  it.each([
    [0.00000069206016, 0.000000692, undefined, 0.000000692],
    [0.499999, 0.499999, undefined, 0.499999],
    [0.5, 0.5, undefined, 0.5],
    [0.500001, 0.500001, undefined, 0.500001],
    [59.499999, 59.499999, undefined, 59.499999],
    [59.5, 59.5, undefined, 59.5],
    [59.500001, 59.500001, undefined, 59.500001],
    [59.9999994, 59.9999994, undefined, 59.9999994],
    [59.9999996, 59.9999996, undefined, 59.9999996],
    [59.9999999994, 59.999999999, undefined, 59.999999999],
    [59.9999999996, 60, 1, 0],
    [60, 60, 1, 0],
    [60.000001, 60, 1, 0],
    [60.5, 61, 1, 1],
  ])('formats %s effective seconds with declared precision', (effective, total, minutes, seconds) => {
    const result = formatImageTransferTime(effective / 1.1);
    expect(result.roundedSeconds).toBe(total);
    expect(result.minutes).toBe(minutes);
    expect(result.seconds).toBe(seconds);
    if (minutes === undefined) {
      expect(result.display).toMatch(/^\d+(?:\.\d+)? Sekunde\(n\)$/);
      expect(Number.parseFloat(result.display)).toBe(seconds);
    }
  });

  it('writes the smallest selectable transfer as decimal seconds', () => {
    expect(formatImageTransferTime(0.0000006291456).display).toBe('0.000000692 Sekunde(n)');
  });

  it('keeps the shared formatter whole-second/hour-minute behavior intact', () => {
    expect(formatIHKTime(0.1824768 / 1.1).seconds).toBe(0);
    const hourResult = formatIHKTime(4000);
    expect(hourResult.display).toBe('1 Stunde(n) 13 Minute(n)');
    expect(hourResult.roundedSeconds).toBe(4400);
    expect(hourResult.seconds).toBe(20);
    expect(formatImageTransferTime(4000)).toEqual(hourResult);
  });
});
