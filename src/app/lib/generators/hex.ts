export interface HexQuestion {
  theme: string;
  questionText: string;
  expectedAnswers: { hex: string; decimal: string };
  solutionSteps: string[];
}

export function generateHexQuestion(): HexQuestion {
  // Randomly choose between decimal→hex or hex→decimal
  const direction = Math.random() > 0.5 ? 'decimalToHex' : 'hexToDecimal';
  
  // Generate random decimal between 1 and 4095 (to stay within 3 hex digits)
  const decimal = Math.floor(Math.random() * 4095) + 1;
  const hex = decimal.toString(16).toUpperCase().padStart(3, '0');
  
  if (direction === 'decimalToHex') {
    return {
      theme: 'Zahlensysteme',
      questionText: `Wandle die Dezimalzahl ${decimal} in eine Hexadezimalzahl um.`,
      expectedAnswers: {
        hex: hex,
        decimal: decimal.toString()
      },
      solutionSteps: [
        `Gegeben: Dezimalzahl = ${decimal}`,
        ``,
        `Schritt 1: Division durch 16 mit Rest`,
        ...generateHexDivisionSteps(decimal),
        ``,
        `Schritt 2: Reste in Hexadezimal umwandeln`,
        `  0-9 bleiben gleich, 10=A, 11=B, 12=C, 13=D, 14=E, 15=F`,
        ``,
        `Schritt 3: Reste von unten nach oben lesen`,
        `  Hexadezimal: ${hex}`,
        ``,
        `Ergebnis: ${hex}`
      ]
    };
  } else {
    return {
      theme: 'Zahlensysteme',
      questionText: `Wandle die Hexadezimalzahl 0x${hex} in eine Dezimalzahl um.`,
      expectedAnswers: {
        hex: hex,
        decimal: decimal.toString()
      },
      solutionSteps: [
        `Gegeben: Hexadezimal = 0x${hex}`,
        ``,
        `Schritt 1: Hex-Ziffern einzeln betrachten`,
        ...generateHexMultiplySteps(hex),
        ``,
        `Schritt 2: Werte zusammenaddieren`,
        `  Summe: ${calculateHexSum(hex)} = ${decimal}`,
        ``,
        `Ergebnis: ${decimal}`
      ]
    };
  }
}

function generateHexDivisionSteps(n: number): string[] {
  const steps: string[] = [];
  let current = n;
  while (current > 0) {
    const quotient = Math.floor(current / 16);
    const remainder = current % 16;
    const hexDigit = remainder.toString(16).toUpperCase();
    steps.push(`  ${current} ÷ 16 = ${quotient} Rest ${remainder} (${hexDigit})`);
    current = quotient;
  }
  return steps;
}

function generateHexMultiplySteps(hex: string): string[] {
  const steps: string[] = [];
  const digits = hex.split('');
  const power = digits.length - 1;
  
  digits.forEach((digit, index) => {
    const value = parseInt(digit, 16);
    const multiplier = Math.pow(16, power - index);
    const result = value * multiplier;
    steps.push(`  Position ${index}: ${digit} × 16^${power - index} = ${value} × ${multiplier} = ${result}`);
  });
  
  return steps;
}

function calculateHexSum(hex: string): string {
  const digits = hex.split('');
  const power = digits.length - 1;
  const parts: string[] = [];
  
  digits.forEach((digit, index) => {
    const value = parseInt(digit, 16);
    const result = value * Math.pow(16, power - index);
    parts.push(result.toString());
  });
  
  return parts.join(' + ');
}
