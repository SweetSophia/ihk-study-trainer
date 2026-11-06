/** Exact decimal GB/TB amounts as safe integer bytes. Only deterministic RAID
 * capacity questions opt in; this does not change measurement tolerances.
 */
export function parseDecimalStorageBytes(raw?: string | null, unit?: string | null): number | null {
  const normalizedUnit = unit?.trim().toLowerCase();
  const places = normalizedUnit === 'gb' ? 9 : normalizedUnit === 'tb' ? 12 : null;
  if (places === null) return null;
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i.exec(raw?.trim().replace(',', '.') ?? '');
  if (!match) return null;
  const fraction = match[3] ?? match[4] ?? '';
  const digits = ((match[2] ?? '') + fraction).replace(/^0+/, '');
  if (!digits) return 0;
  if (match[1] === '-') return null;
  const exponent = Number(match[5] ?? 0);
  if (!Number.isSafeInteger(exponent)) return null;
  const shift = exponent - fraction.length + places;
  let byteDigits: string;
  if (shift < 0) {
    const end = digits.length + shift;
    if (end <= 0 || !/^0+$/.test(digits.slice(end))) return null;
    byteDigits = digits.slice(0, end);
  } else {
    if (digits.length + shift > String(Number.MAX_SAFE_INTEGER).length) return null;
    byteDigits = digits + '0'.repeat(shift);
  }
  const bytes = Number(byteDigits);
  return Number.isSafeInteger(bytes) ? bytes : null;
}
