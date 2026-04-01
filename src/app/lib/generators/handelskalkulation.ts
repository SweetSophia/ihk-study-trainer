import { Question } from '../../types';

// Types for the Kalkulation schema
export type KalkulationType = 'vorwaerts' | 'rueckwaerts' | 'differenz';

interface KalkulationStep {
  label: string;       // Display name like "Listeneinkaufspreis"
  key: string;         // Key in expectedAnswers
  isPercentage?: boolean;
  isResult?: boolean;  // Steps that are calculated results (no % input)
}

interface KalkulationSchema {
  type: KalkulationType;
  typeLabel: string;
  givenKeys: string[];       // Keys provided as given values
  askKeys: string[];         // Keys the user must calculate
  steps: KalkulationStep[];
}

// Forward Kalkulation schema (LEP → BVP)
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

// Backward Kalkulation schema (BVP → LEP)
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

// Helper to format currency
function formatEuro(value: number): string {
  return value.toFixed(2).replace('.', ',') + ' €';
}

// Helper to calculate percentage value from base
function calcPercent(base: number, percent: number): number {
  return (base * percent) / 100;
}

// Helper to reverse a percentage calculation (for backward)
function reversePercent(value: number, percent: number): number {
  return (value * 100) / (100 + percent);
}

// Round to 2 decimal places
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Generate random percentage in range
function randomPercent(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random amount in range (in cents to avoid float issues)
function randomAmount(minEuros: number, maxEuros: number): number {
  const minCents = minEuros * 100;
  const maxCents = maxEuros * 100;
  return (Math.floor(Math.random() * (maxCents - minCents + 1)) + minCents) / 100;
}

/**
 * Vorwärtskalkulation - Forward calculation
 * Given: LEP brutto, percentages, bezugskosten
 * Calculate: All intermediate values up to BVP
 */
function generateVorwaerts(): {
  given: Record<string, number>;
  calculated: Record<string, number>;
  schema: KalkulationStep[];
} {
  // Given values
  const lepBrutto = randomAmount(100, 1500);
  const ustRate = 19;
  const lieferRabatt = randomPercent(5, 20);
  const lieferskonto = randomPercent(1, 4);
  const bezugskosten = randomAmount(5, 80);
  const handlungsKosten = randomPercent(25, 60);
  const gewinnZuschlag = randomPercent(8, 25);
  const kundenSkonto = randomPercent(2, 5);
  const kundenRabatt = randomPercent(5, 20);

  // Calculate forward
  const lepNetto = lepBrutto / (1 + ustRate / 100);
  const ustLief = lepBrutto - lepNetto;
  const rabattBetrag = calcPercent(lepNetto, lieferRabatt);
  const zep = lepNetto - rabattBetrag;
  const skontoBetrag = calcPercent(zep, lieferskonto);
  const bep = zep - skontoBetrag;
  const bp = bep + bezugskosten;
  const handlungBetrag = calcPercent(bp, handlungsKosten);
  const selbstkosten = bp + handlungBetrag;
  const gewinnBetrag = calcPercent(selbstkosten, gewinnZuschlag);
  const bvp = selbstkosten + gewinnBetrag;
  // Kundenskonto: reverse from BVP to ZVP, then get skonto amount
  const zvp = bvp / (1 - kundenSkonto / 100);
  const kundenSkontoBetrag = zvp - bvp;
  // Kundenrabatt: reverse from ZVP to Netto-VK
  const nettovk = zvp / (1 - kundenRabatt / 100);
  const kundenRabattBetrag = nettovk - zvp;
  const ustBetrag = calcPercent(nettovk, ustRate);
  const bruttovk = nettovk + ustBetrag;

  const calculated = {
    lep: round2(lepNetto),
    rabatt: round2(rabattBetrag),
    zep: round2(zep),
    skonto: round2(skontoBetrag),
    bep: round2(bep),
    bezugskosten: round2(bezugskosten),
    bp: round2(bp),
    handlungskosten: round2(handlungBetrag),
    selbstkosten: round2(selbstkosten),
    gewinn: round2(gewinnBetrag),
    bvp: round2(bvp),
    kundenskonto: round2(kundenSkontoBetrag),
    zvp: round2(zvp),
    kundenrabatt: round2(kundenRabattBetrag),
    nettovk: round2(nettovk),
    ust: round2(ustBetrag),
    bruttovk: round2(bruttovk),
  };

  const given: Record<string, number> = {
    lepBrutto: round2(lepBrutto),
    ustRate,
    lieferRabatt,
    lieferskonto,
    bezugskosten,
    handlungsKosten,
    gewinnZuschlag,
    kundenSkonto,
    kundenRabatt,
  };

  return { given, calculated, schema: VORWAERTS_SCHEMA };
}

/**
 * Differenzkalkulation - Both directions
 * Given: LEP brutto, market BVP, percentages
 * Calculate: Forward to get "should be BVP", then the difference
 * The "Differenz" shows if market price covers costs + desired profit
 */
function generateDifferenz(): {
  given: Record<string, number>;
  calculated: Record<string, number>;
  forwardSteps: Record<string, number>;
  backwardSteps: Record<string, number>;
  schema: KalkulationStep[];
} {
  // Given values - start with LEP and a market BVP that may result in profit or loss
  const lepBrutto = randomAmount(100, 1500);
  const ustRate = 19;
  const lieferRabatt = randomPercent(5, 20);
  const lieferskonto = randomPercent(1, 4);
  const bezugskosten = randomAmount(5, 80);
  const handlungsKosten = randomPercent(25, 60);
  const gewinnZuschlag = randomPercent(8, 25);
  const kundenSkonto = randomPercent(2, 5);
  const kundenRabatt = randomPercent(5, 20);

  // Calculate forward (LEP → BVP)
  const lepNetto = lepBrutto / (1 + ustRate / 100);
  const rabattBetrag = calcPercent(lepNetto, lieferRabatt);
  const zep = lepNetto - rabattBetrag;
  const skontoBetrag = calcPercent(zep, lieferskonto);
  const bep = zep - skontoBetrag;
  const bp = bep + bezugskosten;
  const handlungBetrag = calcPercent(bp, handlungsKosten);
  const selbstkosten = bp + handlungBetrag;
  const gewinnBetrag = calcPercent(selbstkosten, gewinnZuschlag);
  const bvpBerechnet = selbstkosten + gewinnBetrag; // This is the "should be" BVP
  // Kundenskonto: reverse from BVP to ZVP, then get skonto amount
  const zvp = bvpBerechnet / (1 - kundenSkonto / 100);
  const kundenSkontoBetrag = zvp - bvpBerechnet;
  // Kundenrabatt: reverse from ZVP to Netto-VK
  const nettovk = zvp / (1 - kundenRabatt / 100);
  const kundenRabattBetrag = nettovk - zvp;
  const ustBetrag = calcPercent(nettovk, ustRate);
  const bruttovkBerechnet = nettovk + ustBetrag;

  // Now generate a market BVP that's within ±30% of calculated BVP
  // This ensures we sometimes have profit, sometimes loss
  const variance = 1 + (Math.random() * 0.6 - 0.3); // 0.7 to 1.3
  const bruttovkMarkt = round2(bruttovkBerechnet * variance);

  // Calculate backward from market BVP
  const ustBetragMarkt = calcPercent(bruttovkMarkt / (1 + ustRate / 100), ustRate);
  const nettovkMarkt = bruttovkMarkt - ustBetragMarkt;
  const kundenRabattBetragMarkt = nettovkMarkt * (kundenRabatt / (100 + kundenRabatt));
  const zvpMarkt = nettovkMarkt - kundenRabattBetragMarkt;
  const kundenSkontoBetragMarkt = zvpMarkt * (kundenSkonto / (100 + kundenSkonto));
  const bvpMarkt = zvpMarkt - kundenSkontoBetragMarkt;
  const gewinnBetragMarkt = bvpMarkt * (gewinnZuschlag / (100 + gewinnZuschlag));
  const selbstkostenMarkt = bvpMarkt - gewinnBetragMarkt;
  const handlungBetragMarkt = selbstkostenMarkt * (handlungsKosten / (100 + handlungsKosten));
  const bpMarkt = selbstkostenMarkt - handlungBetragMarkt;
  const bepMarkt = bpMarkt - bezugskosten;
  const skontoBetragMarkt = bepMarkt * (lieferskonto / (100 + lieferskonto));
  const zepMarkt = bepMarkt + skontoBetragMarkt;
  const rabattBetragMarkt = zepMarkt * (lieferRabatt / (100 + lieferRabatt));
  const lepNettoMarkt = zepMarkt + rabattBetragMarkt;
  const lepBruttoMarkt = lepNettoMarkt * (1 + ustRate / 100);

  // The difference: positive = Gewinn, negative = Verlust
  const differenz = round2(bruttovkMarkt - bruttovkBerechnet);

  // All intermediate forward steps
  const forwardSteps: Record<string, number> = {
    lep: round2(lepNetto),
    rabatt: round2(rabattBetrag),
    zep: round2(zep),
    skonto: round2(skontoBetrag),
    bep: round2(bep),
    bezugskosten: round2(bezugskosten),
    bp: round2(bp),
    handlungskosten: round2(handlungBetrag),
    selbstkosten: round2(selbstkosten),
    gewinn: round2(gewinnBetrag),
    bvp: round2(bvpBerechnet),
    kundenskonto: round2(kundenSkontoBetrag),
    zvp: round2(zvp),
    kundenrabatt: round2(kundenRabattBetrag),
    nettovk: round2(nettovk),
    ust: round2(ustBetrag),
    bruttovk: round2(bruttovkBerechnet),
  };

  // All intermediate backward steps from market price
  const backwardSteps: Record<string, number> = {
    ust: round2(ustBetragMarkt),
    nettovk: round2(nettovkMarkt),
    kundenrabatt: round2(kundenRabattBetragMarkt),
    zvp: round2(zvpMarkt),
    kundenskonto: round2(kundenSkontoBetragMarkt),
    bvp: round2(bvpMarkt),
    gewinn: round2(gewinnBetragMarkt),
    selbstkosten: round2(selbstkostenMarkt),
    handlungskosten: round2(handlungBetragMarkt),
    bp: round2(bpMarkt),
    bezugskosten: round2(bezugskosten),
    bep: round2(bepMarkt),
    skonto: round2(skontoBetragMarkt),
    zep: round2(zepMarkt),
    rabatt: round2(rabattBetragMarkt),
    lep: round2(lepNettoMarkt),
  };

  const calculated = {
    ...forwardSteps,
    differenz: differenz,
    bruttovkMarkt: round2(bruttovkMarkt),
  };

  const given: Record<string, number> = {
    lepBrutto: round2(lepBrutto),
    ustRate,
    lieferRabatt,
    lieferskonto,
    bezugskosten,
    handlungsKosten,
    gewinnZuschlag,
    kundenSkonto,
    kundenRabatt,
    bruttovkMarkt: round2(bruttovkMarkt),
  };

  return { given, calculated, forwardSteps, backwardSteps, schema: VORWAERTS_SCHEMA };
}

/**
 * Rückwärtskalkulation - Backward calculation
 * Given: BVP (market price), percentages
 * Calculate: Maximum allowable LEP
 */
function generateRueckwaerts(): {
  given: Record<string, number>;
  calculated: Record<string, number>;
  schema: KalkulationStep[];
} {
  // Given values (starting from desired BVP)
  const bruttovk = randomAmount(80, 2000);
  const ustRate = 19;
  const kundenRabatt = randomPercent(5, 20);
  const kundenSkonto = randomPercent(2, 5);
  const gewinnZuschlag = randomPercent(8, 25);
  const handlungsKosten = randomPercent(25, 60);
  const bezugskosten = randomAmount(5, 80);
  const lieferskonto = randomPercent(1, 4);
  const lieferRabatt = randomPercent(5, 20);

  // Calculate backward
  const ustBetrag = calcPercent(bruttovk / (1 + ustRate / 100), ustRate);
  const nettovk = bruttovk - ustBetrag;
  
  // Reverse Kundenrabatt: nettovk = zvp - rabatt, so zvp = nettovk / (1 - rabatt/100)
  const zvp = nettovk / (1 - kundenRabatt / 100);
  const kundenRabattBetrag = zvp - nettovk;
  
  // Reverse Kundenskonto: zvp = bvp + skonto, so bvp = zvp / (1 - skonto/100)
  const bvp = zvp / (1 - kundenSkonto / 100);
  const kundenSkontoBetrag = zvp - bvp;
  
  // Reverse Gewinn: bvp = selbstkosten + gewinn, but gewinn = selbstkosten * %
  const gewinnBetrag = bvp * (gewinnZuschlag / (100 + gewinnZuschlag));
  const selbstkosten = bvp - gewinnBetrag;
  
  // Reverse Handlungskosten
  const handlungBetrag = selbstkosten * (handlungsKosten / (100 + handlungsKosten));
  const bp = selbstkosten - handlungBetrag;
  
  const bep = bp - bezugskosten;
  const skontoBetrag = bep * (lieferskonto / (100 + lieferskonto));
  const zep = bep + skontoBetrag;
  const rabattBetrag = zep * (lieferRabatt / (100 + lieferRabatt));
  const lepNetto = zep + rabattBetrag;
  const lepBrutto = lepNetto * (1 + ustRate / 100);

  const calculated = {
    ust: round2(ustBetrag),
    nettovk: round2(nettovk),
    kundenrabatt: round2(kundenRabattBetrag),
    zvp: round2(zvp),
    kundenskonto: round2(kundenSkontoBetrag),
    bvp: round2(bvp),
    gewinn: round2(gewinnBetrag),
    selbstkosten: round2(selbstkosten),
    handlungskosten: round2(handlungBetrag),
    bp: round2(bp),
    bezugskosten: round2(bezugskosten),
    bep: round2(bep),
    skonto: round2(skontoBetrag),
    zep: round2(zep),
    rabatt: round2(rabattBetrag),
    lep: round2(lepNetto),
  };

  const given: Record<string, number> = {
    bruttovk: round2(bruttovk),
    ustRate,
    kundenRabatt,
    kundenSkonto,
    gewinnZuschlag,
    handlungsKosten,
    bezugskosten,
    lieferskonto,
    lieferRabatt,
  };

  return { given, calculated, schema: RUECKWAERTS_SCHEMA };
}

/**
 * Build the question object from generated data
 */
function buildQuestion(
  type: KalkulationType,
  given: Record<string, number>,
  calculated: Record<string, number>,
  schema: KalkulationStep[],
  forwardSteps?: Record<string, number>,
  backwardSteps?: Record<string, number>
): Question {
  const typeLabel = type === 'vorwaerts' ? 'Vorwärtskalkulation' :
                    type === 'rueckwaerts' ? 'Rückwärtskalkulation' : 'Differenzkalkulation';

  // Build question text with given values
  let frage = `Berechne die ${typeLabel}!\n\n`;
  frage += `Gegebene Werte:\n`;

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
    frage += `\nAufgaben:\n`;
    frage += `1. Berechne die Vorwärtskalkulation (LEP → BVP)\n`;
    frage += `2. Berechne die Rückwärtskalkulation (Markt-VK → LEP)\n`;
    frage += `3. Ermittle die Differenz (Markt-VK − Berechneter BVP)\n`;
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
  }

  if (type !== 'differenz') {
    frage += `\nBerechne alle Zwischen- und Endergebnisse!`;
  }

  // Build expected answers (only the calculated values, not the given ones)
  const expectedAnswers: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(calculated)) {
    // Skip values that are already provided as given values
    if (Object.prototype.hasOwnProperty.call(given, key)) {
      continue;
    }
    expectedAnswers[key] = value.toString();
  }

  // Build solution steps
  const solutionSteps: string[] = [];
  solutionSteps.push(`${typeLabel}`);
  solutionSteps.push('');

  if (type === 'differenz' && forwardSteps && backwardSteps) {
    // Forward calculation steps
    solutionSteps.push(`=== VORWÄRTSKALKULATION (LEP → BVP) ===`);
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
    solutionSteps.push(`BVP (berechnet) = ${formatEuro(forwardSteps.selbstkosten)} + ${formatEuro(forwardSteps.gewinn)} = ${formatEuro(forwardSteps.bvp)}`);
    solutionSteps.push(`Kundenskonto = ${formatEuro(forwardSteps.bvp)} × ${given.kundenSkonto}% / 1,${given.kundenSkonto} = ${formatEuro(forwardSteps.kundenskonto)}`);
    solutionSteps.push(`ZVP = ${formatEuro(forwardSteps.bvp)} + ${formatEuro(forwardSteps.kundenskonto)} = ${formatEuro(forwardSteps.zvp)}`);
    solutionSteps.push(`Kundenrabatt = ${formatEuro(forwardSteps.zvp)} × ${given.kundenRabatt}% / 1,${given.kundenRabatt} = ${formatEuro(forwardSteps.kundenrabatt)}`);
    solutionSteps.push(`Netto-VK = ${formatEuro(forwardSteps.zvp)} + ${formatEuro(forwardSteps.kundenrabatt)} = ${formatEuro(forwardSteps.nettovk)}`);
    solutionSteps.push(`USt = ${formatEuro(forwardSteps.nettovk)} × 19% = ${formatEuro(forwardSteps.ust)}`);
    solutionSteps.push(`Brutto-VK (berechnet) = ${formatEuro(forwardSteps.nettovk)} + ${formatEuro(forwardSteps.ust)} = ${formatEuro(forwardSteps.bruttovk)}`);
    solutionSteps.push('');

    // Backward calculation steps
    solutionSteps.push(`=== RÜCKWÄRTSKALKULATION (Markt-VK → LEP) ===`);
    solutionSteps.push(`Gegeben: Marktpreis = ${formatEuro(given.bruttovkMarkt)}`);
    solutionSteps.push('');
    solutionSteps.push(`USt = ${formatEuro(backwardSteps.ust)}`);
    solutionSteps.push(`Netto-VK = ${formatEuro(given.bruttovkMarkt)} − ${formatEuro(backwardSteps.ust)} = ${formatEuro(backwardSteps.nettovk)}`);
    solutionSteps.push(`Kundenrabatt = ${formatEuro(backwardSteps.nettovk)} × ${given.kundenRabatt}% / 1,${given.kundenRabatt} = ${formatEuro(backwardSteps.kundenrabatt)}`);
    solutionSteps.push(`ZVP = ${formatEuro(backwardSteps.nettovk)} − ${formatEuro(backwardSteps.kundenrabatt)} = ${formatEuro(backwardSteps.zvp)}`);
    solutionSteps.push(`Kundenskonto = ${formatEuro(backwardSteps.zvp)} × ${given.kundenSkonto}% / 1,${given.kundenSkonto} = ${formatEuro(backwardSteps.kundenskonto)}`);
    solutionSteps.push(`BVP = ${formatEuro(backwardSteps.zvp)} − ${formatEuro(backwardSteps.kundenskonto)} = ${formatEuro(backwardSteps.bvp)}`);
    solutionSteps.push(`Gewinn = ${formatEuro(backwardSteps.bvp)} × ${given.gewinnZuschlag}% / 1,${given.gewinnZuschlag} = ${formatEuro(backwardSteps.gewinn)}`);
    solutionSteps.push(`Selbstkosten = ${formatEuro(backwardSteps.bvp)} − ${formatEuro(backwardSteps.gewinn)} = ${formatEuro(backwardSteps.selbstkosten)}`);
    solutionSteps.push(`Handlungskosten = ${formatEuro(backwardSteps.selbstkosten)} × ${given.handlungsKosten}% / 1,${given.handlungsKosten} = ${formatEuro(backwardSteps.handlungskosten)}`);
    solutionSteps.push(`BP = ${formatEuro(backwardSteps.selbstkosten)} − ${formatEuro(backwardSteps.handlungskosten)} = ${formatEuro(backwardSteps.bp)}`);
    solutionSteps.push(`BEP = ${formatEuro(backwardSteps.bp)} − ${formatEuro(backwardSteps.bezugskosten)} = ${formatEuro(backwardSteps.bep)}`);
    solutionSteps.push(`Skonto = ${formatEuro(backwardSteps.bep)} × ${given.lieferskonto}% / 1,${given.lieferskonto} = ${formatEuro(backwardSteps.skonto)}`);
    solutionSteps.push(`ZEP = ${formatEuro(backwardSteps.bep)} + ${formatEuro(backwardSteps.skonto)} = ${formatEuro(backwardSteps.zep)}`);
    solutionSteps.push(`Rabatt = ${formatEuro(backwardSteps.zep)} × ${given.lieferRabatt}% / 1,${given.lieferRabatt} = ${formatEuro(backwardSteps.rabatt)}`);
    solutionSteps.push(`LEP netto = ${formatEuro(backwardSteps.zep)} + ${formatEuro(backwardSteps.rabatt)} = ${formatEuro(backwardSteps.lep)}`);
    solutionSteps.push(`LEP brutto = ${formatEuro(backwardSteps.lep)} × 1,19 = ${formatEuro(backwardSteps.lep * 1.19)}`);
    solutionSteps.push('');

    // Differenz result
    const differenz = calculated.differenz as number;
    const differenzLabel = differenz >= 0 ? 'Gewinn' : 'Verlust';
    solutionSteps.push(`=== ERGEBNIS ===`);
    solutionSteps.push(`Differenz = Markt-VK − Berechneter BVP`);
    solutionSteps.push(`Differenz = ${formatEuro(given.bruttovkMarkt)} − ${formatEuro(forwardSteps.bruttovk)}`);
    solutionSteps.push(`Differenz = ${formatEuro(Math.abs(differenz))}`);
    solutionSteps.push('');
    solutionSteps.push(`${differenz >= 0 ? '✅' : '❌'} ${differenzLabel}: ${formatEuro(Math.abs(differenz))}`);
    if (differenz >= 0) {
      solutionSteps.push(`Der Marktpreis deckt Kosten und Gewinn!`);
    } else {
      solutionSteps.push(`Der Marktpreis deckt NICHT die Kosten!`);
    }
  } else if (type === 'vorwaerts') {
    solutionSteps.push(`Gegeben: LEP brutto = ${formatEuro(given.lepBrutto)}, Rabatt = ${given.lieferRabatt}%, Skonto = ${given.lieferskonto}%`);
    solutionSteps.push('');
    solutionSteps.push(`LEP netto = LEP brutto / 1,19 = ${formatEuro(calculated.lep)}`);
    solutionSteps.push(`Rabatt = ${calculated.lep} × ${given.lieferRabatt}% = ${formatEuro(calculated.rabatt)}`);
    solutionSteps.push(`ZEP = ${formatEuro(calculated.lep)} − ${formatEuro(calculated.rabatt)} = ${formatEuro(calculated.zep)}`);
    solutionSteps.push(`Skonto = ${formatEuro(calculated.zep)} × ${given.lieferskonto}% = ${formatEuro(calculated.skonto)}`);
    solutionSteps.push(`BEP = ${formatEuro(calculated.zep)} − ${formatEuro(calculated.skonto)} = ${formatEuro(calculated.bep)}`);
    solutionSteps.push(`BP = ${formatEuro(calculated.bep)} + ${formatEuro(calculated.bezugskosten)} = ${formatEuro(calculated.bp)}`);
    solutionSteps.push(`Handlungskosten = ${formatEuro(calculated.bp)} × ${given.handlungsKosten}% = ${formatEuro(calculated.handlungskosten)}`);
    solutionSteps.push(`Selbstkosten = ${formatEuro(calculated.bp)} + ${formatEuro(calculated.handlungskosten)} = ${formatEuro(calculated.selbstkosten)}`);
    solutionSteps.push(`Gewinn = ${formatEuro(calculated.selbstkosten)} × ${given.gewinnZuschlag}% = ${formatEuro(calculated.gewinn)}`);
    solutionSteps.push(`BVP = ${formatEuro(calculated.selbstkosten)} + ${formatEuro(calculated.gewinn)} = ${formatEuro(calculated.bvp)}`);
    solutionSteps.push(`Kundenskonto = ${formatEuro(calculated.bvp)} × ${given.kundenSkonto}% / 1,${given.kundenSkonto} = ${formatEuro(calculated.kundenskonto)}`);
    solutionSteps.push(`ZVP = ${formatEuro(calculated.bvp)} + ${formatEuro(calculated.kundenskonto)} = ${formatEuro(calculated.zvp)}`);
    solutionSteps.push(`Kundenrabatt = ${formatEuro(calculated.zvp)} × ${given.kundenRabatt}% / 1,${given.kundenRabatt} = ${formatEuro(calculated.kundenrabatt)}`);
    solutionSteps.push(`Netto-VK = ${formatEuro(calculated.zvp)} + ${formatEuro(calculated.kundenrabatt)} = ${formatEuro(calculated.nettovk)}`);
    solutionSteps.push(`USt = ${formatEuro(calculated.nettovk)} × 19% = ${formatEuro(calculated.ust)}`);
    solutionSteps.push(`Brutto-VK = ${formatEuro(calculated.nettovk)} + ${formatEuro(calculated.ust)} = ${formatEuro(calculated.bruttovk)}`);
  } else {
    solutionSteps.push(`Gegeben: Brutto-VK = ${formatEuro(given.bruttovk)}, alle Zuschläge`);
    solutionSteps.push('');
    solutionSteps.push(`USt = ${formatEuro(calculated.ust)}`);
    solutionSteps.push(`Netto-VK = ${formatEuro(given.bruttovk)} − ${formatEuro(calculated.ust)} = ${formatEuro(calculated.nettovk)}`);
    solutionSteps.push(`Kundenrabatt = ${formatEuro(calculated.nettovk)} × ${given.kundenRabatt}% / 1,${given.kundenRabatt} = ${formatEuro(calculated.kundenrabatt)}`);
    solutionSteps.push(`ZVP = ${formatEuro(calculated.nettovk)} − ${formatEuro(calculated.kundenrabatt)} = ${formatEuro(calculated.zvp)}`);
    solutionSteps.push(`Kundenskonto = ${formatEuro(calculated.zvp)} × ${given.kundenSkonto}% / 1,${given.kundenSkonto} = ${formatEuro(calculated.kundenskonto)}`);
    solutionSteps.push(`BVP = ${formatEuro(calculated.zvp)} − ${formatEuro(calculated.kundenskonto)} = ${formatEuro(calculated.bvp)}`);
    solutionSteps.push(`Gewinn = ${formatEuro(calculated.bvp)} × ${given.gewinnZuschlag}% / 1,${given.gewinnZuschlag} = ${formatEuro(calculated.gewinn)}`);
    solutionSteps.push(`Selbstkosten = ${formatEuro(calculated.bvp)} − ${formatEuro(calculated.gewinn)} = ${formatEuro(calculated.selbstkosten)}`);
    solutionSteps.push(`Handlungskosten = ${formatEuro(calculated.selbstkosten)} × ${given.handlungsKosten}% / 1,${given.handlungsKosten} = ${formatEuro(calculated.handlungskosten)}`);
    solutionSteps.push(`BP = ${formatEuro(calculated.selbstkosten)} − ${formatEuro(calculated.handlungskosten)} = ${formatEuro(calculated.bp)}`);
    solutionSteps.push(`BEP = ${formatEuro(calculated.bp)} − ${formatEuro(calculated.bezugskosten)} = ${formatEuro(calculated.bep)}`);
    solutionSteps.push(`Skonto = ${formatEuro(calculated.bep)} × ${given.lieferskonto}% / 1,${given.lieferskonto} = ${formatEuro(calculated.skonto)}`);
    solutionSteps.push(`ZEP = ${formatEuro(calculated.bep)} + ${formatEuro(calculated.skonto)} = ${formatEuro(calculated.zep)}`);
    solutionSteps.push(`Rabatt = ${formatEuro(calculated.zep)} × ${given.lieferRabatt}% / 1,${given.lieferRabatt} = ${formatEuro(calculated.rabatt)}`);
    solutionSteps.push(`LEP netto = ${formatEuro(calculated.zep)} + ${formatEuro(calculated.rabatt)} = ${formatEuro(calculated.lep)}`);
    solutionSteps.push(`LEP brutto = ${formatEuro(calculated.lep)} × 1,19 = ${formatEuro(calculated.lep * (100 + 19) / 100)}`);
  }

  // Determine difficulty based on type
  const difficulty: 'easy' | 'medium' | 'hard' =
    type === 'vorwaerts' ? 'medium' :
    type === 'rueckwaerts' ? 'hard' : 'hard';

  return {
    id: `handelskalkulation-${Date.now()}`,
    theme: 'Wirtschaftsrechnen',
    module: 'handelskalkulation',
    questionText: frage,
    expectedAnswers,
    solutionSteps,
    difficulty,
  };
}

/**
 * Generate a Handelskalkulation question
 * Randomly picks between Vorwärts, Rückwärts and Differenz kalkulation
 */
export function generateHandelskalkulationQuestion(): Question {
  // Equal 1/3 chance for each type
  const rand = Math.random();
  const type: KalkulationType = rand < 0.333 ? 'vorwaerts' : rand < 0.666 ? 'rueckwaerts' : 'differenz';

  if (type === 'vorwaerts') {
    const { given, calculated, schema } = generateVorwaerts();
    return buildQuestion(type, given, calculated, schema);
  } else if (type === 'rueckwaerts') {
    const { given, calculated, schema } = generateRueckwaerts();
    return buildQuestion(type, given, calculated, schema);
  } else {
    const { given, calculated, forwardSteps, backwardSteps, schema } = generateDifferenz();
    return buildQuestion(type, given, calculated, schema, forwardSteps, backwardSteps);
  }
}

// Export schemas for reference
export { VORWAERTS_SCHEMA, RUECKWAERTS_SCHEMA };
