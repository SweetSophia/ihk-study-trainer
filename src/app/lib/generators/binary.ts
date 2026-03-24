export interface BinaryQuestion {
  theme: string;
  questionText: string;
  expectedAnswers: { decimal: string; binary: string };
  solutionSteps: string[];
}

export function generateBinaryQuestion(): BinaryQuestion {
  // Randomly choose between decimal→binary or binary→decimal
  const direction = Math.random() > 0.5 ? 'decimalToBinary' : 'binaryToDecimal';
  
  // Generate random decimal between 1 and 255 (1 byte)
  const decimal = Math.floor(Math.random() * 255) + 1;
  const binary = decimal.toString(2).padStart(8, '0');
  
  if (direction === 'decimalToBinary') {
    return {
      theme: 'Zahlensysteme',
      questionText: `Wandle die Dezimalzahl ${decimal} in eine 8-Bit-Binärzahl um.`,
      expectedAnswers: {
        decimal: decimal.toString(),
        binary: binary
      },
      solutionSteps: [
        `Gegeben: Dezimalzahl = ${decimal}`,
        ``,
        `Schritt 1: Division durch 2 mit Rest`,
        `  ${decimal} ÷ 2 = ${Math.floor(decimal / 2)} Rest ${decimal % 2}`,
        ...generateDivisionSteps(decimal),
        ``,
        `Schritt 2: Reste von unten nach oben lesen`,
        `  Binär: ${binary}`,
        ``,
        `Ergebnis: ${binary}`
      ]
    };
  } else {
    return {
      theme: 'Zahlensysteme',
      questionText: `Wandle die Binärzahl ${binary} in eine Dezimalzahl um.`,
      expectedAnswers: {
        decimal: decimal.toString(),
        binary: binary
      },
      solutionSteps: [
        `Gegeben: Binärzahl = ${binary}`,
        ``,
        `Schritt 1: Stellenwerte bestimmen`,
        `  Position:  7   6   5   4   3   2   1   0`,
        `  Wert:    128  64  32  16   8   4   2   1`,
        `  Binär:     ${binary.split('').join('   ')}`,
        ``,
        `Schritt 2: Werte mit '1' addieren`,
        ...generateBinarySumSteps(binary),
        ``,
        `Ergebnis: ${decimal}`
      ]
    };
  }
}

function generateDivisionSteps(n: number): string[] {
  const steps: string[] = [];
  let current = n;
  while (current > 0) {
    const quotient = Math.floor(current / 2);
    const remainder = current % 2;
    steps.push(`  ${current} ÷ 2 = ${quotient} Rest ${remainder}`);
    current = quotient;
  }
  return steps;
}

function generateBinarySumSteps(binary: string): string[] {
  const steps: string[] = [];
  const values = [128, 64, 32, 16, 8, 4, 2, 1];
  let sum = 0;
  const parts: string[] = [];
  
  for (let i = 0; i < 8; i++) {
    if (binary[i] === '1') {
      parts.push(values[i].toString());
      sum += values[i];
      steps.push(`  ${binary.substring(0, i)}[1]${binary.substring(i + 1)} → +${values[i]} = ${sum}`);
    }
  }
  
  steps.push(`  Summe: ${parts.join(' + ')} = ${sum}`);
  return steps;
}
