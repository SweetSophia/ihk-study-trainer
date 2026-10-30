import { vi } from 'vitest';

/** Deterministic locale output without changing production formatting or process locale. */
export function mockNumberLocale(locale: string): (text: string) => string {
  const nativeLocaleString = Number.prototype.toLocaleString;
  vi.spyOn(Number.prototype, 'toLocaleString').mockImplementation(function (this: number, requested, options) {
    return nativeLocaleString.call(this, requested ?? locale, options);
  });
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const group = parts.find(part => part.type === 'group')!.value;
  const decimal = parts.find(part => part.type === 'decimal')!.value;
  return text => text.replaceAll(group, '').replaceAll(decimal, '.');
}
