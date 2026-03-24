import { Question } from '../../types';

/**
 * Formats time according to IHK 60-system rules:
 * - If >= 60 seconds, convert to minutes (60-system)
 * - If >= 60 minutes, convert to hours and minutes
 * - 10% overhead is deducted from transfer time
 */
function formatIHKTime(totalSeconds: number): { 
  display: string; 
  value: number; 
  unit: string;
  totalEffectiveSeconds: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
} {
  // Apply 10% overhead deduction (adds to time)
  const effectiveSeconds = totalSeconds * 1.10;
  const totalEffectiveSeconds = Math.round(effectiveSeconds);
  
  if (effectiveSeconds >= 3600) {
    // Convert to hours with minutes (60-system)
    const hours = Math.floor(effectiveSeconds / 3600);
    const remainingMinutes = Math.round((effectiveSeconds % 3600) / 60);
    return {
      display: `${hours} Stunde(n) ${remainingMinutes} Minute(n)`,
      value: Number((effectiveSeconds / 3600).toFixed(2)),
      unit: 'Stunden',
      totalEffectiveSeconds,
      hours,
      minutes: remainingMinutes,
      seconds: Math.round(effectiveSeconds)
    };
  } else if (effectiveSeconds >= 60) {
    // Convert to minutes with seconds (60-system)
    const minutes = Math.floor(effectiveSeconds / 60);
    const remainingSeconds = Math.round(effectiveSeconds % 60);
    return {
      display: `${minutes} Minute(n) ${remainingSeconds} Sekunde(n)`,
      value: Number((effectiveSeconds / 60).toFixed(2)),
      unit: 'Minuten',
      totalEffectiveSeconds,
      minutes,
      seconds: remainingSeconds
    };
  } else {
    // Keep as seconds
    return {
      display: `${Math.round(effectiveSeconds)} Sekunde(n)`,
      value: Math.round(effectiveSeconds),
      unit: 'Sekunden',
      totalEffectiveSeconds,
      seconds: Math.round(effectiveSeconds)
    };
  }
}

export function generateBandwidthQuestion(): Question {
  // Random file size between 1 and 50 GB (using decimal 1000-based)
  const fileSizeGB = Math.floor(Math.random() * 50) + 1;
  
  // Random bandwidth options in Mbit/s
  const bandwidths = [10, 25, 50, 100, 250, 500, 1000];
  const bandwidth = bandwidths[Math.floor(Math.random() * bandwidths.length)];
  
  // Calculate transfer time in seconds using decimal (1000-based) calculations
  // Formula: (size in GB × 8 × 1000³) / (bandwidth × 10⁶)
  // = (size × 8 × 1,000,000,000) / (bandwidth × 1,000,000)
  // = (size × 8 × 1000) / bandwidth
  const fileSizeBits = fileSizeGB * 8 * 1000 * 1000 * 1000; // GB to bits (decimal)
  const bandwidthBps = bandwidth * 1000 * 1000; // Mbit/s to bit/s
  const rawTimeSeconds = fileSizeBits / bandwidthBps;
  
  // Format time according to IHK 60-system with 10% overhead
  const timeResult = formatIHKTime(rawTimeSeconds);
  
  // Calculate intermediate values for solution
  const fileSizeMbit = fileSizeGB * 8 * 1000; // GB to Mbit (decimal: 1 GB = 8000 Mbit)
  const overheadMbit = fileSizeMbit * 0.10;
  const effectiveMbit = fileSizeMbit + overheadMbit;
  
  const difficulty: 'easy' | 'medium' | 'hard' = 
    fileSizeGB > 20 || bandwidth < 50 ? 'hard' :
    fileSizeGB > 10 ? 'medium' : 'easy';
  
  const solutionSteps: string[] = [
    `Gegeben:`,
    `  Dateigröße: ${fileSizeGB} GB`,
    `  Bandbreite: ${bandwidth} Mbit/s`,
    ``,
    `Schritt 1: Dateigröße in Mbit umrechnen (dezimal, 1000-basiert)`,
    `  1 GB = 8 Gbit = 8000 Mbit (dezimal)`,
    `  ${fileSizeGB} GB × 8000 = ${fileSizeMbit.toLocaleString()} Mbit`,
    ``,
    `Schritt 2: 10% Overhead hinzufügen (IHK-Standard)`,
    `  Overhead = ${fileSizeMbit.toLocaleString()} × 0,10`,
    `  Overhead = ${overheadMbit.toLocaleString()} Mbit`,
    `  Effektive Datenmenge = ${fileSizeMbit.toLocaleString()} + ${overheadMbit.toLocaleString()}`,
    `  Effektive Datenmenge = ${effectiveMbit.toLocaleString()} Mbit`,
    ``,
    `Schritt 3: Übertragungszeit berechnen`,
    `  Zeit = Datenmenge ÷ Bandbreite`,
    `  Zeit = ${effectiveMbit.toLocaleString()} Mbit ÷ ${bandwidth} Mbit/s`,
    `  Zeit = ${(effectiveMbit / bandwidth).toFixed(2)} Sekunden`
  ];
  
  // Add time formatting explanation based on result
  if (timeResult.hours !== undefined) {
    solutionSteps.push(
      ``,
      `Schritt 4: In Stunden und Minuten umrechnen (60-System)`,
      `  Stunden = ⌊${timeResult.totalEffectiveSeconds} ÷ 3600⌋ = ${timeResult.hours} Stunden`,
      `  Restsekunden = ${timeResult.totalEffectiveSeconds} - (${timeResult.hours} × 3600)`,
      `  Minuten = ⌊Restsekunden ÷ 60⌋ = ${timeResult.minutes} Minuten`,
      `  Ergebnis: ${timeResult.hours} Stunde(n) ${timeResult.minutes} Minute(n)`
    );
  } else if (timeResult.minutes !== undefined && timeResult.minutes > 0) {
    solutionSteps.push(
      ``,
      `Schritt 4: In Minuten und Sekunden umrechnen (60-System)`,
      `  Minuten = ⌊${timeResult.totalEffectiveSeconds} ÷ 60⌋ = ${timeResult.minutes} Minuten`,
      `  Restsekunden = ${timeResult.totalEffectiveSeconds} - (${timeResult.minutes} × 60)`,
      `  Sekunden = ⌊Restsekunden⌋ = ${timeResult.seconds} Sekunden`,
      `  Ergebnis: ${timeResult.minutes} Minute(n) ${timeResult.seconds} Sekunde(n)`
    );
  }
  
  solutionSteps.push(
    ``,
    `Ergebnis: ${timeResult.display}`
  );
  
  return {
    id: `bandwidth-${Date.now()}`,
    theme: 'IT-Mathematik & Datenberechnung',
    module: 'bandwidth',
    questionText: `Wie lange dauert der Transfer von ${fileSizeGB} GB bei einer Bandbreite von ${bandwidth} Mbit/s? Berechne mit 10% Overhead und gib das Ergebnis in ${timeResult.unit} an (60-System bei ≥ 60 Sekunden).`,
    expectedAnswers: {
      time: timeResult.value,
      unit: timeResult.unit,
      ...(timeResult.hours !== undefined && { hours: timeResult.hours, minutes: timeResult.minutes }),
      ...(timeResult.hours === undefined && timeResult.minutes !== undefined && { minutes: timeResult.minutes, seconds: timeResult.seconds }),
      ...(timeResult.hours === undefined && timeResult.minutes === undefined && { seconds: timeResult.seconds })
    },
    solutionSteps,
    difficulty
  };
}
