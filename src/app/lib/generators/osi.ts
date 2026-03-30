import { AnswerInputConfig } from '../../types';

export interface OsiQuestion {
  theme: string;
  questionText: string;
  item: string;
  expectedAnswers: { layer: number; layerName: string };
  answerInputs?: AnswerInputConfig[];
  solutionSteps: string[];
}

/** All seven OSI layer names in "English / German" format */
export const OSI_LAYER_NAMES: Record<number, string> = {
  1: 'Physical / Bitübertragungsschicht',
  2: 'Data Link / Sicherungsschicht',
  3: 'Network / Vermittlungsschicht',
  4: 'Transport / Transportschicht',
  5: 'Session / Sitzungsschicht',
  6: 'Presentation / Darstellungsschicht',
  7: 'Application / Anwendungsschicht',
};

const OSI_ITEMS: Array<{ item: string; layer: number; description: string }> = [
  // Layer 1 - Physical
  { item: 'Hub', layer: 1, description: 'Elektrische/mechanische Signale, Kabel, Hubs' },
  { item: 'Repeater', layer: 1, description: 'Verstärkt Signale auf physischer Ebene' },
  { item: 'Netzwerkkabel', layer: 1, description: 'Physische Übertragungsmedien' },
  { item: 'Glasfaser', layer: 1, description: 'Optisches Übertragungsmedium' },
  
  // Layer 2 - Data Link
  { item: 'Switch', layer: 2, description: 'MAC-Adressen, Frames, Switches' },
  { item: 'Bridge', layer: 2, description: 'Verbindet Netzwerksegmente auf Layer 2' },
  { item: 'MAC-Adresse', layer: 2, description: 'Hardware-Adresse der Netzwerkkarte' },
  { item: 'Ethernet-Frame', layer: 2, description: 'Dateneinheit der Sicherungsschicht' },
  { item: 'VLAN', layer: 2, description: 'Virtuelles LAN auf Layer 2' },
  { item: 'ARP', layer: 2, description: 'Address Resolution Protocol' },
  
  // Layer 3 - Network
  { item: 'Router', layer: 3, description: 'IP-Adressen, Routing, Pakete' },
  { item: 'IP-Adresse', layer: 3, description: 'Logische Netzwerkadresse' },
  { item: 'Paket', layer: 3, description: 'Dateneinheit der Vermittlungsschicht' },
  { item: 'ICMP', layer: 3, description: 'Internet Control Message Protocol (Ping)' },
  { item: 'Routing-Tabelle', layer: 3, description: 'Bestimmt Pfad für Pakete' },
  { item: 'Subnetzmaske', layer: 3, description: 'Bestimmt Netzwerk- und Host-Anteil' },
  
  // Layer 4 - Transport
  { item: 'TCP', layer: 4, description: 'Verbindungsorientiert, zuverlässig' },
  { item: 'UDP', layer: 4, description: 'Verbindungslos, unzuverlässig' },
  { item: 'Port', layer: 4, description: 'Identifiziert Anwendungen/Dienste' },
  { item: 'Segment', layer: 4, description: 'Dateneinheit der Transportschicht' },
  { item: 'Three-Way-Handshake', layer: 4, description: 'TCP-Verbindungsaufbau' },
  { item: 'Socket', layer: 4, description: 'IP + Port = Endpunkt einer Verbindung' },
  
  // Layer 5 - Session
  { item: 'Session', layer: 5, description: 'Verwaltet Sitzungen zwischen Anwendungen' },
  { item: 'NetBIOS', layer: 5, description: 'Network Basic Input/Output System' },
  { item: 'RPC', layer: 5, description: 'Remote Procedure Call' },
  { item: 'Sitzungswiederherstellung', layer: 5, description: 'Wiederaufnahme unterbrochener Sitzungen' },
  
  // Layer 6 - Presentation
  { item: 'SSL/TLS', layer: 6, description: 'Verschlüsselung auf der Darstellungsschicht' },
  { item: 'JPEG', layer: 6, description: 'Bildkomprimierung/Formatierung' },
  { item: 'MPEG', layer: 6, description: 'Videokomprimierung/Formatierung' },
  { item: 'ASCII', layer: 6, description: 'Zeichenkodierung' },
  { item: 'UTF-8', layer: 6, description: 'Unicode-Zeichenkodierung' },
  { item: 'Base64', layer: 6, description: 'Kodierung für binäre Daten' },
  
  // Layer 7 - Application
  { item: 'HTTP', layer: 7, description: 'Hypertext Transfer Protocol' },
  { item: 'HTTPS', layer: 7, description: 'HTTP Secure' },
  { item: 'FTP', layer: 7, description: 'File Transfer Protocol' },
  { item: 'SMTP', layer: 7, description: 'Simple Mail Transfer Protocol' },
  { item: 'POP3', layer: 7, description: 'Post Office Protocol' },
  { item: 'IMAP', layer: 7, description: 'Internet Message Access Protocol' },
  { item: 'DNS', layer: 7, description: 'Domain Name System' },
  { item: 'DHCP', layer: 7, description: 'Dynamic Host Configuration Protocol' },
  { item: 'SNMP', layer: 7, description: 'Simple Network Management Protocol' },
  { item: 'SSH', layer: 7, description: 'Secure Shell' },
  { item: 'Telnet', layer: 7, description: 'Unverschlüsselte Terminal-Verbindung' },
  { item: 'Browser', layer: 7, description: 'HTTP-Client-Anwendung' }
];

export function generateOsiQuestion(): OsiQuestion {
  const entry = OSI_ITEMS[Math.floor(Math.random() * OSI_ITEMS.length)];
  const layerName = OSI_LAYER_NAMES[entry.layer];
  
  return {
    theme: 'TCP/IP-Referenzmodell & Protokolle',
    questionText: `Ordne "${entry.item}" dem korrekten OSI-Layer zu. Wähle die Schichtnummer und den Schichtnamen.`,
    item: entry.item,
    expectedAnswers: {
      layer: entry.layer,
      layerName
    },
    answerInputs: [
      {
        valueKey: 'layer',
        label: 'Schichtnummer',
        valueOptions: ['1', '2', '3', '4', '5', '6', '7'],
        acceptedValues: [String(entry.layer)],
      },
      {
        valueKey: 'layerName',
        label: 'Schichtname',
        valueOptions: Object.values(OSI_LAYER_NAMES),
        acceptedValues: [layerName],
      },
    ],
    solutionSteps: [
      `Gegeben: ${entry.item}`,
      ``,
      `Analyse: ${entry.description}`,
      ``,
      `OSI-Modell Überblick:`,
      `  Layer 7: Application / Anwendungsschicht (HTTP, FTP, SMTP...)`,
      `  Layer 6: Presentation / Darstellungsschicht (Verschlüsselung, Kodierung...)`,
      `  Layer 5: Session / Sitzungsschicht (Sitzungsverwaltung...)`,
      `  Layer 4: Transport / Transportschicht (TCP, UDP, Ports...)`,
      `  Layer 3: Network / Vermittlungsschicht (IP, Routing...)`,
      `  Layer 2: Data Link / Sicherungsschicht (MAC, Switches...)`,
      `  Layer 1: Physical / Bitübertragungsschicht (Kabel, Hubs...)`,
      ``,
      `Zuordnung:`,
      `  ${entry.item} → Layer ${entry.layer}: ${layerName}`,
      ``,
      `Ergebnis:`,
      `  Layer: ${entry.layer}`,
      `  Name: ${layerName}`
    ]
  };
}
