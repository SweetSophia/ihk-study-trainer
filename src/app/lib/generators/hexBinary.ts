export interface HexBinaryQuestion {
  theme: string;
  questionText: string;
  expectedAnswers: { binary: string } | { hex: string };
  solutionSteps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export const HEX_BINARY_PAIRS: { hex: string; binary: string; decimal: number; difficulty: 'easy' | 'medium' | 'hard' }[] = Array.from(
  { length: 256 },
  (_, i) => ({
    hex: i.toString(16).toUpperCase().padStart(2, '0'),
    binary: i.toString(2).padStart(8, '0'),
    decimal: i,
    difficulty: i <= 127 ? 'easy' as const : i <= 191 ? 'medium' as const : 'hard' as const,
  }),
);

function buildHexToBinarySteps(pair: typeof HEX_BINARY_PAIRS[number]): string[] {
  const highNibble = pair.hex[0];
  const lowNibble = pair.hex[1];
  const highBin = parseInt(highNibble, 16).toString(2).padStart(4, '0');
  const lowBin = parseInt(lowNibble, 16).toString(2).padStart(4, '0');

  return [
    `Gegeben: Hexadezimal = 0x${pair.hex}`,
    ``,
    `Schritt 1: Jede Hex-Ziffer in 4-Bit-Binär umwandeln`,
    `  Tabelle: 0=0000, 1=0001, 2=0010, 3=0011, 4=0100, 5=0101, 6=0110, 7=0111`,
    `           8=1000, 9=1001, A=1010, B=1011, C=1100, D=1101, E=1110, F=1111`,
    ``,
    `Schritt 2: Hex-Ziffern einzeln umwandeln`,
    `  ${highNibble} → ${highBin}`,
    `  ${lowNibble} → ${lowBin}`,
    ``,
    `Schritt 3: Binärgruppen zusammenfügen`,
    `  ${highBin} ${lowBin} → ${pair.binary}`,
    ``,
    `Ergebnis: ${pair.binary}`,
  ];
}

function buildBinaryToHexSteps(pair: typeof HEX_BINARY_PAIRS[number]): string[] {
  const highNibble = pair.hex[0];
  const lowNibble = pair.hex[1];
  const highBin = pair.binary.substring(0, 4);
  const lowBin = pair.binary.substring(4, 8);

  return [
    `Gegeben: Binärzahl = ${pair.binary}`,
    ``,
    `Schritt 1: 8-Bit-Binärzahl in zwei 4-Bit-Gruppen teilen`,
    `  ${pair.binary} → ${highBin} | ${lowBin}`,
    ``,
    `Schritt 2: Jede 4-Bit-Gruppe in Hex umwandeln`,
    `  ${highBin} → ${highNibble} (Dezimal: ${parseInt(highBin, 2)})`,
    `  ${lowBin} → ${lowNibble} (Dezimal: ${parseInt(lowBin, 2)})`,
    ``,
    `Schritt 3: Hex-Ziffern zusammenfügen`,
    `  ${highNibble}${lowNibble} → 0x${pair.hex}`,
    ``,
    `Ergebnis: 0x${pair.hex}`,
  ];
}

export function generateHexBinaryQuestion(): HexBinaryQuestion {
  const direction = Math.random() > 0.5 ? 'hexToBinary' : 'binaryToHex';
  const pair = HEX_BINARY_PAIRS[Math.floor(Math.random() * HEX_BINARY_PAIRS.length)];

  if (direction === 'hexToBinary') {
    return {
      theme: 'Zahlensysteme',
      questionText: `Wandle die Hexadezimalzahl 0x${pair.hex} in eine 8-Bit-Binärzahl um.`,
      expectedAnswers: {
        binary: pair.binary,
      },
      solutionSteps: buildHexToBinarySteps(pair),
      difficulty: pair.difficulty,
    };
  } else {
    return {
      theme: 'Zahlensysteme',
      questionText: `Wandle die Binärzahl ${pair.binary} in eine Hexadezimalzahl um.`,
      expectedAnswers: {
        hex: pair.hex,
      },
      solutionSteps: buildBinaryToHexSteps(pair),
      difficulty: pair.difficulty,
    };
  }
}
