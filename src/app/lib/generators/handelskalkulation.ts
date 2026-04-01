import { Question } from '../../types';

export type KalkulationType = 'vorwaerts' | 'rueckwaerts' | 'differenz';

interface KalkulationStep {
  label: string;
  key: string;
  isPercentage?: boolean;
  isResult?: boolean;
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
  { label: 'Listeneinkaufspreis (LEP)', key: 'lep', isResult: true },
  { label: '− Lieferantenrabatt', key: 'rabatt', isPercentage: true },
  { label: '= Zieleinkaufspreis (ZEP)', key: 'zep' },
  { label: '− Lieferskonto', key: 'skonto', isPercentage: true },
  { label: '= Bareinkaufspreis (BEP)', key: 'bep' },
  { label: '+ Bezugskosten', key: 'bezugskosten', isResult: true },
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
  { label: '− Bezugskosten', key: 'bezugskosten', isResult: true },
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
  return (base * percent) / 100;
}

function applyDeduction(base: number, percent: number): { remaining: number; amount: number } {
  const amount = calcPercent(base, percent);
  return {
    remaining: base - amount,
    amount,
  };
}

function applyMarkup(base: number, percent: number): { total: number; amount: number } {
  const amount = calcPercent(base, percent);
  return {
    total: base + amount,
    amount,
  };
}

function reverseMarkup(total: number, percent: number): { base: number; amount: number } {
  const base = total / (1 + percent / 100);
  return {
    base,
    amount: total - base,
  };
}

function reverseDiscount(remaining: number, percent: number): { base: number; amount: number } {
  const base = remaining / (1 - percent / 100);
  return {
    base,
    amount: base - remaining,
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

export function generateVorwaertsCalculation(): GeneratedKalkulation {
  const lepBrutto = randomAmount(100, 1500);
  const ustRate = 19;
  const lieferRabatt = randomPercent(5, 20);
  const lieferskonto = randomPercent(1, 4);
  const bezugskosten = randomAmount(5, 80);
  const handlungsKosten = randomPercent(25, 60);
  const gewinnZuschlag = randomPercent(8, 25);
  const kundenSkonto = randomPercent(2, 5);
  const kundenRabatt = randomPercent(5, 20);

  const lepNettoStep = reverseMarkup(lepBrutto, ustRate);
  const rabattStep = applyDeduction(lepNettoStep.base, lieferRabatt);
  const skontoStep = applyDeduction(rabattStep.remaining, lieferskonto);
  const bp = skontoStep.remaining + bezugskosten;
  const handlungskostenStep = applyMarkup(bp, handlungsKosten);
  const gewinnStep = applyMarkup(handlungskostenStep.total, gewinnZuschlag);
  const kundenskontoStep = reverseDiscount(gewinnStep.total, kundenSkonto);
  const kundenrabattStep = reverseDiscount(kundenskontoStep.base, kundenRabatt);
  const ustStep = applyMarkup(kundenrabattStep.base, ustRate);

  const calculated = toRoundedRecord({
    lep: lepNettoStep.base,
    rabatt: rabattStep.amount,
    zep: rabattStep.remaining,
    skonto: skontoStep.amount,
    bep: skontoStep.remaining,
    bezugskosten,
    bp,
    handlungskosten: handlungskostenStep.amount,
    selbstkosten: handlungskostenStep.total,
    gewinn: gewinnStep.amount,
    bvp: gewinnStep.total,
    kundenskonto: kundenskontoStep.amount,
    zvp: kundenskontoStep.base,
    kundenrabatt: kundenrabattStep.amount,
    nettovk: kundenrabattStep.base,
    ust: ustStep.amount,
    bruttovk: ustStep.total,
  });

  const given: Record<string, number> = {
    lepBrutto: round2(lepBrutto),
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

export function generateRueckwaertsCalculation(): GeneratedKalkulation {
  const lepBrutto = randomAmount(100, 1500);
  const ustRate = 19;
  const lieferRabatt = randomPercent(5, 20);
  const lieferskonto = randomPercent(1, 4);
  const bezugskosten = randomAmount(5, 80);
  const handlungsKosten = randomPercent(25, 60);
  const gewinnZuschlag = randomPercent(8, 25);
  const kundenSkonto = randomPercent(2, 5);
  const kundenRabatt = randomPercent(5, 20);

  const lepNettoStep = reverseMarkup(lepBrutto, ustRate);
  const rabattStep = applyDeduction(lepNettoStep.base, lieferRabatt);
  const skontoStep = applyDeduction(rabattStep.remaining, lieferskonto);
  const bp = skontoStep.remaining + bezugskosten;
  const handlungskostenStep = applyMarkup(bp, handlungsKosten);
  const gewinnStep = applyMarkup(handlungskostenStep.total, gewinnZuschlag);
  const kundenskontoStep = reverseDiscount(gewinnStep.total, kundenSkonto);
  const kundenrabattStep = reverseDiscount(kundenskontoStep.base, kundenRabatt);
  const ustStep = applyMarkup(kundenrabattStep.base, ustRate);

  const calculated = toRoundedRecord({
    ust: ustStep.amount,
    nettovk: kundenrabattStep.base,
    kundenrabatt: kundenrabattStep.amount,
    zvp: kundenskontoStep.base,
    kundenskonto: kundenskontoStep.amount,
    bvp: gewinnStep.total,
    gewinn: gewinnStep.amount,
    selbstkosten: handlungskostenStep.total,
    handlungskosten: handlungskostenStep.amount,
    bp,
    bezugskosten,
    bep: skontoStep.remaining,
    skonto: skontoStep.amount,
    zep: rabattStep.remaining,
    rabatt: rabattStep.amount,
    lep: lepNettoStep.base,
  });

  const given: Record<string, number> = {
    bruttovk: round2(ustStep.total),
    ustRate,
    kundenRabatt,
    kundenSkonto,
    gewinnZuschlag,
    handlungsKosten,
    bezugskosten: round2(bezugskosten),
    lieferskonto,
    lieferRabatt,
  };

  return { given, calculated, schema: RUECKWAERTS_SCHEMA };
}

export function generateDifferenzCalculation(): GeneratedDifferenz {
  const lepBrutto = randomAmount(100, 1500);
  const ustRate = 19;
  const lieferRabatt = randomPercent(5, 20);
  const lieferskonto = randomPercent(1, 4);
  const bezugskosten = randomAmount(5, 80);
  const handlungsKosten = randomPercent(25, 60);
  const gewinnZuschlag = randomPercent(8, 25);
  const kundenSkonto = randomPercent(2, 5);
  const kundenRabatt = randomPercent(5, 20);

  const lepNettoStep = reverseMarkup(lepBrutto, ustRate);
  const rabattStep = applyDeduction(lepNettoStep.base, lieferRabatt);
  const skontoStep = applyDeduction(rabattStep.remaining, lieferskonto);
  const bp = skontoStep.remaining + bezugskosten;
  const handlungskostenStep = applyMarkup(bp, handlungsKosten);
  const gewinnStep = applyMarkup(handlungskostenStep.total, gewinnZuschlag);
  const kundenskontoStep = reverseDiscount(gewinnStep.total, kundenSkonto);
  const kundenrabattStep = reverseDiscount(kundenskontoStep.base, kundenRabatt);
  const ustForwardStep = applyMarkup(kundenrabattStep.base, ustRate);

  const buildBackwardFromMarket = (marketBruttovk: number) => {
    const ustBackwardStep = reverseMarkup(marketBruttovk, ustRate);
    const kundenrabattBackwardStep = applyDeduction(ustBackwardStep.base, kundenRabatt);
    const kundenskontoBackwardStep = applyDeduction(kundenrabattBackwardStep.remaining, kundenSkonto);
    const gewinnBackwardStep = reverseMarkup(kundenskontoBackwardStep.remaining, gewinnZuschlag);
    const handlungskostenBackwardStep = reverseMarkup(gewinnBackwardStep.base, handlungsKosten);
    const bepMarkt = handlungskostenBackwardStep.base - bezugskosten;

    if (bepMarkt <= 0) {
      return null;
    }

    const skontoBackwardStep = reverseDiscount(bepMarkt, lieferskonto);
    const rabattBackwardStep = reverseDiscount(skontoBackwardStep.base, lieferRabatt);

    const stepValues = [
      ustBackwardStep.amount,
      ustBackwardStep.base,
      kundenrabattBackwardStep.amount,
      kundenrabattBackwardStep.remaining,
      kundenskontoBackwardStep.amount,
      kundenskontoBackwardStep.remaining,
      gewinnBackwardStep.amount,
      gewinnBackwardStep.base,
      handlungskostenBackwardStep.amount,
      handlungskostenBackwardStep.base,
      bepMarkt,
      skontoBackwardStep.amount,
      skontoBackwardStep.base,
      rabattBackwardStep.amount,
      rabattBackwardStep.base,
    ];

    if (stepValues.some((value) => value < 0)) {
      return null;
    }

    return {
      ustBackwardStep,
      kundenrabattBackwardStep,
      kundenskontoBackwardStep,
      gewinnBackwardStep,
      handlungskostenBackwardStep,
      bepMarkt,
      skontoBackwardStep,
      rabattBackwardStep,
    };
  };

  let bruttovkMarkt = round2(ustForwardStep.total);
  let backwardMarket = buildBackwardFromMarket(bruttovkMarkt);

  for (let attempt = 0; attempt < 25 && !backwardMarket; attempt += 1) {
    const variance = 0.9 + Math.random() * 0.35;
    bruttovkMarkt = round2(ustForwardStep.total * variance);
    backwardMarket = buildBackwardFromMarket(bruttovkMarkt);
  }

  if (!backwardMarket) {
    bruttovkMarkt = round2(ustForwardStep.total);
    backwardMarket = buildBackwardFromMarket(bruttovkMarkt);
  }

  if (!backwardMarket) {
    throw new Error('Konnte keine gültige Differenzkalkulation erzeugen.');
  }

  const {
    ustBackwardStep,
    kundenrabattBackwardStep,
    kundenskontoBackwardStep,
    gewinnBackwardStep,
    handlungskostenBackwardStep,
    bepMarkt,
    skontoBackwardStep,
    rabattBackwardStep,
  } = backwardMarket;

  const forwardSteps = toRoundedRecord({
    lep: lepNettoStep.base,
    rabatt: rabattStep.amount,
    zep: rabattStep.remaining,
    skonto: skontoStep.amount,
    bep: skontoStep.remaining,
    bezugskosten,
    bp,
    handlungskosten: handlungskostenStep.amount,
    selbstkosten: handlungskostenStep.total,
    gewinn: gewinnStep.amount,
    bvp: gewinnStep.total,
    kundenskonto: kundenskontoStep.amount,
    zvp: kundenskontoStep.base,
    kundenrabatt: kundenrabattStep.amount,
    nettovk: kundenrabattStep.base,
    ust: ustForwardStep.amount,
    bruttovk: ustForwardStep.total,
  });

  const backwardSteps = toRoundedRecord({
    ust: ustBackwardStep.amount,
    nettovk: ustBackwardStep.base,
    kundenrabatt: kundenrabattBackwardStep.amount,
    zvp: kundenrabattBackwardStep.remaining,
    kundenskonto: kundenskontoBackwardStep.amount,
    bvp: kundenskontoBackwardStep.remaining,
    gewinn: gewinnBackwardStep.amount,
    selbstkosten: gewinnBackwardStep.base,
    handlungskosten: handlungskostenBackwardStep.amount,
    bp: handlungskostenBackwardStep.base,
    bezugskosten,
    bep: bepMarkt,
    skonto: skontoBackwardStep.amount,
    zep: skontoBackwardStep.base,
    rabatt: rabattBackwardStep.amount,
    lep: rabattBackwardStep.base,
  });

  const differenz = round2(bruttovkMarkt - forwardSteps.bruttovk);

  const given: Record<string, number> = {
    lepBrutto: round2(lepBrutto),
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
  forwardSteps?: Record<string, number>,
  backwardSteps?: Record<string, number>
): Question {
  const typeLabel = type === 'vorwaerts'
    ? 'Vorwärtskalkulation'
    : type === 'rueckwaerts'
      ? 'Rückwärtskalkulation'
      : 'Differenzkalkulation';

  let frage = `Berechne die ${typeLabel}!\n\n`;
  frage += 'Gegebene Werte:\n';

  if (type === 'differenz') {
    frage += `• Listeneinkaufspreis (brutto): ${formatEuro(given.lepBrutto)}\n`;
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
  } else if (type === 'vorwaerts') {
    frage += `• Listeneinkaufspreis (brutto): ${formatEuro(given.lepBrutto)}\n`;
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
      ...buildAnswerInputs(VORWAERTS_SCHEMA, given, 'forward_', 'Vorwärts'),
      ...buildAnswerInputs(RUECKWAERTS_SCHEMA, given, 'backward_', 'Rückwärts', ['bruttovk']),
      {
        valueKey: 'differenz',
        label: 'Differenz (Markt-Brutto-VK − berechneter Brutto-VK)',
      },
    ];

    solutionSteps.push('=== VORWÄRTSKALKULATION (LEP → Brutto-VK) ===');
    solutionSteps.push(`Gegeben: LEP brutto = ${formatEuro(given.lepBrutto)}`);
    solutionSteps.push('');
    solutionSteps.push(`LEP netto = ${formatEuro(given.lepBrutto)} / 1,19 = ${formatEuro(forwardSteps.lep)}`);
    solutionSteps.push(`Rabatt = ${formatEuro(forwardSteps.lep)} × ${given.lieferRabatt}% = ${formatEuro(forwardSteps.rabatt)}`);
    solutionSteps.push(`ZEP = ${formatEuro(forwardSteps.lep)} − ${formatEuro(forwardSteps.rabatt)} = ${formatEuro(forwardSteps.zep)}`);
    solutionSteps.push(`Skonto = ${formatEuro(forwardSteps.zep)} × ${given.lieferskonto}% = ${formatEuro(forwardSteps.skonto)}`);
    solutionSteps.push(`BEP = ${formatEuro(forwardSteps.zep)} − ${formatEuro(forwardSteps.skonto)} = ${formatEuro(forwardSteps.bep)}`);
    solutionSteps.push(`BP = ${formatEuro(forwardSteps.bep)} + ${formatEuro(forwardSteps.bezugskosten)} = ${formatEuro(forwardSteps.bp)}`);
    solutionSteps.push(`Handlungskosten = ${formatEuro(forwardSteps.bp)} × ${given.handlungsKosten}% = ${formatEuro(forwardSteps.handlungskosten)}`);
    solutionSteps.push(`Selbstkosten = ${formatEuro(forwardSteps.bp)} + ${formatEuro(forwardSteps.handlungskosten)} = ${formatEuro(forwardSteps.selbstkosten)}`);
    solutionSteps.push(`Gewinn = ${formatEuro(forwardSteps.selbstkosten)} × ${given.gewinnZuschlag}% = ${formatEuro(forwardSteps.gewinn)}`);
    solutionSteps.push(`BVP = ${formatEuro(forwardSteps.selbstkosten)} + ${formatEuro(forwardSteps.gewinn)} = ${formatEuro(forwardSteps.bvp)}`);
    solutionSteps.push(`ZVP = ${formatEuro(forwardSteps.bvp)} / (1 - ${given.kundenSkonto}%) = ${formatEuro(forwardSteps.zvp)}`);
    solutionSteps.push(`Kundenskonto = ${formatEuro(forwardSteps.zvp)} − ${formatEuro(forwardSteps.bvp)} = ${formatEuro(forwardSteps.kundenskonto)}`);
    solutionSteps.push(`Netto-VK = ${formatEuro(forwardSteps.zvp)} / (1 - ${given.kundenRabatt}%) = ${formatEuro(forwardSteps.nettovk)}`);
    solutionSteps.push(`Kundenrabatt = ${formatEuro(forwardSteps.nettovk)} − ${formatEuro(forwardSteps.zvp)} = ${formatEuro(forwardSteps.kundenrabatt)}`);
    solutionSteps.push(`USt = ${formatEuro(forwardSteps.nettovk)} × ${given.ustRate}% = ${formatEuro(forwardSteps.ust)}`);
    solutionSteps.push(`Brutto-VK = ${formatEuro(forwardSteps.nettovk)} + ${formatEuro(forwardSteps.ust)} = ${formatEuro(forwardSteps.bruttovk)}`);
    solutionSteps.push('');

    solutionSteps.push('=== RÜCKWÄRTSKALKULATION (Markt-Brutto-VK → LEP) ===');
    solutionSteps.push(`Gegeben: Markt-Brutto-VK = ${formatEuro(given.bruttovkMarkt)}`);
    solutionSteps.push('');
    solutionSteps.push(`Netto-VK = ${formatEuro(given.bruttovkMarkt)} / 1,19 = ${formatEuro(backwardSteps.nettovk)}`);
    solutionSteps.push(`USt = ${formatEuro(given.bruttovkMarkt)} − ${formatEuro(backwardSteps.nettovk)} = ${formatEuro(backwardSteps.ust)}`);
    solutionSteps.push(`Kundenrabatt = ${formatEuro(backwardSteps.nettovk)} × ${given.kundenRabatt}% = ${formatEuro(backwardSteps.kundenrabatt)}`);
    solutionSteps.push(`ZVP = ${formatEuro(backwardSteps.nettovk)} − ${formatEuro(backwardSteps.kundenrabatt)} = ${formatEuro(backwardSteps.zvp)}`);
    solutionSteps.push(`Kundenskonto = ${formatEuro(backwardSteps.zvp)} × ${given.kundenSkonto}% = ${formatEuro(backwardSteps.kundenskonto)}`);
    solutionSteps.push(`BVP = ${formatEuro(backwardSteps.zvp)} − ${formatEuro(backwardSteps.kundenskonto)} = ${formatEuro(backwardSteps.bvp)}`);
    solutionSteps.push(`Selbstkosten = ${formatEuro(backwardSteps.bvp)} / (1 + ${given.gewinnZuschlag}%) = ${formatEuro(backwardSteps.selbstkosten)}`);
    solutionSteps.push(`Gewinn = ${formatEuro(backwardSteps.bvp)} − ${formatEuro(backwardSteps.selbstkosten)} = ${formatEuro(backwardSteps.gewinn)}`);
    solutionSteps.push(`BP = ${formatEuro(backwardSteps.selbstkosten)} / (1 + ${given.handlungsKosten}%) = ${formatEuro(backwardSteps.bp)}`);
    solutionSteps.push(`Handlungskosten = ${formatEuro(backwardSteps.selbstkosten)} − ${formatEuro(backwardSteps.bp)} = ${formatEuro(backwardSteps.handlungskosten)}`);
    solutionSteps.push(`BEP = ${formatEuro(backwardSteps.bp)} − ${formatEuro(backwardSteps.bezugskosten)} = ${formatEuro(backwardSteps.bep)}`);
    solutionSteps.push(`ZEP = ${formatEuro(backwardSteps.bep)} / (1 - ${given.lieferskonto}%) = ${formatEuro(backwardSteps.zep)}`);
    solutionSteps.push(`Skonto = ${formatEuro(backwardSteps.zep)} − ${formatEuro(backwardSteps.bep)} = ${formatEuro(backwardSteps.skonto)}`);
    solutionSteps.push(`LEP netto = ${formatEuro(backwardSteps.zep)} / (1 - ${given.lieferRabatt}%) = ${formatEuro(backwardSteps.lep)}`);
    solutionSteps.push(`Rabatt = ${formatEuro(backwardSteps.lep)} − ${formatEuro(backwardSteps.zep)} = ${formatEuro(backwardSteps.rabatt)}`);
    solutionSteps.push(`LEP brutto = ${formatEuro(backwardSteps.lep)} × 1,19 = ${formatEuro(backwardSteps.lep * 1.19)}`);
    solutionSteps.push('');

    const differenz = calculated.differenz as number;
    const differenzLabel = differenz >= 0 ? 'Gewinnspielraum' : 'Unterdeckung';
    solutionSteps.push('=== ERGEBNIS ===');
    solutionSteps.push('Differenz = Markt-Brutto-VK − berechneter Brutto-VK');
    solutionSteps.push(`Differenz = ${formatEuro(given.bruttovkMarkt)} − ${formatEuro(forwardSteps.bruttovk)}`);
    solutionSteps.push(`Differenz = ${formatEuro(Math.abs(differenz))}`);
    solutionSteps.push('');
    solutionSteps.push(`${differenz >= 0 ? '✅' : '❌'} ${differenzLabel}: ${formatEuro(Math.abs(differenz))}`);
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
      solutionSteps.push(`Gegeben: LEP brutto = ${formatEuro(given.lepBrutto)}, Rabatt = ${given.lieferRabatt}%, Skonto = ${given.lieferskonto}%`);
      solutionSteps.push('');
      solutionSteps.push(`LEP netto = ${formatEuro(given.lepBrutto)} / 1,19 = ${formatEuro(calculated.lep as number)}`);
      solutionSteps.push(`Rabatt = ${formatEuro(calculated.lep as number)} × ${given.lieferRabatt}% = ${formatEuro(calculated.rabatt as number)}`);
      solutionSteps.push(`ZEP = ${formatEuro(calculated.lep as number)} − ${formatEuro(calculated.rabatt as number)} = ${formatEuro(calculated.zep as number)}`);
      solutionSteps.push(`Skonto = ${formatEuro(calculated.zep as number)} × ${given.lieferskonto}% = ${formatEuro(calculated.skonto as number)}`);
      solutionSteps.push(`BEP = ${formatEuro(calculated.zep as number)} − ${formatEuro(calculated.skonto as number)} = ${formatEuro(calculated.bep as number)}`);
      solutionSteps.push(`BP = ${formatEuro(calculated.bep as number)} + ${formatEuro(calculated.bezugskosten as number)} = ${formatEuro(calculated.bp as number)}`);
      solutionSteps.push(`Handlungskosten = ${formatEuro(calculated.bp as number)} × ${given.handlungsKosten}% = ${formatEuro(calculated.handlungskosten as number)}`);
      solutionSteps.push(`Selbstkosten = ${formatEuro(calculated.bp as number)} + ${formatEuro(calculated.handlungskosten as number)} = ${formatEuro(calculated.selbstkosten as number)}`);
      solutionSteps.push(`Gewinn = ${formatEuro(calculated.selbstkosten as number)} × ${given.gewinnZuschlag}% = ${formatEuro(calculated.gewinn as number)}`);
      solutionSteps.push(`BVP = ${formatEuro(calculated.selbstkosten as number)} + ${formatEuro(calculated.gewinn as number)} = ${formatEuro(calculated.bvp as number)}`);
      solutionSteps.push(`ZVP = ${formatEuro(calculated.bvp as number)} / (1 - ${given.kundenSkonto}%) = ${formatEuro(calculated.zvp as number)}`);
      solutionSteps.push(`Kundenskonto = ${formatEuro(calculated.zvp as number)} − ${formatEuro(calculated.bvp as number)} = ${formatEuro(calculated.kundenskonto as number)}`);
      solutionSteps.push(`Netto-VK = ${formatEuro(calculated.zvp as number)} / (1 - ${given.kundenRabatt}%) = ${formatEuro(calculated.nettovk as number)}`);
      solutionSteps.push(`Kundenrabatt = ${formatEuro(calculated.nettovk as number)} − ${formatEuro(calculated.zvp as number)} = ${formatEuro(calculated.kundenrabatt as number)}`);
      solutionSteps.push(`USt = ${formatEuro(calculated.nettovk as number)} × ${given.ustRate}% = ${formatEuro(calculated.ust as number)}`);
      solutionSteps.push(`Brutto-VK = ${formatEuro(calculated.nettovk as number)} + ${formatEuro(calculated.ust as number)} = ${formatEuro(calculated.bruttovk as number)}`);
    } else {
      solutionSteps.push(`Gegeben: Brutto-VK = ${formatEuro(given.bruttovk)}, alle Zu- und Abschläge`);
      solutionSteps.push('');
      solutionSteps.push(`Netto-VK = ${formatEuro(given.bruttovk)} / 1,19 = ${formatEuro(calculated.nettovk as number)}`);
      solutionSteps.push(`USt = ${formatEuro(given.bruttovk)} − ${formatEuro(calculated.nettovk as number)} = ${formatEuro(calculated.ust as number)}`);
      solutionSteps.push(`Kundenrabatt = ${formatEuro(calculated.nettovk as number)} × ${given.kundenRabatt}% = ${formatEuro(calculated.kundenrabatt as number)}`);
      solutionSteps.push(`ZVP = ${formatEuro(calculated.nettovk as number)} − ${formatEuro(calculated.kundenrabatt as number)} = ${formatEuro(calculated.zvp as number)}`);
      solutionSteps.push(`Kundenskonto = ${formatEuro(calculated.zvp as number)} × ${given.kundenSkonto}% = ${formatEuro(calculated.kundenskonto as number)}`);
      solutionSteps.push(`BVP = ${formatEuro(calculated.zvp as number)} − ${formatEuro(calculated.kundenskonto as number)} = ${formatEuro(calculated.bvp as number)}`);
      solutionSteps.push(`Selbstkosten = ${formatEuro(calculated.bvp as number)} / (1 + ${given.gewinnZuschlag}%) = ${formatEuro(calculated.selbstkosten as number)}`);
      solutionSteps.push(`Gewinn = ${formatEuro(calculated.bvp as number)} − ${formatEuro(calculated.selbstkosten as number)} = ${formatEuro(calculated.gewinn as number)}`);
      solutionSteps.push(`BP = ${formatEuro(calculated.selbstkosten as number)} / (1 + ${given.handlungsKosten}%) = ${formatEuro(calculated.bp as number)}`);
      solutionSteps.push(`Handlungskosten = ${formatEuro(calculated.selbstkosten as number)} − ${formatEuro(calculated.bp as number)} = ${formatEuro(calculated.handlungskosten as number)}`);
      solutionSteps.push(`BEP = ${formatEuro(calculated.bp as number)} − ${formatEuro(calculated.bezugskosten as number)} = ${formatEuro(calculated.bep as number)}`);
      solutionSteps.push(`ZEP = ${formatEuro(calculated.bep as number)} / (1 - ${given.lieferskonto}%) = ${formatEuro(calculated.zep as number)}`);
      solutionSteps.push(`Skonto = ${formatEuro(calculated.zep as number)} − ${formatEuro(calculated.bep as number)} = ${formatEuro(calculated.skonto as number)}`);
      solutionSteps.push(`LEP netto = ${formatEuro(calculated.zep as number)} / (1 - ${given.lieferRabatt}%) = ${formatEuro(calculated.lep as number)}`);
      solutionSteps.push(`Rabatt = ${formatEuro(calculated.lep as number)} − ${formatEuro(calculated.zep as number)} = ${formatEuro(calculated.rabatt as number)}`);
      solutionSteps.push(`LEP brutto = ${formatEuro(calculated.lep as number)} × 1,19 = ${formatEuro((calculated.lep as number) * 1.19)}`);
    }
  }

  const difficulty: 'easy' | 'medium' | 'hard' =
    type === 'vorwaerts' ? 'medium' : 'hard';

  return {
    id: `handelskalkulation-${Date.now()}`,
    theme: 'Wirtschaftsrechnen',
    module: 'handelskalkulation',
    questionText: frage,
    expectedAnswers,
    solutionSteps,
    difficulty,
    answerInputs,
  };
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

  const { given, calculated, forwardSteps, backwardSteps, schema } = generateDifferenzCalculation();
  return buildQuestion(type, given, calculated, schema, forwardSteps, backwardSteps);
}

export { VORWAERTS_SCHEMA, RUECKWAERTS_SCHEMA };
