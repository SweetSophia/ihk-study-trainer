import { Question } from '../../types';

export function generateOverheadQuestion(): Question {
  // Constants
  const ETHERNET_HEADER = 18; // bytes
  const IPV4_HEADER = 20; // bytes
  const TCP_HEADER = 20; // bytes
  const MTU = 1500; // bytes
  const MSS = 1460; // bytes (MTU - IP - TCP)
  
  // Random payload between 3000 and 15000 bytes
  const payload = Math.floor(Math.random() * 12000) + 3000;
  
  // Round to nearest 100 for cleaner numbers
  const roundedPayload = Math.round(payload / 100) * 100;
  
  // Calculate number of frames needed
  const fullFrames = Math.floor(roundedPayload / MSS);
  const remainingPayload = roundedPayload % MSS;
  const totalFrames = remainingPayload > 0 ? fullFrames + 1 : fullFrames;
  
  // Calculate total bytes transmitted
  const overheadPerFrame = ETHERNET_HEADER + IPV4_HEADER + TCP_HEADER;
  const fullFrameSize = MSS + IPV4_HEADER + TCP_HEADER; // 1500 bytes (fits in MTU)
  
  let totalBytes = 0;
  
  // Full frames
  totalBytes += fullFrames * (MSS + overheadPerFrame);
  
  // Last frame (if any)
  if (remainingPayload > 0) {
    totalBytes += remainingPayload + overheadPerFrame;
  }
  
  // Efficiency calculation
  const efficiency = (roundedPayload / totalBytes) * 100;
  
  const difficulty: 'easy' | 'medium' | 'hard' = 
    roundedPayload > 10000 ? 'hard' :
    roundedPayload > 6000 ? 'medium' : 'easy';
  
  return {
    id: `overhead-${Date.now()}`,
    theme: 'Netzwerkarchitektur & Overhead',
    module: 'overhead',
    questionText: `Ein TCP-Datenstrom von ${roundedPayload.toLocaleString()} Bytes Nutzdaten (Payload) soll über Ethernet übertragen werden.\nKonstanten: Ethernet Header = ${ETHERNET_HEADER}B, IPv4 Header = ${IPV4_HEADER}B, TCP Header = ${TCP_HEADER}B, MTU = ${MTU}B, MSS = ${MSS}B\n\nBerechne: Anzahl der Frames, insgesamt übertragene Bytes und die Effizienz (Nutzdaten / Gesamtbytes × 100).`,
    expectedAnswers: {
      frameCount: totalFrames,
      totalBytes: totalBytes,
      efficiency: Number(efficiency.toFixed(2))
    },
    solutionSteps: [
      `Gegeben:`,
      `  Payload: ${roundedPayload.toLocaleString()} Bytes`,
      `  Ethernet Header: ${ETHERNET_HEADER} Bytes`,
      `  IPv4 Header: ${IPV4_HEADER} Bytes`,
      `  TCP Header: ${TCP_HEADER} Bytes`,
      `  MTU: ${MTU} Bytes`,
      `  MSS: ${MSS} Bytes (MTU - IP - TCP)`,
      ``,
      `Schritt 1: Anzahl der Frames berechnen`,
      `  Volle Frames: ${fullFrames} × ${MSS}B = ${(fullFrames * MSS).toLocaleString()}B`,
      remainingPayload > 0 ? `  Letzter Frame: ${remainingPayload}B` : '',
      `  Gesamtframes: ${totalFrames}`,
      ``,
      `Schritt 2: Overhead pro Frame`,
      `  Overhead = ${ETHERNET_HEADER} + ${IPV4_HEADER} + ${TCP_HEADER} = ${overheadPerFrame} Bytes`,
      ``,
      `Schritt 3: Gesamtbytes berechnen`,
      `  Volle Frames: ${fullFrames} × (${MSS} + ${overheadPerFrame}) = ${(fullFrames * (MSS + overheadPerFrame)).toLocaleString()} Bytes`,
      remainingPayload > 0 ? `  Letzter Frame: ${remainingPayload} + ${overheadPerFrame} = ${remainingPayload + overheadPerFrame} Bytes` : '',
      `  Gesamt: ${totalBytes.toLocaleString()} Bytes`,
      ``,
      `Schritt 4: Effizienz berechnen`,
      `  Formel: (Payload ÷ Gesamtbytes) × 100`,
      `  Berechnung: (${roundedPayload} ÷ ${totalBytes}) × 100 = ${efficiency.toFixed(2)}%`
    ].filter(Boolean),
    difficulty
  };
}
