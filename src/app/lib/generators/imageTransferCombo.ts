import { Question } from '../../types';
import { formatIHKTime, TIME_UNITS, UNIT_SEKUNDEN, UNIT_MINUTEN, UNIT_STUNDEN } from './timeFormat';

const resolutions = [
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: 'WQHD', width: 2560, height: 1440 },
  { name: '4K UHD', width: 3840, height: 2160 },
  { name: 'XGA', width: 1024, height: 768 },
  { name: 'SXGA', width: 1280, height: 1024 }
];

const colorDepths = [8, 16, 24, 32];

// Bandwidth units and their conversion to bit/s
const bandwidthUnits = [
  { unit: 'kbit/s', multiplier: 1000 },
  { unit: 'Mbit/s', multiplier: 1000 * 1000 },
  { unit: 'Gbit/s', multiplier: 1000 * 1000 * 1000 }
];

export function generateImageTransferComboQuestion(): Question {
  // Random resolution and color depth
  const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];
  const colorDepth = colorDepths[Math.floor(Math.random() * colorDepths.length)];
  
  // Random bandwidth
  const bandwidthOptions = [100, 250, 500, 1000, 2500, 5000, 10000];
  const bandwidthValue = bandwidthOptions[Math.floor(Math.random() * bandwidthOptions.length)];
  const bandwidthUnit = bandwidthUnits[Math.floor(Math.random() * bandwidthUnits.length)];
  
  // Calculate file size in bits (using decimal 1000-based for IHK compliance)
  const totalBits = resolution.width * resolution.height * colorDepth;
  const totalBytes = totalBits / 8;
  const totalKB = totalBytes / 1000;
  const totalMB = totalKB / 1000;
  
  // Calculate bandwidth in bit/s
  const bandwidthBps = bandwidthValue * bandwidthUnit.multiplier;
  
  // Calculate transfer time in seconds (no overhead yet)
  const rawTimeSeconds = (totalBytes * 8) / bandwidthBps;
  
  // Format time according to IHK 60-system
  const timeResult = formatIHKTime(rawTimeSeconds);
  
  // Calculate with overhead for solution
  const overheadBytes = totalBytes * 0.10;
  const effectiveBytes = totalBytes + overheadBytes;
  const effectiveTimeSeconds = (effectiveBytes * 8) / bandwidthBps;
  const roundedEffectiveSeconds = timeResult.roundedSeconds;
  
  const difficulty: 'easy' | 'medium' | 'hard' = 
    resolution.width >= 3840 || bandwidthValue <= 250 ? 'hard' :
    resolution.width >= 2560 ? 'medium' : 'easy';
  
  const solutionSteps: string[] = [
    `Gegeben:`,
    `  Bild: ${resolution.name} (${resolution.width} × ${resolution.height} Pixel)`,
    `  Farbtiefe: ${colorDepth} Bit pro Pixel`,
    `  Bandbreite: ${bandwidthValue} ${bandwidthUnit.unit}`,
    ``,
    `Schritt 1: Bildgröße in Bytes berechnen (dezimal, 1000-basiert)`,
    `  Bits = ${resolution.width} × ${resolution.height} × ${colorDepth}`,
    `  Bits = ${totalBits.toLocaleString()} Bit`,
    `  Bytes = ${totalBits.toLocaleString()} ÷ 8`,
    `  Bytes = ${totalBytes.toLocaleString()} B`,
    ``,
    `Schritt 2: Bildgröße in MB umrechnen`,
    `  KB = ${totalBytes.toLocaleString()} ÷ 1000 = ${Math.round(totalKB).toLocaleString()} KB`,
    `  MB = ${Math.round(totalKB).toLocaleString()} ÷ 1000 = ${totalMB.toFixed(2)} MB`,
    ``,
    `Schritt 3: Bandbreite in Bit/s umrechnen`,
    `  Bandbreite = ${bandwidthValue} ${bandwidthUnit.unit}`,
    `  Bandbreite = ${bandwidthBps.toLocaleString()} Bit/s`,
    ``,
    `Schritt 4: Übertragungszeit ohne Overhead berechnen`,
    `  Zeit = (Datenmenge in Bit) ÷ Bandbreite`,
    `  Zeit = (${totalBytes.toLocaleString()} × 8) ÷ ${bandwidthBps.toLocaleString()}`,
    `  Zeit = ${rawTimeSeconds.toFixed(2)} s`,
    ``,
    `Schritt 5: 10% Overhead hinzufügen (IHK-Standard)`,
    `  Overhead = ${totalBytes.toLocaleString()} × 0,10 = ${Math.round(overheadBytes).toLocaleString()} B`,
    `  Effektive Datenmenge = ${totalBytes.toLocaleString()} + ${Math.round(overheadBytes).toLocaleString()}`,
    `  Effektive Datenmenge = ${Math.round(effectiveBytes).toLocaleString()} B`,
    ``,
    `Schritt 6: Effektive Übertragungszeit berechnen`,
    `  Effektive Zeit = ${effectiveTimeSeconds.toFixed(2)} s`
  ];
  
  // Add time formatting explanation based on result
  if (timeResult.hours !== undefined) {
    solutionSteps.push(
      ``,
      `Schritt 7: In Stunden und Minuten umrechnen (60-System)`,
      `  Gerundete Gesamtsekunden = ${roundedEffectiveSeconds} s`,
      `  Stunden = ⌊${roundedEffectiveSeconds} ÷ 3600⌋ = ${timeResult.hours} Stunden`,
      `  Restsekunden = ${roundedEffectiveSeconds} - (${timeResult.hours} × 3600) = ${roundedEffectiveSeconds - (timeResult.hours * 3600)} s`,
      `  Minuten = ⌊Restsekunden ÷ 60⌋ = ${timeResult.minutes} Minuten`,
      `  Ergebnis: ${timeResult.hours} Stunde(n) ${timeResult.minutes} Minute(n)`
    );
  } else if (timeResult.minutes !== undefined && timeResult.minutes > 0) {
    solutionSteps.push(
      ``,
      `Schritt 7: In Minuten und Sekunden umrechnen (60-System)`,
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
    id: `image-transfer-combo-${Date.now()}`,
    theme: 'IT-Mathematik & Datenberechnung',
    module: 'imageTransferCombo',
    questionText: `Ein unkomprimiertes ${resolution.name}-Bild (${resolution.width}×${resolution.height} Pixel, ${colorDepth} Bit Farbtiefe) soll über eine Leitung mit ${bandwidthValue} ${bandwidthUnit.unit} übertragen werden. Berechne die Übertragungszeit unter Berücksichtigung eines 10% Overheads (60-System bei ≥ 60 Sekunden).`,
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
