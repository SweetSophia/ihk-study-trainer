import { Question } from '../../types';
import { buildCalculationLearning } from '../calculationLearning';

export type ForwardCalculationVariant = 'standard' | 'no-customer-skonto';
export type BackwardCalculationVariant = 'standard' | 'no-supplier-rebate';
export type DifferentialCalculationVariant = 'standard' | 'matching-market';

export type KalkulationType = 'vorwaerts' | 'rueckwaerts' | 'differenz';

interface KalkulationStep {
  label: string;
  key: string;
  isPercentage?: boolean;
}

interface GeneratedKalkulation {
  given: Record<string, number>;
  calculated: Record<string, number>;
  schema: KalkulationStep[];
}

interface GeneratedDifferenz extends GeneratedKalkulation {
  forwardSteps: Record<string, number>;
  backwardSteps: Record<string, number>;
}

const VORWAERTS_SCHEMA: KalkulationStep[] = [
  { label: 'Listeneinkaufspreis (LEP)', key: 'lep' },
  { label: '− Lieferantenrabatt', key: 'rabatt', isPercentage: true },
  { label: '= Zieleinkaufspreis (ZEP)', key: 'zep' },
  { label: '− Lieferskonto', key: 'skonto', isPercentage: true },
  { label: '= Bareinkaufspreis (BEP)', key: 'bep' },
  { label: '+ Bezugskosten', key: 'bezugskosten' },
  { label: '= Bezugspreis (BP)', key: 'bp' },
  { label: '+ Handlungskosten', key: 'handlungskosten', isPercentage: true },
  { label: '= Selbstkosten', key: 'selbstkosten' },
  { label: '+ Gewinnzuschlag', key: 'gewinn', isPercentage: true },
  { label: '= Barverkaufspreis (BVP)', key: 'bvp' },
  { label: '+ Kundenskonto', key: 'kundenskonto', isPercentage: true },
  { label: '= Zielverkaufspreis (ZVP)', key: 'zvp' },
  { label: '+ Kundenrabatt', key: 'kundenrabatt', isPercentage: true },
  { label: '= Nettoverkaufspreis', key: 'nettovk' },
  { label: '+ Umsatzsteuer (19%)', key: 'ust', isPercentage: true },
  { label: '= Bruttoverkaufspreis', key: 'bruttovk' },
];

const RUECKWAERTS_SCHEMA: KalkulationStep[] = [
  { label: 'Bruttoverkaufspreis', key: 'bruttovk' },
  { label: '− Umsatzsteuer (19%)', key: 'ust', isPercentage: true },
  { label: '= Nettoverkaufspreis', key: 'nettovk' },
  { label: '− Kundenrabatt', key: 'kundenrabatt', isPercentage: true },
  { label: '= Zielverkaufspreis (ZVP)', key: 'zvp' },
  { label: '− Kundenskonto', key: 'kundenskonto', isPercentage: true },
  { label: '= Barverkaufspreis (BVP)', key: 'bvp' },
  { label: '− Gewinnzuschlag', key: 'gewinn', isPercentage: true },
  { label: '= Selbstkosten', key: 'selbstkosten' },
  { label: '− Handlungskosten', key: 'handlungskosten', isPercentage: true },
  { label: '= Bezugspreis (BP)', key: 'bp' },
  { label: '− Bezugskosten', key: 'bezugskosten' },
  { label: '= Bareinkaufspreis (BEP)', key: 'bep' },
  { label: '+ Lieferskonto', key: 'skonto', isPercentage: true },
  { label: '= Zieleinkaufspreis (ZEP)', key: 'zep' },
  { label: '+ Lieferantenrabatt', key: 'rabatt', isPercentage: true },
  { label: '= Listeneinkaufspreis (LEP)', key: 'lep' },
];

function formatEuro(value: number): string {
  return `${round2(value).toFixed(2).replace('.', ',')} €`;
}

function calcPercent(base: number, percent: number): number {
  return Math.round(Math.round(base * 100) * percent / 100) / 100;
}

function applyDeduction(base: number, percent: number): { remaining: number; amount: number } {
  const amount = calcPercent(base, percent);
  return {
    remaining: round2(base - amount),
    amount,
  };
}

function applyMarkup(base: number, percent: number): { total: number; amount: number } {
  const amount = calcPercent(base, percent);
  return {
    total: round2(base + amount),
    amount,
  };
}

function reverseMarkup(total: number, percent: number): { base: number; amount: number } {
  const base = Math.round(Math.round(total * 100) * 100 / (100 + percent)) / 100;
  return {
    base,
    amount: round2(total - base),
  };
}

function reverseDiscount(remaining: number, percent: number): { base: number; amount: number } {
  const base = Math.round(Math.round(remaining * 100) * 100 / (100 - percent)) / 100;
  return {
    base,
    amount: round2(base - remaining),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function randomPercent(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(minEuros: number, maxEuros: number): number {
  const minCents = minEuros * 100;
  const maxCents = maxEuros * 100;
  return (Math.floor(Math.random() * (maxCents - minCents + 1)) + minCents) / 100;
}

function toRoundedRecord(values: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, round2(value)])
  );
}

function buildAnswerInputs(
  schema: KalkulationStep[],
  given: Record<string, number>,
  prefix = '',
  labelPrefix = '',
  skipKeys: string[] = []
) {
  const excluded = new Set(skipKeys);

  return schema
    .filter(
      (step) =>
        !excluded.has(step.key) &&
        !Object.prototype.hasOwnProperty.call(given, step.key)
    )
    .map((step) => ({
      valueKey: `${prefix}${step.key}`,
      label: labelPrefix ? `${labelPrefix}: ${step.label}` : step.label,
    }));
}

/** Shared calculation parameters for forward/backward kalkulation.
 *  Differenz kalkulation reuses the forward chain and the shared backward routine. */
interface BaseKalkulationParams {
  lepNetto: number;
  ustRate: number;
  lieferRabatt: number;
  lieferskonto: number;
  bezugskosten: number;
  handlungsKosten: number;
  gewinnZuschlag: number;
  kundenSkonto: number;
  kundenRabatt: number;
}

interface BaseKalkulationChain {
  rabattStep: ReturnType<typeof applyDeduction>;
  skontoStep: ReturnType<typeof applyDeduction>;
  bp: number;
  handlungskostenStep: ReturnType<typeof applyMarkup>;
  gewinnStep: ReturnType<typeof applyMarkup>;
  kundenskontoStep: ReturnType<typeof reverseDiscount>;
  kundenrabattStep: ReturnType<typeof reverseDiscount>;
  ustStep: ReturnType<typeof applyMarkup>;
}

function randomKalkulationParams(): BaseKalkulationParams {
  return {
    lepNetto: randomAmount(100, 1500),
    ustRate: 19,
    lieferRabatt: randomPercent(5, 20),
    lieferskonto: randomPercent(1, 4),
    bezugskosten: randomAmount(5, 80),
    handlungsKosten: randomPercent(25, 60),
    gewinnZuschlag: randomPercent(8, 25),
    kundenSkonto: randomPercent(2, 5),
    kundenRabatt: randomPercent(5, 20),
  };
}

function computeKalkulationChain(params: BaseKalkulationParams): BaseKalkulationChain {
  const { lepNetto, ustRate, lieferRabatt, lieferskonto, bezugskosten,
    handlungsKosten, gewinnZuschlag, kundenSkonto, kundenRabatt } = params;

  // Purchase/cost stages exclude VAT; add VAT only at the sales boundary.
  const rabattStep = applyDeduction(lepNetto, lieferRabatt);
  const skontoStep = applyDeduction(rabattStep.remaining, lieferskonto);
  const bp = round2(skontoStep.remaining + bezugskosten);
  const handlungskostenStep = applyMarkup(bp, handlungsKosten);
  const gewinnStep = applyMarkup(handlungskostenStep.total, gewinnZuschlag);
  const kundenskontoStep = reverseDiscount(gewinnStep.total, kundenSkonto);
  const kundenrabattStep = reverseDiscount(kundenskontoStep.base, kundenRabatt);
  const ustStep = applyMarkup(kundenrabattStep.base, ustRate);

  return {
    rabattStep,
    skontoStep,
    bp,
    handlungskostenStep,
    gewinnStep,
    kundenskontoStep,
    kundenrabattStep,
    ustStep,
  };
}

export function generateVorwaertsCalculation(variant: ForwardCalculationVariant = 'standard'): GeneratedKalkulation {
  const params = randomKalkulationParams();
  if (variant === 'no-customer-skonto') params.kundenSkonto = 0;
  const { lepNetto, ustRate, lieferRabatt, lieferskonto, bezugskosten,
    handlungsKosten, gewinnZuschlag, kundenSkonto, kundenRabatt } = params;
  const chain = computeKalkulationChain(params);

  const calculated = toRoundedRecord({
    lep: lepNetto,
    rabatt: chain.rabattStep.amount,
    zep: chain.rabattStep.remaining,
    skonto: chain.skontoStep.amount,
    bep: chain.skontoStep.remaining,
    bezugskosten,
    bp: chain.bp,
    handlungskosten: chain.handlungskostenStep.amount,
    selbstkosten: chain.handlungskostenStep.total,
    gewinn: chain.gewinnStep.amount,
    bvp: chain.gewinnStep.total,
    kundenskonto: chain.kundenskontoStep.amount,
    zvp: chain.kundenskontoStep.base,
    kundenrabatt: chain.kundenrabattStep.amount,
    nettovk: chain.kundenrabattStep.base,
    ust: chain.ustStep.amount,
    bruttovk: chain.ustStep.total,
  });

  const given: Record<string, number> = {
    lepNetto: round2(lepNetto),
    ustRate,
    lieferRabatt,
    lieferskonto,
    bezugskosten: round2(bezugskosten),
    handlungsKosten,
    gewinnZuschlag,
    kundenSkonto,
    kundenRabatt,
  };

  return { given, calculated, schema: VORWAERTS_SCHEMA };
}

/** Reverse only the displayed gross sale, rounding each new monetary row to cents. */
function calculateBackwardValues(gross: number, params: BaseKalkulationParams): Record<string, number> | null {
  const { ustRate, kundenRabatt, kundenSkonto, gewinnZuschlag, handlungsKosten,
    bezugskosten, lieferskonto, lieferRabatt } = params;
  const net = reverseMarkup(gross, ustRate);
  const rebate = applyDeduction(net.base, kundenRabatt);
  const customerDiscount = applyDeduction(rebate.remaining, kundenSkonto);
  const profit = reverseMarkup(customerDiscount.remaining, gewinnZuschlag);
  const handling = reverseMarkup(profit.base, handlungsKosten);
  const bep = round2(handling.base - bezugskosten);
  if (bep <= 0) return null;
  const supplierDiscount = reverseDiscount(bep, lieferskonto);
  const supplierRebate = reverseDiscount(supplierDiscount.base, lieferRabatt);
  return {
    ust: net.amount, nettovk: net.base, kundenrabatt: rebate.amount, zvp: rebate.remaining,
    kundenskonto: customerDiscount.amount, bvp: customerDiscount.remaining,
    gewinn: profit.amount, selbstkosten: profit.base, handlungskosten: handling.amount,
    bp: handling.base, bezugskosten, bep, skonto: supplierDiscount.amount,
    zep: supplierDiscount.base, rabatt: supplierRebate.amount, lep: supplierRebate.base,
  };
}

export function generateRueckwaertsCalculation(variant: BackwardCalculationVariant = 'standard'): GeneratedKalkulation {
  const params = randomKalkulationParams();
  if (variant === 'no-supplier-rebate') params.lieferRabatt = 0;
  const bruttovk = computeKalkulationChain(params).ustStep.total;
  const calculated = calculateBackwardValues(bruttovk, params);
  if (!calculated) throw new Error('Konnte keine gültige Rückwärtskalkulation erzeugen.');
  const { ustRate, kundenRabatt, kundenSkonto, gewinnZuschlag, handlungsKosten,
    bezugskosten, lieferskonto, lieferRabatt } = params;
  const given = { bruttovk, ustRate, kundenRabatt, kundenSkonto, gewinnZuschlag,
    handlungsKosten, bezugskosten, lieferskonto, lieferRabatt };
  return { given, calculated, schema: RUECKWAERTS_SCHEMA };
}

export function generateDifferenzCalculation(variant: DifferentialCalculationVariant = 'standard'): GeneratedDifferenz {
  const params = randomKalkulationParams();
  const chain = computeKalkulationChain(params);
  const { ustRate, lieferRabatt, lieferskonto, bezugskosten,
    handlungsKosten, gewinnZuschlag, kundenSkonto, kundenRabatt } = params;
  const ustForwardStep = chain.ustStep;

  const buildBackwardFromMarket = (marketBruttovk: number) => calculateBackwardValues(marketBruttovk, params);

  const forwardBruttovk = round2(ustForwardStep.total);
  let bruttovkMarkt = variant === 'matching-market' ? forwardBruttovk : 0;
  let backwardMarket: ReturnType<typeof buildBackwardFromMarket> = variant === 'matching-market'
    ? buildBackwardFromMarket(bruttovkMarkt) : null;

  for (let attempt = 0; attempt < 25 && !backwardMarket; attempt += 1) {
    const variance = 0.9 + Math.random() * 0.35;
    bruttovkMarkt = round2(ustForwardStep.total * variance);
    if (bruttovkMarkt === forwardBruttovk) {
      continue;
    }
    backwardMarket = buildBackwardFromMarket(bruttovkMarkt);
  }

  if (!backwardMarket) {
    bruttovkMarkt = round2(forwardBruttovk * 1.05);
    backwardMarket = buildBackwardFromMarket(bruttovkMarkt);
  }

  if (!backwardMarket) {
    throw new Error('Konnte keine gültige Differenzkalkulation erzeugen.');
  }

  const forwardSteps = toRoundedRecord({
    lep: params.lepNetto,
    rabatt: chain.rabattStep.amount,
    zep: chain.rabattStep.remaining,
    skonto: chain.skontoStep.amount,
    bep: chain.skontoStep.remaining,
    bezugskosten,
    bp: chain.bp,
    handlungskosten: chain.handlungskostenStep.amount,
    selbstkosten: chain.handlungskostenStep.total,
    gewinn: chain.gewinnStep.amount,
    bvp: chain.gewinnStep.total,
    kundenskonto: chain.kundenskontoStep.amount,
    zvp: chain.kundenskontoStep.base,
    kundenrabatt: chain.kundenrabattStep.amount,
    nettovk: chain.kundenrabattStep.base,
    ust: ustForwardStep.amount,
    bruttovk: ustForwardStep.total,
  });

  const backwardSteps = backwardMarket;

  const differenz = round2(bruttovkMarkt - forwardSteps.bruttovk);

  const given: Record<string, number> = {
    lepNetto: round2(params.lepNetto),
    ustRate,
    lieferRabatt,
    lieferskonto,
    bezugskosten: round2(bezugskosten),
    handlungsKosten,
    gewinnZuschlag,
    kundenSkonto,
    kundenRabatt,
    bruttovkMarkt,
  };

  const calculated = {
    ...Object.fromEntries(
      Object.entries(forwardSteps)
        .filter(([key]) => !Object.prototype.hasOwnProperty.call(given, key))
        .map(([key, value]) => [`forward_${key}`, value])
    ),
    ...Object.fromEntries(
      Object.entries(backwardSteps)
        .filter(([key]) => !Object.prototype.hasOwnProperty.call(given, key))
        .map(([key, value]) => [`backward_${key}`, value])
    ),
    differenz,
  };

  return {
    given,
    calculated,
    forwardSteps,
    backwardSteps,
    schema: VORWAERTS_SCHEMA,
  };
}

function buildQuestion(
  type: KalkulationType,
  given: Record<string, number>,
  calculated: Record<string, number>,
  schema: KalkulationStep[],
  options: {
    forwardSteps?: Record<string, number>;
    backwardSteps?: Record<string, number>;
    moduleId?: string;
    variantLabel?: string;
    moneyPrecision?: 'cents';
  } = {}
): Question {
  const { forwardSteps, backwardSteps, moduleId, variantLabel, moneyPrecision } = options;
  if (type === 'differenz' && (!forwardSteps || !backwardSteps)) {
    throw new Error('buildQuestion: forwardSteps and backwardSteps are required for differenz type');
  }
  const typeLabel = type === 'vorwaerts'
    ? 'Vorwärtskalkulation'
    : type === 'rueckwaerts'
      ? 'Rückwärtskalkulation'
      : 'Differenzkalkulation';

  let frage = `Berechne die ${typeLabel}!\n\n`;
  if (variantLabel) frage += `Variante: ${variantLabel}\n\n`;
  frage += 'Lehrmodell: Alle Einkaufs- und Kostenwerte sind netto, ohne Umsatzsteuer. Umsatzsteuer wird nur beim Übergang Netto-VK ↔ Brutto-VK berücksichtigt. Runde jede Rechenzeile kaufmännisch auf zwei Nachkommastellen und rechne mit diesen Centbeträgen weiter. Alle abgefragten Geldbeträge sind in Euro.\n\n';
  if (moneyPrecision === 'cents') frage += 'Bewertung: Jeder abgefragte Geldbetrag wird centgenau geprüft. Komma oder Punkt als Dezimaltrennzeichen sind erlaubt. Bruchteile eines Cents werden bei der Eingabe nicht nachträglich weggerundet.\n\n';
  frage += 'Gegebene Werte:\n';

  if (type === 'differenz') {
    frage += `• Listeneinkaufspreis (netto, gegeben): ${formatEuro(given.lepNetto)}\n`;
    frage += `• Marktpreis (Brutto-VK): ${formatEuro(given.bruttovkMarkt)}\n`;
    frage += `• Lieferantenrabatt: ${given.lieferRabatt}%\n`;
    frage += `• Lieferskonto: ${given.lieferskonto}%\n`;
    frage += `• Bezugskosten: ${formatEuro(given.bezugskosten)}\n`;
    frage += `• Handlungskosten: ${given.handlungsKosten}%\n`;
    frage += `• Gewinnzuschlag: ${given.gewinnZuschlag}%\n`;
    frage += `• Kundenskonto: ${given.kundenSkonto}%\n`;
    frage += `• Kundenrabatt: ${given.kundenRabatt}%\n`;
    frage += `• Umsatzsteuer: ${given.ustRate}%\n`;
    frage += '\nAufgaben:\n';
    frage += '1. Berechne die Vorwärtskalkulation (LEP → Brutto-VK)\n';
    frage += '2. Berechne die Rückwärtskalkulation (Markt-Brutto-VK → LEP)\n';
    frage += '3. Ermittle die Differenz zwischen Markt-Brutto-VK und berechnetem Brutto-VK\n';
    frage += 'Der Rückwärts-LEP netto wird aus dem Marktpreis abgeleitet und kann vom gegebenen LEP netto der Vorwärtskalkulation abweichen.\n';
  } else if (type === 'vorwaerts') {
    frage += `• Listeneinkaufspreis (netto): ${formatEuro(given.lepNetto)}\n`;
    frage += `• Lieferantenrabatt: ${given.lieferRabatt}%\n`;
    frage += `• Lieferskonto: ${given.lieferskonto}%\n`;
    frage += `• Bezugskosten: ${formatEuro(given.bezugskosten)}\n`;
    frage += `• Handlungskosten: ${given.handlungsKosten}%\n`;
    frage += `• Gewinnzuschlag: ${given.gewinnZuschlag}%\n`;
    frage += `• Kundenskonto: ${given.kundenSkonto}%\n`;
    frage += `• Kundenrabatt: ${given.kundenRabatt}%\n`;
    frage += `• Umsatzsteuer: ${given.ustRate}%\n`;
    frage += '\nBerechne alle Zwischen- und Endergebnisse!';
  } else {
    frage += `• Bruttoverkaufspreis: ${formatEuro(given.bruttovk)}\n`;
    frage += `• Kundenrabatt: ${given.kundenRabatt}%\n`;
    frage += `• Kundenskonto: ${given.kundenSkonto}%\n`;
    frage += `• Gewinnzuschlag: ${given.gewinnZuschlag}%\n`;
    frage += `• Handlungskosten: ${given.handlungsKosten}%\n`;
    frage += `• Bezugskosten: ${formatEuro(given.bezugskosten)}\n`;
    frage += `• Lieferskonto: ${given.lieferskonto}%\n`;
    frage += `• Lieferantenrabatt: ${given.lieferRabatt}%\n`;
    frage += `• Umsatzsteuer: ${given.ustRate}%\n`;
    frage += '\nBerechne alle Zwischen- und Endergebnisse!';
  }

  let expectedAnswers: Record<string, string | number | boolean>;
  let answerInputs;
  if (type === 'differenz') {
    expectedAnswers = { ...calculated };
    answerInputs = [
      ...buildAnswerInputs(VORWAERTS_SCHEMA, given, 'forward_', 'Vorwärts').map(input =>
        input.valueKey === 'forward_lep'
          ? { ...input, label: 'Vorwärts: Listeneinkaufspreis (LEP, netto, gegeben)' } : input),
      ...buildAnswerInputs(RUECKWAERTS_SCHEMA, given, 'backward_', 'Rückwärts', ['bruttovk']).map(input =>
        input.valueKey === 'backward_lep'
          ? { ...input, label: 'Rückwärts: = Listeneinkaufspreis (LEP, netto, aus Marktpreis)' } : input),
      { valueKey: 'differenz', label: 'Differenz (Markt-Brutto-VK − berechneter Brutto-VK)' },
    ];
  } else {
    expectedAnswers = Object.fromEntries(Object.entries(calculated).filter(([key]) => !Object.prototype.hasOwnProperty.call(given, key)));
    answerInputs = buildAnswerInputs(schema, given);
  }
  if (moneyPrecision === 'cents') answerInputs = answerInputs.map(input => ({ ...input, numericRule: 'moneyCents' as const }));
  const learning = buildCalculationLearning(type, given, calculated, forwardSteps, backwardSteps);
  const solutionSteps = learning.solutionSteps;
  const calculationLearning = { rows: answerInputs.map(input => {
    const row = learning.rows.find(row => row.valueKey === input.valueKey);
    if (!row) throw new Error(`Missing calculation guidance for ${input.valueKey}`);
    return row;
  }) };

  const difficulty: 'easy' | 'medium' | 'hard' =
    type === 'vorwaerts' ? 'medium' : 'hard';

  return {
    id:
      `${moduleId ?? 'handelskalkulation'}-${
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      }`,
    theme: 'Wirtschaftsrechnen',
    module: moduleId ?? 'handelskalkulation',
    questionText: frage,
    expectedAnswers,
    solutionSteps,
    difficulty,
    answerInputs,
    calculationLearning,
  };
}

/** Generates a dedicated Vorwärtskalkulation question with medium difficulty. */
export function generateVorwaertsKalkulationQuestion(variant: ForwardCalculationVariant = Math.random() < 0.25 ? 'no-customer-skonto' : 'standard'): Question {
  const { given, calculated, schema } = generateVorwaertsCalculation(variant);
  return buildQuestion('vorwaerts', given, calculated, schema, { moduleId: 'handelskalkulationVorwaerts', moneyPrecision: 'cents',
    variantLabel: variant === 'no-customer-skonto' ? 'Ohne Kundenskonto (0%)' : undefined });
}

/** Generates a dedicated Rückwärtskalkulation question with hard difficulty. */
export function generateRueckwaertsKalkulationQuestion(variant: BackwardCalculationVariant = Math.random() < 0.25 ? 'no-supplier-rebate' : 'standard'): Question {
  const { given, calculated, schema } = generateRueckwaertsCalculation(variant);
  return buildQuestion('rueckwaerts', given, calculated, schema, { moduleId: 'handelskalkulationRueckwaerts', moneyPrecision: 'cents',
    variantLabel: variant === 'no-supplier-rebate' ? 'Ohne Lieferantenrabatt (0%)' : undefined });
}

/** Dedicated differential exercise, with its own progress identity and no mixed-mode fallback. */
export function generateDifferenzKalkulationQuestion(variant: DifferentialCalculationVariant = Math.random() < 0.25 ? 'matching-market' : 'standard'): Question {
  const { given, calculated, forwardSteps, backwardSteps, schema } = generateDifferenzCalculation(variant);
  return buildQuestion('differenz', given, calculated, schema, {
    moduleId: 'handelskalkulationDifferenz', moneyPrecision: 'cents', forwardSteps, backwardSteps,
    variantLabel: variant === 'matching-market' ? 'Marktpreis auf Kalkulationsniveau (0 € Preisabstand)' : undefined,
  });
}

/** Internal legacy mixed generator; no longer registered for exercise selection. */
export function generateHandelskalkulationQuestion(): Question {
  const rand = Math.random();
  const type: KalkulationType = rand < 0.333 ? 'vorwaerts' : rand < 0.666 ? 'rueckwaerts' : 'differenz';

  if (type === 'vorwaerts') {
    const { given, calculated, schema } = generateVorwaertsCalculation();
    return buildQuestion(type, given, calculated, schema);
  }

  if (type === 'rueckwaerts') {
    const { given, calculated, schema } = generateRueckwaertsCalculation();
    return buildQuestion(type, given, calculated, schema);
  }

  // DifferenzCalculation can fail to find valid values — only fallback for that known case.
  let differenzResult;
  try {
    differenzResult = generateDifferenzCalculation();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Konnte keine gültige Differenzkalkulation erzeugen.'
    ) {
      console.warn('[handelskalkulation] DifferenzCalculation failed, falling back to vorwaerts', error);
      const { given, calculated, schema } = generateVorwaertsCalculation();
      return buildQuestion('vorwaerts', given, calculated, schema);
    }

    throw error;
  }

  const { given, calculated, forwardSteps, backwardSteps, schema } = differenzResult;
  return buildQuestion(type, given, calculated, schema, { forwardSteps, backwardSteps });
}

export { VORWAERTS_SCHEMA, RUECKWAERTS_SCHEMA };
