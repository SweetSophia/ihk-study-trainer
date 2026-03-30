import { Question } from '../../types';

const unitConversions = [
  { from: 'MB', to: 'MiB', factor: 1000 * 1000 / (1024 * 1024), baseFrom: 1000, baseTo: 1024, exponent: 2 },
  { from: 'GB', to: 'GiB', factor: 1000 * 1000 * 1000 / (1024 * 1024 * 1024), baseFrom: 1000, baseTo: 1024, exponent: 3 },
  { from: 'TB', to: 'TiB', factor: 1000 * 1000 * 1000 * 1000 / (1024 * 1024 * 1024 * 1024), baseFrom: 1000, baseTo: 1024, exponent: 4 },
  { from: 'Mbit', to: 'MB', factor: 1 / 8, baseFrom: 'Mbit', baseTo: 'MB' }
];

export function generateUnitConversionQuestion(): Question {
  const conversion = unitConversions[Math.floor(Math.random() * unitConversions.length)];
  const value = Math.floor(Math.random() * 500) + 10; // Random value 10-510
  
  let result: number;
  let solutionSteps: string[];
  
  if (conversion.from === 'Mbit') {
    result = value / 8;
    solutionSteps = [
      `Gegeben: ${value} ${conversion.from}`,
      `Formel: ${conversion.from} ÷ 8 = ${conversion.to}`,
      `Berechnung: ${value} ÷ 8 = ${result} ${conversion.to}`,
      `Hinweis: 1 Byte = 8 Bit`
    ];
  } else {
    result = value * conversion.factor;
    solutionSteps = [
      `Gegeben: ${value} ${conversion.from}`,
      `Umrechnung: ${conversion.from} verwendet Basis ${conversion.baseFrom}, ${conversion.to} verwendet Basis ${conversion.baseTo}`,
      `Formel: ${value} × (${conversion.baseTo}^${conversion.exponent} ÷ ${conversion.baseFrom}^${conversion.exponent}) = Ergebnis`,
      `Berechnung: ${value} × ${conversion.factor.toFixed(6)} = ${result.toFixed(4)} ${conversion.to}`,
      `Gerundet: ${result.toFixed(2)} ${conversion.to}`
    ];
  }
  
  const difficulty: 'easy' | 'medium' | 'hard' = 
    conversion.from === 'Mbit' ? 'easy' : 
    conversion.from === 'TB' ? 'hard' : 'medium';
  
  return {
    id: `unit-conv-${Date.now()}`,
    theme: 'IT-Mathematik & Datenberechnung',
    module: 'unit-conversion',
    questionText: `Rechne ${value} ${conversion.from} in ${conversion.to} um.`,
    expectedAnswers: {
      result: Number(result.toFixed(2))
    },
    solutionSteps,
    difficulty
  };
}
