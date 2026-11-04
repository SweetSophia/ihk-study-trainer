import { parseMoneyCents } from './moneyPrecision';
import type { CalculationLearningRow, Question } from '../types';
import { parseLocaleFloat, validateQuestionAnswers, validateStructuredAnswer } from './answerValidation';

type Values = Record<string, number>;
const euro = (value: number) => `${value.toFixed(2).replace('.', ',')} €`;
const factor = (percent: number) => (percent / 100).toFixed(2).replace('.', ',');
const cents = (value: number) => Math.round(value * 100) / 100;

/** Build explanations from the existing rounded results, not a second answer engine. */
export function buildCalculationLearning(
  mode: 'vorwaerts' | 'rueckwaerts' | 'differenz',
  given: Values,
  calculated: Values,
  forward?: Values,
  backward?: Values,
) {
  const steps: string[] = [];
  const rows: CalculationLearningRow[] = [];
  const add = (keys: string[], title: string, why: string, equations: string[], prefix = '') => {
    steps.push(`${title}\n${why}\n${equations.join('\n')}`);
    for (const key of keys) rows.push({ valueKey: prefix + key, hint: why });
  };
  const alternative = (key: string, value: number, hint: string) => {
    const row = rows.find(row => row.valueKey === key);
    if (row) (row.alternatives ??= []).push({ value: cents(value), hint });
  };
  const g = given;
  const buildForward = (v: Values, prefix = '') => {
    add(['lep'], 'Vorwärtskalkulation: Start beim Einkauf',
      'Der LEP netto ist die 100%-Basis für den Lieferantenrabatt. Alle Einkaufs- und Kostenwerte bleiben netto; jede neue Geldzeile wird auf Cent gerundet und so weiterverwendet.',
      [`LEP netto = ${euro(g.lepNetto)}`], prefix);
    add(['rabatt', 'zep'], 'Lieferantenrabatt abziehen',
      `Der LEP netto ist die 100%-Basis. ${g.lieferRabatt}% davon sind der Rabatt; nach seinem Abzug bleibt der ZEP.`,
      [`Rabatt = ${euro(g.lepNetto)} × ${g.lieferRabatt}% = ${euro(v.rabatt)}`, `ZEP = ${euro(g.lepNetto)} − ${euro(v.rabatt)} = ${euro(v.zep)}`], prefix);
    add(['skonto', 'bep'], 'Lieferskonto abziehen',
      `Der ZEP nach Rabatt ist jetzt die 100%-Basis für ${g.lieferskonto}% Lieferskonto, nicht der ursprüngliche LEP.`,
      [`Skonto = ${euro(v.zep)} × ${g.lieferskonto}% = ${euro(v.skonto)}`, `BEP = ${euro(v.zep)} − ${euro(v.skonto)} = ${euro(v.bep)}`], prefix);
    alternative(prefix + 'skonto', g.lepNetto * g.lieferskonto / 100, 'Prüfe die Skontobasis: Lieferskonto bezieht sich auf den ZEP nach Lieferantenrabatt, nicht auf den LEP.');
    add(['bp'], 'Bezugskosten hinzurechnen', 'Bezugskosten sind ein fester Eurobetrag, kein Prozentsatz. Addiere sie einmal zum BEP.',
      [`BP = ${euro(v.bep)} + ${euro(g.bezugskosten)} = ${euro(v.bp)}`], prefix);
    add(['handlungskosten', 'selbstkosten'], 'Handlungskosten aufschlagen',
      `Der BP ist die 100%-Basis für ${g.handlungsKosten}% Handlungskosten. Betrag berechnen und zum BP addieren.`,
      [`Handlungskosten = ${euro(v.bp)} × ${g.handlungsKosten}% = ${euro(v.handlungskosten)}`, `Selbstkosten = ${euro(v.bp)} + ${euro(v.handlungskosten)} = ${euro(v.selbstkosten)}`], prefix);
    add(['gewinn', 'bvp'], 'Gewinnzuschlag aufschlagen',
      `Die Selbstkosten sind die 100%-Basis für ${g.gewinnZuschlag}% Gewinnzuschlag, nicht der spätere Verkaufspreis.`,
      [`Gewinn = ${euro(v.selbstkosten)} × ${g.gewinnZuschlag}% = ${euro(v.gewinn)}`, `BVP = ${euro(v.selbstkosten)} + ${euro(v.gewinn)} = ${euro(v.bvp)}`], prefix);
    add(['zvp', 'kundenskonto'], 'Kundenskonto einkalkulieren',
      `Der ZVP ist die 100%-Basis für ${g.kundenSkonto}% Kundenskonto. Der BVP entspricht ${100 - g.kundenSkonto}% des ZVP; deshalb durch ${factor(100 - g.kundenSkonto)} teilen. Bei 0% bleiben beide Preise gleich.`,
      [`ZVP = ${euro(v.bvp)} / ${factor(100 - g.kundenSkonto)} = ${euro(v.zvp)}`, `Kundenskonto = ${euro(v.zvp)} − ${euro(v.bvp)} = ${euro(v.kundenskonto)}`], prefix);
    alternative(prefix + 'kundenskonto', v.bvp * g.kundenSkonto / 100, 'Prüfe die Richtung: Kundenskonto wird vom ZVP abgezogen. Der BVP ist nur der verbleibende Anteil; zum ZVP wird durch den Restfaktor geteilt.');
    add(['nettovk', 'kundenrabatt'], 'Kundenrabatt einkalkulieren',
      `Der Netto-VK ist die 100%-Basis für ${g.kundenRabatt}% Kundenrabatt. Der ZVP entspricht ${100 - g.kundenRabatt}%; deshalb den Abzug durch Division rückgängig machen.`,
      [`Netto-VK = ${euro(v.zvp)} / ${factor(100 - g.kundenRabatt)} = ${euro(v.nettovk)}`, `Kundenrabatt = ${euro(v.nettovk)} − ${euro(v.zvp)} = ${euro(v.kundenrabatt)}`], prefix);
    alternative(prefix + 'kundenrabatt', v.zvp * g.kundenRabatt / 100, 'Prüfe die Rabattbasis: Der Kundenrabatt bezieht sich auf den Netto-VK (100%), nicht auf den bereits verminderten ZVP.');
    add(['ust', 'bruttovk'], 'Umsatzsteuer auf den Nettoverkaufspreis',
      `Der Netto-VK ist die 100%-Basis. ${g.ustRate}% Umsatzsteuer kommen hinzu; der Brutto-VK entspricht ${100 + g.ustRate}%. Einkaufswerte werden hier nicht nochmals versteuert.`,
      [`USt = ${euro(v.nettovk)} × ${g.ustRate}% = ${euro(v.ust)}`, `Brutto-VK = ${euro(v.nettovk)} + ${euro(v.ust)} = ${euro(v.bruttovk)}`], prefix);
  };
  const buildBackward = (v: Values, gross: number, prefix = '', market = false) => {
    add(['nettovk', 'ust'], 'Rückwärtskalkulation: Umsatzsteuer herausrechnen',
      `Der Netto-VK ist die 100%-Basis; der ${market ? 'Markt-' : ''}Brutto-VK enthält ${100 + g.ustRate}%. Deshalb durch ${factor(100 + g.ustRate)} teilen und den Steuerbetrag als Differenz bestimmen. Jede neue Geldzeile auf Cent runden und so weiterrechnen.`,
      [`Netto-VK = ${euro(gross)} / ${factor(100 + g.ustRate)} = ${euro(v.nettovk)}`, `USt = ${euro(gross)} − ${euro(v.nettovk)} = ${euro(v.ust)}`], prefix);
    alternative(prefix + 'ust', gross * g.ustRate / 100, 'Prüfe die Umsatzsteuerbasis: Der Brutto-VK enthält bereits die Steuer und ist mehr als 100%. Erst durch den Steuerfaktor teilen; die Differenz ist der Steuerbetrag.');
    add(['kundenrabatt', 'zvp'], 'Kundenrabatt abziehen',
      `Der Netto-VK ist die 100%-Basis für ${g.kundenRabatt}% Kundenrabatt. Hier wird der Rabatt tatsächlich abgezogen, nicht hochgerechnet.`,
      [`Kundenrabatt = ${euro(v.nettovk)} × ${g.kundenRabatt}% = ${euro(v.kundenrabatt)}`, `ZVP = ${euro(v.nettovk)} − ${euro(v.kundenrabatt)} = ${euro(v.zvp)}`], prefix);
    add(['kundenskonto', 'bvp'], 'Kundenskonto abziehen',
      `Der ZVP ist die 100%-Basis für ${g.kundenSkonto}% Kundenskonto. Nach dem Abzug bleibt der BVP.`,
      [`Kundenskonto = ${euro(v.zvp)} × ${g.kundenSkonto}% = ${euro(v.kundenskonto)}`, `BVP = ${euro(v.zvp)} − ${euro(v.kundenskonto)} = ${euro(v.bvp)}`], prefix);
    add(['selbstkosten', 'gewinn'], 'Gewinnzuschlag rückgängig machen',
      `Die Selbstkosten sind die 100%-Basis. Der BVP enthält den Zuschlag und entspricht ${100 + g.gewinnZuschlag}%; deshalb durch ${factor(100 + g.gewinnZuschlag)} teilen statt den Zuschlag vom BVP zu berechnen.`,
      [`Selbstkosten = ${euro(v.bvp)} / ${factor(100 + g.gewinnZuschlag)} = ${euro(v.selbstkosten)}`, `Gewinn = ${euro(v.bvp)} − ${euro(v.selbstkosten)} = ${euro(v.gewinn)}`], prefix);
    add(['bp', 'handlungskosten'], 'Handlungskostenzuschlag rückgängig machen',
      `Der BP ist die 100%-Basis. Selbstkosten entsprechen ${100 + g.handlungsKosten}%; durch ${factor(100 + g.handlungsKosten)} teilen.`,
      [`BP = ${euro(v.selbstkosten)} / ${factor(100 + g.handlungsKosten)} = ${euro(v.bp)}`, `Handlungskosten = ${euro(v.selbstkosten)} − ${euro(v.bp)} = ${euro(v.handlungskosten)}`], prefix);
    add(['bep'], 'Bezugskosten abziehen', 'Die gegebenen Bezugskosten sind ein fester Eurobetrag. Vom BP einmal abziehen, ohne zusätzlichen Umsatzsteuerabzug.',
      [`BEP = ${euro(v.bp)} − ${euro(g.bezugskosten)} = ${euro(v.bep)}`], prefix);
    add(['zep', 'skonto'], 'Lieferskonto rückgängig machen',
      `Der ZEP ist die 100%-Basis. Nach ${g.lieferskonto}% Skonto bleiben im BEP ${100 - g.lieferskonto}%; deshalb durch ${factor(100 - g.lieferskonto)} teilen.`,
      [`ZEP = ${euro(v.bep)} / ${factor(100 - g.lieferskonto)} = ${euro(v.zep)}`, `Skonto = ${euro(v.zep)} − ${euro(v.bep)} = ${euro(v.skonto)}`], prefix);
    add(['lep', 'rabatt'], 'Lieferantenrabatt rückgängig machen',
      `Der LEP netto ist die 100%-Basis. Der ZEP entspricht ${100 - g.lieferRabatt}%; deshalb durch ${factor(100 - g.lieferRabatt)} teilen. Bei 0% sind ZEP und LEP gleich.`,
      [`LEP netto${market ? ' (aus Marktpreis)' : ''} = ${euro(v.zep)} / ${factor(100 - g.lieferRabatt)} = ${euro(v.lep)}`, `Rabatt = ${euro(v.lep)} − ${euro(v.zep)} = ${euro(v.rabatt)}`], prefix);
  };
  if (mode === 'vorwaerts') buildForward(calculated);
  else if (mode === 'rueckwaerts') buildBackward(calculated, g.bruttovk);
  else {
    if (!forward || !backward) throw new Error('Differential learning content requires both chains.');
    buildForward(forward, 'forward_');
    buildBackward(backward, g.bruttovkMarkt, 'backward_', true);
    add(['differenz'], 'Differenzkalkulation: Preisabstand vergleichen',
      'Der Preisabstand ist Markt-Brutto-VK minus kalkulierter Brutto-VK: positiv = Marktpreis darüber, negativ = darunter, null = gleich. Das ist kein tatsächlicher Gewinn. Der aus dem Marktpreis abgeleitete LEP netto kann vom gegebenen LEP netto abweichen; selbst bei gleichem Brutto-VK kann die Rückrechnung durch Cent-Rundungen abweichen.',
      [`Differenz = ${euro(g.bruttovkMarkt)} − ${euro(forward.bruttovk)} = ${euro(calculated.differenz)}`]);
    if (calculated.differenz !== 0) {
      alternative('differenz', -calculated.differenz, 'Prüfe die Reihenfolge und das Vorzeichen: Markt-Brutto-VK minus berechneter Brutto-VK. Ein niedrigerer Marktpreis ergibt einen negativen Preisabstand.');
    }
  }
  return { solutionSteps: steps, rows };
}

export interface CalculationHint { valueKey: string; label: string; text: string }

/** Guidance is explanatory only. The original validator owns all acceptance decisions. */
export function getCalculationHints(question: Question, answers: Record<string, string>): CalculationHint[] {
  if (!question.calculationLearning || validateQuestionAnswers(question, answers)) return [];
  const hints: CalculationHint[] = [];
  for (const row of question.calculationLearning.rows) {
    const expected = { [row.valueKey]: question.expectedAnswers[row.valueKey] };
    const actual = { [row.valueKey]: answers[row.valueKey] ?? '' };
    const config = question.answerInputs?.find(input => input.valueKey === row.valueKey) ?? { valueKey: row.valueKey };
    if (validateStructuredAnswer([config], expected, actual)) continue;
    const value = parseLocaleFloat(actual[row.valueKey]);
    const pattern = Number.isFinite(value)
      ? row.alternatives?.find(item => cents(value) === item.value) : undefined;
    hints.push({
      valueKey: row.valueKey,
      label: question.answerInputs?.find(input => input.valueKey === row.valueKey)?.label ?? row.valueKey,
      text: !Number.isFinite(value)
        ? 'Bitte gib einen vollständigen Zahlenwert ein, mit Komma oder Punkt als Dezimaltrennzeichen und ohne Eurozeichen.'
        : config.numericRule === 'moneyCents' && parseMoneyCents(actual[row.valueKey]) === null
          ? `Gib den Geldbetrag auf den Cent genau ein. Bruchteile eines Cents werden nicht weggerundet. ${row.hint}`
          : pattern?.hint ?? row.hint,
    });
    if (hints.length === 2) break;
  }
  return hints;
}
