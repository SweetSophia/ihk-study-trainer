/** Exact decimal parsing for the trainer's safely representable integer-cent amounts.
 * No floating-point rounding of learner input and no unbounded exponent expansion.
 */
export function parseMoneyCents(raw?: string | null): number | null {
  const text = raw?.trim().replace(',', '.') ?? '';
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i.exec(text);
  if (!match) return null;
  const fraction = match[3] ?? match[4] ?? '';
  const digits = ((match[2] ?? '') + fraction).replace(/^0+/, '');
  if (!digits) return 0;
  const exponent = Number(match[5] ?? 0);
  if (!Number.isSafeInteger(exponent)) return null;
  const shift = exponent - fraction.length + 2;
  let centDigits: string;
  if (shift < 0) {
    const end = digits.length + shift;
    if (end <= 0 || !/^0+$/.test(digits.slice(end))) return null;
    centDigits = digits.slice(0, end);
  } else {
    if (digits.length + shift > String(Number.MAX_SAFE_INTEGER).length) return null;
    centDigits = digits + '0'.repeat(shift);
  }
  const cents = Number(centDigits);
  if (!Number.isSafeInteger(cents)) return null;
  return match[1] === '-' ? -cents : cents;
}
