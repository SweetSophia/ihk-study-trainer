import { Question } from '../../types';
import { TIME_UNITS, UNIT_SEKUNDEN, UNIT_MINUTEN, UNIT_STUNDEN } from './timeFormat';
import { formatImageTransferTime } from './imageTransferTime';

const resolutions = [
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: 'WQHD', width: 2560, height: 1440 },
  { name: '4K UHD', width: 3840, height: 2160 },
  { name: 'XGA', width: 1024, height: 768 },
  { name: 'SXGA', width: 1280, height: 1024 }
];

const colorDepths = [8, 16, 24, 32];

const formatIntermediate = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 10 });

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
  const totalMB = totalBytes / 1000000;
  
  // Calculate bandwidth in bit/s
  const bandwidthBps = bandwidthValue * bandwidthUnit.multiplier;
  
  // Calculate transfer time in seconds (before the IHK-standard 10% overhead)
  const rawTimeSeconds = (totalBytes * 8) / bandwidthBps;

  // Calculate with overhead for the written-out solution
  const overheadBytes = totalBytes / 10;
  const effectiveBytes = totalBytes + overheadBytes;
  const effectiveTimeSeconds = (effectiveBytes * 8) / bandwidthBps;

  // The combo formatter applies the 10% overhead internally, so pass
  // the raw transfer time here and use the formatted effective result everywhere
  // the user-facing answer is derived.
  const formattedEffectiveResult = formatImageTransferTime(rawTimeSeconds);
  const roundedEffectiveSeconds = formattedEffectiveResult.roundedSeconds;
  
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
    `  KB = ${totalBytes.toLocaleString()} ÷ 1000 = ${formatIntermediate(totalKB)} KB`,
    `  MB = ${formatIntermediate(totalKB)} ÷ 1000 = ${formatIntermediate(totalMB)} MB`,
    ``,
    `Schritt 3: Bandbreite in Bit/s umrechnen`,
    `  Bandbreite = ${bandwidthValue} ${bandwidthUnit.unit}`,
    `  Bandbreite = ${bandwidthBps.toLocaleString()} Bit/s`,
    ``,
    `Schritt 4: Übertragungszeit ohne Overhead berechnen`,
    `  Zeit = (Datenmenge in Bit) ÷ Bandbreite`,
    `  Zeit = (${totalBytes.toLocaleString()} × 8) ÷ ${bandwidthBps.toLocaleString()}`,
    `  Zeit ≈ ${rawTimeSeconds.toFixed(9)} s`,
    ``,
    `Schritt 5: 10% Overhead hinzufügen (vorgegebenes Modell)`,
    `  Overhead = ${totalBytes.toLocaleString()} × 0,10 = ${formatIntermediate(overheadBytes)} B`,
    `  Effektive Datenmenge = ${totalBytes.toLocaleString()} + ${formatIntermediate(overheadBytes)}`,
    `  Effektive Datenmenge = ${formatIntermediate(effectiveBytes)} B`,
    ``,
    `Schritt 6: Effektive Übertragungszeit berechnen`,
    `  Effektive Zeit ≈ ${effectiveTimeSeconds.toFixed(9)} s`,
    `  Rundung: unter 60 Sekunden auf 9 Nachkommastellen, ab 60 Sekunden auf ganze Sekunden.`
  ];
  
  // Add time formatting explanation based on result
  if (formattedEffectiveResult.hours !== undefined) {
    solutionSteps.push(
      ``,
      `Schritt 7: In Stunden und Minuten umrechnen (60-System)`,
      `  Gerundete Gesamtsekunden = ${roundedEffectiveSeconds} s`,
      `  Stunden = ⌊${roundedEffectiveSeconds} ÷ 3600⌋ = ${formattedEffectiveResult.hours} Stunden`,
      `  Restsekunden = ${roundedEffectiveSeconds} - (${formattedEffectiveResult.hours} × 3600) = ${roundedEffectiveSeconds - (formattedEffectiveResult.hours * 3600)} s`,
      `  Minuten = ⌊Restsekunden ÷ 60⌋ = ${formattedEffectiveResult.minutes} Minuten`,
      `  Ergebnis: ${formattedEffectiveResult.hours} Stunde(n) ${formattedEffectiveResult.minutes} Minute(n)`
    );
  } else if (formattedEffectiveResult.minutes !== undefined && formattedEffectiveResult.minutes > 0) {
    solutionSteps.push(
      ``,
      `Schritt 7: In Minuten und Sekunden umrechnen (60-System)`,
      `  Gerundete Gesamtsekunden = ${roundedEffectiveSeconds} s`,
      `  Minuten = ⌊${roundedEffectiveSeconds} ÷ 60⌋ = ${formattedEffectiveResult.minutes} Minuten`,
      `  Restsekunden = ${roundedEffectiveSeconds} - (${formattedEffectiveResult.minutes} × 60) = ${roundedEffectiveSeconds - (formattedEffectiveResult.minutes * 60)} s`,
      `  Sekunden = Restsekunden = ${formattedEffectiveResult.seconds} Sekunden`,
      `  Ergebnis: ${formattedEffectiveResult.minutes} Minute(n) ${formattedEffectiveResult.seconds} Sekunde(n)`
    );
  }
  
  solutionSteps.push(
    ``,
    `Ergebnis: ${formattedEffectiveResult.display}`
  );
  
  return {
    id: `image-transfer-combo-${Date.now()}`,
    theme: 'IT-Mathematik & Datenberechnung',
    module: 'imageTransferCombo',
    questionText: `Ein unkomprimiertes ${resolution.name}-Bild (${resolution.width}×${resolution.height} Pixel, ${colorDepth} Bit Farbtiefe) soll über eine Leitung mit ${bandwidthValue} ${bandwidthUnit.unit} übertragen werden. Berechne die Übertragungszeit unter Berücksichtigung eines 10% Overheads. Runde erst das Endergebnis: unter 60 Sekunden auf 9 Nachkommastellen, ab 60 Sekunden auf ganze Sekunden und gib es im 60-System an.`,
    expectedAnswers: {
      ...(formattedEffectiveResult.hours !== undefined && {
        hours: formattedEffectiveResult.hours,
        hourUnit: UNIT_STUNDEN,
        minutes: formattedEffectiveResult.minutes,
        minuteUnit: UNIT_MINUTEN,
      }),
      ...(formattedEffectiveResult.hours === undefined && formattedEffectiveResult.minutes !== undefined && {
        minutes: formattedEffectiveResult.minutes,
        minuteUnit: UNIT_MINUTEN,
        seconds: formattedEffectiveResult.seconds,
        secondUnit: UNIT_SEKUNDEN,
      }),
      ...(formattedEffectiveResult.hours === undefined && formattedEffectiveResult.minutes === undefined && {
        seconds: formattedEffectiveResult.seconds,
        secondUnit: UNIT_SEKUNDEN,
      }),
    },
    answerInputs: formattedEffectiveResult.hours !== undefined
      ? [
          { valueKey: 'hours', unitKey: 'hourUnit', unitOptions: TIME_UNITS, label: 'Stunden' },
          { valueKey: 'minutes', unitKey: 'minuteUnit', unitOptions: TIME_UNITS, label: 'Minuten' },
        ]
      : formattedEffectiveResult.minutes !== undefined
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
