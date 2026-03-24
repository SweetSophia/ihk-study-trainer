import { Question } from '../../types';

const resolutions = [
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: 'WQHD', width: 2560, height: 1440 },
  { name: '4K UHD', width: 3840, height: 2160 },
  { name: 'XGA', width: 1024, height: 768 },
  { name: 'SXGA', width: 1280, height: 1024 }
];

const colorDepths = [8, 16, 24, 32];

export function generateImageCalcQuestion(): Question {
  const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];
  const colorDepth = colorDepths[Math.floor(Math.random() * colorDepths.length)];
  
  // Calculate file size in MiB
  // Formula: (width × height × depth) / 8 / 1024 / 1024
  const totalBits = resolution.width * resolution.height * colorDepth;
  const totalBytes = totalBits / 8;
  const totalKiB = totalBytes / 1024;
  const totalMiB = totalKiB / 1024;
  
  const difficulty: 'easy' | 'medium' | 'hard' = 
    resolution.width >= 3840 ? 'hard' :
    resolution.width >= 2560 ? 'medium' : 'easy';
  
  return {
    id: `image-calc-${Date.now()}`,
    theme: 'Bildberechnung & Digitalisierung',
    module: 'image-calc',
    questionText: `Berechne die unkomprimierte Dateigröße eines ${resolution.name}-Bildes (${resolution.width}×${resolution.height} Pixel) mit ${colorDepth} Bit Farbtiefe. Gib das Ergebnis in MiB an.`,
    expectedAnswers: {
      sizeMiB: Number(totalMiB.toFixed(2))
    },
    solutionSteps: [
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
      `  Bytes = ${totalBytes.toLocaleString()} B`,
      ``,
      `Schritt 3: In KiB umrechnen`,
      `  KiB = ${totalBytes.toLocaleString()} ÷ 1024`,
      `  KiB = ${Math.round(totalKiB).toLocaleString()} KiB`,
      ``,
      `Schritt 4: In MiB umrechnen`,
      `  MiB = ${Math.round(totalKiB).toLocaleString()} ÷ 1024`,
      `  MiB = ${totalMiB.toFixed(2)} MiB`,
      ``,
      `Ergebnis: ${totalMiB.toFixed(2)} MiB`
    ],
    difficulty
  };
}
