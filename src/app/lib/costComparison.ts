export type CostSection = 'comparison' | 'crossover';
export type CostAnswers = Partial<Record<string, string>>;
export const COST_OFFERS = {
  own: { label: 'Eigener Server', initialCents: 480000, monthlyCents: 12000 },
  managed: { label: 'Managed Service', initialCents: 40000, monthlyCents: 26000 },
} as const;
export const COST_FIELDS = {
  comparison: [
    { key: 'own', label: 'Eigener Server nach 36 Monaten (€)', expected: costAtMonth('own', 36) },
    { key: 'managed', label: 'Managed Service nach 36 Monaten (€)', expected: costAtMonth('managed', 36) },
    { key: 'difference', label: 'Absoluter Kostenunterschied nach 36 Monaten (€)', expected: costAtMonth('managed', 36) - costAtMonth('own', 36) },
  ],
  crossover: [
    { key: 'own31', label: 'Eigener Server nach 31 Monaten (€)', expected: costAtMonth('own', 31) },
    { key: 'managed31', label: 'Managed Service nach 31 Monaten (€)', expected: costAtMonth('managed', 31) },
    { key: 'own32', label: 'Eigener Server nach 32 Monaten (€)', expected: costAtMonth('own', 32) },
    { key: 'managed32', label: 'Managed Service nach 32 Monaten (€)', expected: costAtMonth('managed', 32) },
  ],
} as const;

/** Plain euros only, exact cents: neither locale grouping nor float tolerance. */
export function parseEuroCents(value: string): number | null {
  const text = value.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) return null;
  const [euros, fraction = ''] = text.split(/[.,]/);
  const normalizedEuros = euros.replace(/^0+/, '') || '0';
  if (normalizedEuros.length > 14) return null;
  const cents = BigInt(normalizedEuros) * BigInt(100) + BigInt(fraction.padEnd(2, '0'));
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
}

export function costAtMonth(offer: keyof typeof COST_OFFERS, month: number): number {
  if (!Number.isSafeInteger(month) || month < 0) throw new Error('Ungültiger Monat.');
  const result = COST_OFFERS[offer].initialCents + month * COST_OFFERS[offer].monthlyCents;
  if (!Number.isSafeInteger(result)) throw new Error('Kosten zu groß.');
  return result;
}

export function validateCostAnswers(section: CostSection, answers: CostAnswers): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const field of COST_FIELDS[section]) {
    const value = Object.hasOwn(answers, field.key) ? answers[field.key] : undefined;
    const cents = parseEuroCents(value ?? '');
    if (cents === null) errors[field.key] = 'Bitte einen nichtnegativen Eurobetrag ohne Tausendertrennzeichen mit höchstens zwei Nachkommastellen eingeben.';
    else if (cents !== field.expected) errors[field.key] = 'Dieser Betrag stimmt für die vorgegebenen Kosten und Monate nicht.';
  }
  if (section === 'comparison') {
    if (!Object.hasOwn(answers, 'cheaper') || answers.cheaper !== 'own') errors.cheaper = 'Wähle die nach 36 Monaten rein rechnerisch günstigere Option.';
  } else {
    const month = Object.hasOwn(answers, 'month') ? answers.month?.trim() ?? '' : '';
    if (!/^\d+$/.test(month) || !Number.isSafeInteger(Number(month))) errors.month = 'Bitte eine nichtnegative ganze Monatszahl eingeben.';
    else if (Number(month) !== 32) errors.month = 'Gesucht ist der erste abgeschlossene Monat mit strikt niedrigeren Kosten für den eigenen Server.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
