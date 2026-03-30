import { Question } from '../../types';
import { formatIHKTime, TIME_UNITS, UNIT_SEKUNDEN, UNIT_MINUTEN, UNIT_STUNDEN } from './timeFormat';

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
  const effectiveTimeSeconds = effectiveMbit / bandwidth;
  const roundedEffectiveSeconds = timeResult.roundedSeconds;
  
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
    `  Zeit = ${effectiveTimeSeconds.toFixed(2)} Sekunden`
  ];
  
  // Add time formatting explanation based on result
  if (timeResult.hours !== undefined) {
    solutionSteps.push(
      ``,
      `Schritt 4: In Stunden und Minuten umrechnen (60-System)`,
      `  Gerundete Gesamtsekunden = ${roundedEffectiveSeconds} s`,
      `  Stunden = ⌊${roundedEffectiveSeconds} ÷ 3600⌋ = ${timeResult.hours} Stunden`,
      `  Restsekunden = ${roundedEffectiveSeconds} - (${timeResult.hours} × 3600) = ${roundedEffectiveSeconds - (timeResult.hours * 3600)} s`,
      `  Minuten = ⌊Restsekunden ÷ 60⌋ = ${timeResult.minutes} Minuten`,
      `  Ergebnis: ${timeResult.hours} Stunde(n) ${timeResult.minutes} Minute(n)`
    );
  } else if (timeResult.minutes !== undefined && timeResult.minutes > 0) {
    solutionSteps.push(
      ``,
      `Schritt 4: In Minuten und Sekunden umrechnen (60-System)`,
      `  Gerundete Gesamtsekunden = ${roundedEffectiveSeconds} s`,
      `  Minuten = ⌊${roundedEffectiveSeconds} ÷ 60⌋ = ${timeResult.minutes} Minuten`,
      `  Restsekunden = ${roundedEffectiveSeconds} - (${timeResult.minutes} × 60) = ${roundedEffectiveSeconds - (timeResult.minutes * 60)} s`,
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
    questionText: `Wie lange dauert der Transfer von ${fileSizeGB} GB bei einer Bandbreite von ${bandwidth} Mbit/s? Berechne mit 10% Overhead (60-System bei ≥ 60 Sekunden).`,
    expectedAnswers: {
      ...(timeResult.hours !== undefined && {
        hours: timeResult.hours,
        hourUnit: UNIT_STUNDEN,
        minutes: timeResult.minutes,
        minuteUnit: UNIT_MINUTEN,
      }),
      ...(timeResult.hours === undefined && timeResult.minutes !== undefined && {
        minutes: timeResult.minutes,
        minuteUnit: UNIT_MINUTEN,
        seconds: timeResult.seconds,
        secondUnit: UNIT_SEKUNDEN,
      }),
      ...(timeResult.hours === undefined && timeResult.minutes === undefined && {
        seconds: timeResult.seconds,
        secondUnit: UNIT_SEKUNDEN,
      }),
    },
    answerInputs: timeResult.hours !== undefined
      ? [
          { valueKey: 'hours', unitKey: 'hourUnit', unitOptions: TIME_UNITS, label: 'Stunden' },
          { valueKey: 'minutes', unitKey: 'minuteUnit', unitOptions: TIME_UNITS, label: 'Minuten' },
        ]
      : timeResult.minutes !== undefined
      ? [
          { valueKey: 'minutes', unitKey: 'minuteUnit', unitOptions: TIME_UNITS, label: 'Minuten' },
          { valueKey: 'seconds', unitKey: 'secondUnit', unitOptions: TIME_UNITS, label: 'Sekunden' },
        ]
      : [
          { valueKey: 'seconds', unitKey: 'secondUnit', unitOptions: TIME_UNITS, label: 'Sekunden' },
        ],
    solutionSteps,
    difficulty
  };
}
