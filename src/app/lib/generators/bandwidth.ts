import { Question } from '../../types';

export function generateBandwidthQuestion(): Question {
  // Random file size between 1 and 50 GiB
  const fileSizeGiB = Math.floor(Math.random() * 50) + 1;
  
  // Random bandwidth between 10 and 1000 Mbit/s
  const bandwidths = [10, 25, 50, 100, 250, 500, 1000];
  const bandwidth = bandwidths[Math.floor(Math.random() * bandwidths.length)];
  
  // Calculate transfer time in seconds
  // Formula: (size × 8 × 1024³) / (bandwidth × 10⁶)
  const fileSizeBits = fileSizeGiB * 8 * 1024 * 1024 * 1024;
  const bandwidthBps = bandwidth * 1000 * 1000;
  const timeSeconds = fileSizeBits / bandwidthBps;
  
  const timeMinutes = timeSeconds / 60;
  const timeHours = timeMinutes / 60;
  
  let timeDisplay: string;
  let expectedAnswer: number;
  
  if (timeHours >= 1) {
    timeDisplay = `${timeHours.toFixed(2)} Stunden`;
    expectedAnswer = Number(timeHours.toFixed(2));
  } else if (timeMinutes >= 1) {
    timeDisplay = `${timeMinutes.toFixed(2)} Minuten`;
    expectedAnswer = Number(timeMinutes.toFixed(2));
  } else {
    timeDisplay = `${Math.round(timeSeconds)} Sekunden`;
    expectedAnswer = Math.round(timeSeconds);
  }
  
  const difficulty: 'easy' | 'medium' | 'hard' = 
    fileSizeGiB > 20 || bandwidth < 50 ? 'hard' :
    fileSizeGiB > 10 ? 'medium' : 'easy';
  
  return {
    id: `bandwidth-${Date.now()}`,
    theme: 'IT-Mathematik & Datenberechnung',
    module: 'bandwidth',
    questionText: `Wie lange dauert der Transfer von ${fileSizeGiB} GiB bei einer Bandbreite von ${bandwidth} Mbit/s? Gib die Zeit in ${timeHours >= 1 ? 'Stunden' : timeMinutes >= 1 ? 'Minuten' : 'Sekunden'} an.`,
    expectedAnswers: {
      time: expectedAnswer,
      unit: timeHours >= 1 ? 'Stunden' : timeMinutes >= 1 ? 'Minuten' : 'Sekunden'
    },
    solutionSteps: [
      `Gegeben: Dateigröße = ${fileSizeGiB} GiB, Bandbreite = ${bandwidth} Mbit/s`,
      `Schritt 1: Dateigröße in Bits umrechnen`,
      `  ${fileSizeGiB} GiB × 8 = ${fileSizeGiB * 8} Gibit`,
      `  ${fileSizeGiB * 8} Gibit × 1024 = ${fileSizeGiB * 8 * 1024} Mibit`,
      `  ${fileSizeGiB * 8 * 1024} Mibit × 1,048576 = ${(fileSizeGiB * 8 * 1024 * 1.048576).toFixed(2)} Mbit`,
      `Schritt 2: Übertragungszeit berechnen`,
      `  Zeit = Datenmenge ÷ Bandbreite`,
      `  Zeit = ${(fileSizeGiB * 8 * 1024 * 1.048576).toFixed(2)} Mbit ÷ ${bandwidth} Mbit/s`,
      `  Zeit = ${timeSeconds.toFixed(2)} Sekunden`,
      timeMinutes >= 1 ? `  Zeit = ${timeMinutes.toFixed(2)} Minuten` : '',
      timeHours >= 1 ? `  Zeit = ${timeHours.toFixed(2)} Stunden` : '',
      `Ergebnis: ${timeDisplay}`
    ].filter(Boolean),
    difficulty
  };
}
