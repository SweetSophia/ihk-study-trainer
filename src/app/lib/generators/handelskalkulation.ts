import { Question } from '../../types';

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

function formatFactor(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function formatMarkupFactor(percent: number): string {
  return formatFactor(1 + percent / 100);
}

function formatDiscountFactor(percent: number): string {
  return formatFactor(1 - percent / 100);
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

export function generateVorwaertsCalculation(): GeneratedKalkulation {
  const params = randomKalkulationParams();
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

export function generateRueckwaertsCalculation(): GeneratedKalkulation {
  const params = randomKalkulationParams();
  const bruttovk = computeKalkulationChain(params).ustStep.total;
  const calculated = calculateBackwardValues(bruttovk, params);
  if (!calculated) throw new Error('Konnte keine gültige Rückwärtskalkulation erzeugen.');
  const { ustRate, kundenRabatt, kundenSkonto, gewinnZuschlag, handlungsKosten,
    bezugskosten, lieferskonto, lieferRabatt } = params;
  const given = { bruttovk, ustRate, kundenRabatt, kundenSkonto, gewinnZuschlag,
    handlungsKosten, bezugskosten, lieferskonto, lieferRabatt };
  return { given, calculated, schema: RUECKWAERTS_SCHEMA };
}

export function generateDifferenzCalculation(): GeneratedDifferenz {
  const params = randomKalkulationParams();
  const chain = computeKalkulationChain(params);
  const { ustRate, lieferRabatt, lieferskonto, bezugskosten,
    handlungsKosten, gewinnZuschlag, kundenSkonto, kundenRabatt } = params;
  const ustForwardStep = chain.ustStep;

  const buildBackwardFromMarket = (marketBruttovk: number) => calculateBackwardValues(marketBruttovk, params);

  const forwardBruttovk = round2(ustForwardStep.total);
  let bruttovkMarkt = 0;
  let backwardMarket: ReturnType<typeof buildBackwardFromMarket> = null;

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
  } = {}
): Question {
  const { forwardSteps, backwardSteps, moduleId } = options;
  if (type === 'differenz' && (!forwardSteps || !backwardSteps)) {
    throw new Error('buildQuestion: forwardSteps and backwardSteps are required for differenz type');
  }
  const typeLabel = type === 'vorwaerts'
    ? 'Vorwärtskalkulation'
    : type === 'rueckwaerts'
      ? 'Rückwärtskalkulation'
      : 'Differenzkalkulation';

  let frage = `Berechne die ${typeLabel}!\n\n`;
  frage += 'Lehrmodell: Alle Einkaufs- und Kostenwerte sind netto, ohne Umsatzsteuer. Umsatzsteuer wird nur beim Übergang Netto-VK ↔ Brutto-VK berücksichtigt. Runde jede Rechenzeile kaufmännisch auf zwei Nachkommastellen und rechne mit diesen Centbeträgen weiter. Alle abgefragten Geldbeträge sind in Euro.\n\n';
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

  const solutionSteps: string[] = [typeLabel, ''];
  let expectedAnswers: Record<string, string | number | boolean>;
  let answerInputs;

  if (type === 'differenz' && forwardSteps && backwardSteps) {
    expectedAnswers = { ...calculated };
    answerInputs = [
      ...buildAnswerInputs(VORWAERTS_SCHEMA, given, 'forward_', 'Vorwärts').map(input =>
        input.valueKey === 'forward_lep'
          ? { ...input, label: 'Vorwärts: Listeneinkaufspreis (LEP, netto, gegeben)' }
          : input),
      ...buildAnswerInputs(RUECKWAERTS_SCHEMA, given, 'backward_', 'Rückwärts', ['bruttovk']).map(input =>
        input.valueKey === 'backward_lep'
          ? { ...input, label: 'Rückwärts: = Listeneinkaufspreis (LEP, netto, aus Marktpreis)' }
          : input),
      {
        valueKey: 'differenz',
        label: 'Differenz (Markt-Brutto-VK − berechneter Brutto-VK)',
      },
    ];

    solutionSteps.push('=== VORWÄRTSKALKULATION (LEP → Brutto-VK) ===');
    solutionSteps.push(`Gegeben: LEP netto = ${formatEuro(given.lepNetto)}`);
    solutionSteps.push('');
    solutionSteps.push(`Rabatt = ${formatEuro(given.lepNetto)} × ${given.lieferRabatt}% = ${formatEuro(forwardSteps.rabatt)}`);
    solutionSteps.push(`ZEP = ${formatEuro(given.lepNetto)} − ${formatEuro(forwardSteps.rabatt)} = ${formatEuro(forwardSteps.zep)}`);
    solutionSteps.push(`Skonto = ${formatEuro(forwardSteps.zep)} × ${given.lieferskonto}% = ${formatEuro(forwardSteps.skonto)}`);
    solutionSteps.push(`BEP = ${formatEuro(forwardSteps.zep)} − ${formatEuro(forwardSteps.skonto)} = ${formatEuro(forwardSteps.bep)}`);
    solutionSteps.push(`BP = ${formatEuro(forwardSteps.bep)} + ${formatEuro(forwardSteps.bezugskosten)} = ${formatEuro(forwardSteps.bp)}`);
    solutionSteps.push(`Handlungskosten = ${formatEuro(forwardSteps.bp)} × ${given.handlungsKosten}% = ${formatEuro(forwardSteps.handlungskosten)}`);
    solutionSteps.push(`Selbstkosten = ${formatEuro(forwardSteps.bp)} + ${formatEuro(forwardSteps.handlungskosten)} = ${formatEuro(forwardSteps.selbstkosten)}`);
    solutionSteps.push(`Gewinn = ${formatEuro(forwardSteps.selbstkosten)} × ${given.gewinnZuschlag}% = ${formatEuro(forwardSteps.gewinn)}`);
    solutionSteps.push(`BVP = ${formatEuro(forwardSteps.selbstkosten)} + ${formatEuro(forwardSteps.gewinn)} = ${formatEuro(forwardSteps.bvp)}`);
    solutionSteps.push(`ZVP = ${formatEuro(forwardSteps.bvp)} / ${formatDiscountFactor(given.kundenSkonto)} = ${formatEuro(forwardSteps.zvp)}`);
    solutionSteps.push(`Kundenskonto = ${formatEuro(forwardSteps.zvp)} − ${formatEuro(forwardSteps.bvp)} = ${formatEuro(forwardSteps.kundenskonto)}`);
    solutionSteps.push(`Netto-VK = ${formatEuro(forwardSteps.zvp)} / ${formatDiscountFactor(given.kundenRabatt)} = ${formatEuro(forwardSteps.nettovk)}`);
    solutionSteps.push(`Kundenrabatt = ${formatEuro(forwardSteps.nettovk)} − ${formatEuro(forwardSteps.zvp)} = ${formatEuro(forwardSteps.kundenrabatt)}`);
    solutionSteps.push(`USt = ${formatEuro(forwardSteps.nettovk)} × ${given.ustRate}% = ${formatEuro(forwardSteps.ust)}`);
    solutionSteps.push(`Brutto-VK = ${formatEuro(forwardSteps.nettovk)} + ${formatEuro(forwardSteps.ust)} = ${formatEuro(forwardSteps.bruttovk)}`);
    solutionSteps.push('');

    solutionSteps.push('=== RÜCKWÄRTSKALKULATION (Markt-Brutto-VK → LEP) ===');
    solutionSteps.push(`Gegeben: Markt-Brutto-VK = ${formatEuro(given.bruttovkMarkt)}`);
    solutionSteps.push('');
    solutionSteps.push(`Netto-VK = ${formatEuro(given.bruttovkMarkt)} / ${formatMarkupFactor(given.ustRate)} = ${formatEuro(backwardSteps.nettovk)}`);
    solutionSteps.push(`USt = ${formatEuro(given.bruttovkMarkt)} − ${formatEuro(backwardSteps.nettovk)} = ${formatEuro(backwardSteps.ust)}`);
    solutionSteps.push(`Kundenrabatt = ${formatEuro(backwardSteps.nettovk)} × ${given.kundenRabatt}% = ${formatEuro(backwardSteps.kundenrabatt)}`);
    solutionSteps.push(`ZVP = ${formatEuro(backwardSteps.nettovk)} − ${formatEuro(backwardSteps.kundenrabatt)} = ${formatEuro(backwardSteps.zvp)}`);
    solutionSteps.push(`Kundenskonto = ${formatEuro(backwardSteps.zvp)} × ${given.kundenSkonto}% = ${formatEuro(backwardSteps.kundenskonto)}`);
    solutionSteps.push(`BVP = ${formatEuro(backwardSteps.zvp)} − ${formatEuro(backwardSteps.kundenskonto)} = ${formatEuro(backwardSteps.bvp)}`);
    solutionSteps.push(`Selbstkosten = ${formatEuro(backwardSteps.bvp)} / ${formatMarkupFactor(given.gewinnZuschlag)} = ${formatEuro(backwardSteps.selbstkosten)}`);
    solutionSteps.push(`Gewinn = ${formatEuro(backwardSteps.bvp)} − ${formatEuro(backwardSteps.selbstkosten)} = ${formatEuro(backwardSteps.gewinn)}`);
    solutionSteps.push(`BP = ${formatEuro(backwardSteps.selbstkosten)} / ${formatMarkupFactor(given.handlungsKosten)} = ${formatEuro(backwardSteps.bp)}`);
    solutionSteps.push(`Handlungskosten = ${formatEuro(backwardSteps.selbstkosten)} − ${formatEuro(backwardSteps.bp)} = ${formatEuro(backwardSteps.handlungskosten)}`);
    solutionSteps.push(`BEP = ${formatEuro(backwardSteps.bp)} − ${formatEuro(backwardSteps.bezugskosten)} = ${formatEuro(backwardSteps.bep)}`);
    solutionSteps.push(`ZEP = ${formatEuro(backwardSteps.bep)} / ${formatDiscountFactor(given.lieferskonto)} = ${formatEuro(backwardSteps.zep)}`);
    solutionSteps.push(`Skonto = ${formatEuro(backwardSteps.zep)} − ${formatEuro(backwardSteps.bep)} = ${formatEuro(backwardSteps.skonto)}`);
    solutionSteps.push(`LEP netto (aus Marktpreis) = ${formatEuro(backwardSteps.zep)} / ${formatDiscountFactor(given.lieferRabatt)} = ${formatEuro(backwardSteps.lep)}`);
    solutionSteps.push(`Rabatt = ${formatEuro(backwardSteps.lep)} − ${formatEuro(backwardSteps.zep)} = ${formatEuro(backwardSteps.rabatt)}`);
    solutionSteps.push('Der aus dem Marktpreis abgeleitete LEP netto ist der zu diesem Verkaufspreis und den vorgegebenen Zu- und Abschlägen passende Einkaufspreis. Er kann vom gegebenen LEP netto abweichen, weil der Marktpreis vom vorwärts berechneten Brutto-VK abweicht.');
    solutionSteps.push('');

    const differenz = calculated.differenz as number;
    const differenzLabel = differenz >= 0 ? 'Gewinnspielraum' : 'Unterdeckung';
    solutionSteps.push('=== ERGEBNIS ===');
    solutionSteps.push('Differenz = Markt-Brutto-VK − berechneter Brutto-VK');
    solutionSteps.push(`Differenz = ${formatEuro(given.bruttovkMarkt)} − ${formatEuro(forwardSteps.bruttovk)}`);
    solutionSteps.push(`Differenz = ${formatEuro(differenz)}`);
    solutionSteps.push('');
    solutionSteps.push(`${differenz >= 0 ? '✅' : '❌'} ${differenzLabel}: ${formatEuro(differenz)}`);
    solutionSteps.push(
      differenz >= 0
        ? 'Der Marktpreis liegt mindestens auf dem berechneten Niveau.'
        : 'Der Marktpreis liegt unter dem berechneten Niveau.'
    );
  } else {
    expectedAnswers = Object.fromEntries(
      Object.entries(calculated).filter(([key]) => !Object.prototype.hasOwnProperty.call(given, key))
    );
    answerInputs = buildAnswerInputs(schema, given);

    if (type === 'vorwaerts') {
      solutionSteps.push(`Gegeben: LEP netto = ${formatEuro(given.lepNetto)}, Rabatt = ${given.lieferRabatt}%, Skonto = ${given.lieferskonto}%`);
      solutionSteps.push('');
      solutionSteps.push(`Rabatt = ${formatEuro(given.lepNetto)} × ${given.lieferRabatt}% = ${formatEuro(calculated.rabatt as number)}`);
      solutionSteps.push(`ZEP = ${formatEuro(given.lepNetto)} − ${formatEuro(calculated.rabatt as number)} = ${formatEuro(calculated.zep as number)}`);
      solutionSteps.push(`Skonto = ${formatEuro(calculated.zep as number)} × ${given.lieferskonto}% = ${formatEuro(calculated.skonto as number)}`);
      solutionSteps.push(`BEP = ${formatEuro(calculated.zep as number)} − ${formatEuro(calculated.skonto as number)} = ${formatEuro(calculated.bep as number)}`);
      solutionSteps.push(`BP = ${formatEuro(calculated.bep as number)} + ${formatEuro(calculated.bezugskosten as number)} = ${formatEuro(calculated.bp as number)}`);
      solutionSteps.push(`Handlungskosten = ${formatEuro(calculated.bp as number)} × ${given.handlungsKosten}% = ${formatEuro(calculated.handlungskosten as number)}`);
      solutionSteps.push(`Selbstkosten = ${formatEuro(calculated.bp as number)} + ${formatEuro(calculated.handlungskosten as number)} = ${formatEuro(calculated.selbstkosten as number)}`);
      solutionSteps.push(`Gewinn = ${formatEuro(calculated.selbstkosten as number)} × ${given.gewinnZuschlag}% = ${formatEuro(calculated.gewinn as number)}`);
      solutionSteps.push(`BVP = ${formatEuro(calculated.selbstkosten as number)} + ${formatEuro(calculated.gewinn as number)} = ${formatEuro(calculated.bvp as number)}`);
      solutionSteps.push(`ZVP = ${formatEuro(calculated.bvp as number)} / ${formatDiscountFactor(given.kundenSkonto)} = ${formatEuro(calculated.zvp as number)}`);
      solutionSteps.push(`Kundenskonto = ${formatEuro(calculated.zvp as number)} − ${formatEuro(calculated.bvp as number)} = ${formatEuro(calculated.kundenskonto as number)}`);
      solutionSteps.push(`Netto-VK = ${formatEuro(calculated.zvp as number)} / ${formatDiscountFactor(given.kundenRabatt)} = ${formatEuro(calculated.nettovk as number)}`);
      solutionSteps.push(`Kundenrabatt = ${formatEuro(calculated.nettovk as number)} − ${formatEuro(calculated.zvp as number)} = ${formatEuro(calculated.kundenrabatt as number)}`);
      solutionSteps.push(`USt = ${formatEuro(calculated.nettovk as number)} × ${given.ustRate}% = ${formatEuro(calculated.ust as number)}`);
      solutionSteps.push(`Brutto-VK = ${formatEuro(calculated.nettovk as number)} + ${formatEuro(calculated.ust as number)} = ${formatEuro(calculated.bruttovk as number)}`);
    } else {
      solutionSteps.push(`Gegeben: Brutto-VK = ${formatEuro(given.bruttovk)}, alle Zu- und Abschläge`);
      solutionSteps.push('');
      solutionSteps.push(`Netto-VK = ${formatEuro(given.bruttovk)} / ${formatMarkupFactor(given.ustRate)} = ${formatEuro(calculated.nettovk as number)}`);
      solutionSteps.push(`USt = ${formatEuro(given.bruttovk)} − ${formatEuro(calculated.nettovk as number)} = ${formatEuro(calculated.ust as number)}`);
      solutionSteps.push(`Kundenrabatt = ${formatEuro(calculated.nettovk as number)} × ${given.kundenRabatt}% = ${formatEuro(calculated.kundenrabatt as number)}`);
      solutionSteps.push(`ZVP = ${formatEuro(calculated.nettovk as number)} − ${formatEuro(calculated.kundenrabatt as number)} = ${formatEuro(calculated.zvp as number)}`);
      solutionSteps.push(`Kundenskonto = ${formatEuro(calculated.zvp as number)} × ${given.kundenSkonto}% = ${formatEuro(calculated.kundenskonto as number)}`);
      solutionSteps.push(`BVP = ${formatEuro(calculated.zvp as number)} − ${formatEuro(calculated.kundenskonto as number)} = ${formatEuro(calculated.bvp as number)}`);
      solutionSteps.push(`Selbstkosten = ${formatEuro(calculated.bvp as number)} / ${formatMarkupFactor(given.gewinnZuschlag)} = ${formatEuro(calculated.selbstkosten as number)}`);
      solutionSteps.push(`Gewinn = ${formatEuro(calculated.bvp as number)} − ${formatEuro(calculated.selbstkosten as number)} = ${formatEuro(calculated.gewinn as number)}`);
      solutionSteps.push(`BP = ${formatEuro(calculated.selbstkosten as number)} / ${formatMarkupFactor(given.handlungsKosten)} = ${formatEuro(calculated.bp as number)}`);
      solutionSteps.push(`Handlungskosten = ${formatEuro(calculated.selbstkosten as number)} − ${formatEuro(calculated.bp as number)} = ${formatEuro(calculated.handlungskosten as number)}`);
      solutionSteps.push(`BEP = ${formatEuro(calculated.bp as number)} − ${formatEuro(calculated.bezugskosten as number)} = ${formatEuro(calculated.bep as number)}`);
      solutionSteps.push(`ZEP = ${formatEuro(calculated.bep as number)} / ${formatDiscountFactor(given.lieferskonto)} = ${formatEuro(calculated.zep as number)}`);
      solutionSteps.push(`Skonto = ${formatEuro(calculated.zep as number)} − ${formatEuro(calculated.bep as number)} = ${formatEuro(calculated.skonto as number)}`);
      solutionSteps.push(`LEP netto = ${formatEuro(calculated.zep as number)} / ${formatDiscountFactor(given.lieferRabatt)} = ${formatEuro(calculated.lep as number)}`);
      solutionSteps.push(`Rabatt = ${formatEuro(calculated.lep as number)} − ${formatEuro(calculated.zep as number)} = ${formatEuro(calculated.rabatt as number)}`);
    }
  }

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
  };
}

/** Generates a dedicated Vorwärtskalkulation question with medium difficulty. */
export function generateVorwaertsKalkulationQuestion(): Question {
  const { given, calculated, schema } = generateVorwaertsCalculation();
  return buildQuestion('vorwaerts', given, calculated, schema, { moduleId: 'handelskalkulationVorwaerts' });
}

/** Generates a dedicated Rückwärtskalkulation question with hard difficulty. */
export function generateRueckwaertsKalkulationQuestion(): Question {
  const { given, calculated, schema } = generateRueckwaertsCalculation();
  return buildQuestion('rueckwaerts', given, calculated, schema, { moduleId: 'handelskalkulationRueckwaerts' });
}

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
