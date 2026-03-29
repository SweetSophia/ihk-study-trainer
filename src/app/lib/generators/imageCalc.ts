import { Question } from '../../types';

const FILE_SIZE_UNITS = ['Bytes', 'KiB', 'KB', 'MiB', 'MB', 'GiB', 'GB'];

const resolutions = [
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: 'WQHD', width: 2560, height: 1440 },
  { name: '4K UHD', width: 3840, height: 2160 },
  { name: 'XGA', width: 1024, height: 768 },
  { name: 'SXGA', width: 1280, height: 1024 }
];

const colorDepths = [8, 16, 24, 32];

// Target units for IHK-style questions
const targetUnits = [
  { unit: 'Bytes', divisor: 1, binary: true },
  { unit: 'KiB', divisor: 1024, binary: true },
  { unit: 'KB', divisor: 1000, binary: false },
  { unit: 'MiB', divisor: 1024 * 1024, binary: true },
  { unit: 'MB', divisor: 1000 * 1000, binary: false },
  { unit: 'GiB', divisor: 1024 * 1024 * 1024, binary: true },
  { unit: 'GB', divisor: 1000 * 1000 * 1000, binary: false }
];

export function generateImageCalcQuestion(): Question {
  const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];
  const colorDepth = colorDepths[Math.floor(Math.random() * colorDepths.length)];
  const targetUnit = targetUnits[Math.floor(Math.random() * targetUnits.length)];
  
  // Calculate file size in Bytes first
  // Formula: (width × height × depth) / 8
  const totalBits = resolution.width * resolution.height * colorDepth;
  const totalBytes = totalBits / 8;
  
  // Convert to requested unit
  const resultInUnit = totalBytes / targetUnit.divisor;
  
  // Calculate intermediate values for solution steps
  const totalKiB = totalBytes / 1024;
  const totalKB = totalBytes / 1000;
  const totalMiB = totalKiB / 1024;
  const totalMB = totalKB / 1000;
  const totalGiB = totalMiB / 1024;
  const totalGB = totalMB / 1000;
  
  const difficulty: 'easy' | 'medium' | 'hard' = 
    resolution.width >= 3840 ? 'hard' :
    resolution.width >= 2560 ? 'medium' : 'easy';
  
  // Format the result based on unit size
  let formattedResult: number;
  if (resultInUnit >= 1000) {
    formattedResult = Math.round(resultInUnit);
  } else if (resultInUnit >= 1) {
    formattedResult = Number(resultInUnit.toFixed(2));
  } else {
    formattedResult = Number(resultInUnit.toFixed(4));
  }
  
  // Build solution steps dynamically based on target unit
  const solutionSteps: string[] = [
    `Gegeben:`,
    `  Auflösung: ${resolution.width} × ${resolution.height} Pixel`,
    `  Farbtiefe: ${colorDepth} Bit pro Pixel`,
    ``,
    `Schritt 1: Gesamtzahl der Bits berechnen`,
    `  Bits = ${resolution.width} × ${resolution.height} × ${colorDepth}`,
    `  Bits = ${totalBits.toLocaleString()} Bit`,
    ``,
    `Schritt 2: In Bytes umrechnen`,
    `  Bytes = ${totalBits.toLocaleString()} ÷ 8`,
    `  Bytes = ${totalBytes.toLocaleString()} B`
  ];
  
  // Add intermediate conversion steps based on target unit
  if (targetUnit.unit === 'KiB' || targetUnit.unit === 'MiB' || targetUnit.unit === 'GiB') {
    solutionSteps.push(
      ``,
      `Schritt 3: In KiB umrechnen (binär: ÷ 1024)`,
      `  KiB = ${totalBytes.toLocaleString()} ÷ 1024`,
      `  KiB = ${Math.round(totalKiB).toLocaleString()} KiB`
    );
  }
  
  if (targetUnit.unit === 'KB' || targetUnit.unit === 'MB' || targetUnit.unit === 'GB') {
    solutionSteps.push(
      ``,
      `Schritt 3: In KB umrechnen (dezimal: ÷ 1000)`,
      `  KB = ${totalBytes.toLocaleString()} ÷ 1000`,
      `  KB = ${Math.round(totalKB).toLocaleString()} KB`
    );
  }
  
  if (targetUnit.unit === 'MiB') {
    solutionSteps.push(
      ``,
      `Schritt 4: In MiB umrechnen (binär: ÷ 1024)`,
      `  MiB = ${Math.round(totalKiB).toLocaleString()} ÷ 1024`,
      `  MiB = ${totalMiB.toFixed(2)} MiB`
    );
  }
  
  if (targetUnit.unit === 'MB') {
    solutionSteps.push(
      ``,
      `Schritt 4: In MB umrechnen (dezimal: ÷ 1000)`,
      `  MB = ${Math.round(totalKB).toLocaleString()} ÷ 1000`,
      `  MB = ${totalMB.toFixed(2)} MB`
    );
  }
  
  if (targetUnit.unit === 'GiB') {
    solutionSteps.push(
      ``,
      `Schritt 4: In MiB umrechnen (binär: ÷ 1024)`,
      `  MiB = ${Math.round(totalKiB).toLocaleString()} ÷ 1024`,
      `  MiB = ${Math.round(totalMiB).toLocaleString()} MiB`,
      ``,
      `Schritt 5: In GiB umrechnen (binär: ÷ 1024)`,
      `  GiB = ${Math.round(totalMiB).toLocaleString()} ÷ 1024`,
      `  GiB = ${totalGiB.toFixed(4)} GiB`
    );
  }
  
  if (targetUnit.unit === 'GB') {
    solutionSteps.push(
      ``,
      `Schritt 4: In MB umrechnen (dezimal: ÷ 1000)`,
      `  MB = ${Math.round(totalKB).toLocaleString()} ÷ 1000`,
      `  MB = ${Math.round(totalMB).toLocaleString()} MB`,
      ``,
      `Schritt 5: In GB umrechnen (dezimal: ÷ 1000)`,
      `  GB = ${Math.round(totalMB).toLocaleString()} ÷ 1000`,
      `  GB = ${totalGB.toFixed(4)} GB`
    );
  }
  
  solutionSteps.push(
    ``,
    `Ergebnis: ${formattedResult} ${targetUnit.unit}`
  );
  
  return {
    id: `image-calc-${Date.now()}`,
    theme: 'Bildberechnung & Digitalisierung',
    module: 'image-calc',
    questionText: `Berechne die unkomprimierte Dateigröße eines ${resolution.name}-Bildes (${resolution.width}×${resolution.height} Pixel) mit ${colorDepth} Bit Farbtiefe.`,
    expectedAnswers: {
      size: formattedResult,
      sizeUnit: targetUnit.unit,
    },
    answerInputs: [
      { valueKey: 'size', unitKey: 'sizeUnit', unitOptions: FILE_SIZE_UNITS },
    ],
    solutionSteps,
    difficulty
  };
}
