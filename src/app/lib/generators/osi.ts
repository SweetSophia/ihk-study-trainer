export interface OsiQuestion {
  theme: string;
  questionText: string;
  item: string;
  expectedAnswers: { layer: number; layerName: string };
  solutionSteps: string[];
}

const OSI_ITEMS: Array<{ item: string; layer: number; layerName: string; description: string }> = [
  // Layer 1 - Physical
  { item: 'Hub', layer: 1, layerName: 'Bitübertragungsschicht', description: 'Elektrische/mechanische Signale, Kabel, Hubs' },
  { item: 'Repeater', layer: 1, layerName: 'Bitübertragungsschicht', description: 'Verstärkt Signale auf physischer Ebene' },
  { item: 'Netzwerkkabel', layer: 1, layerName: 'Bitübertragungsschicht', description: 'Physische Übertragungsmedien' },
  { item: 'Glasfaser', layer: 1, layerName: 'Bitübertragungsschicht', description: 'Optisches Übertragungsmedium' },
  
  // Layer 2 - Data Link
  { item: 'Switch', layer: 2, layerName: 'Sicherungsschicht', description: 'MAC-Adressen, Frames, Switches' },
  { item: 'Bridge', layer: 2, layerName: 'Sicherungsschicht', description: 'Verbindet Netzwerksegmente auf Layer 2' },
  { item: 'MAC-Adresse', layer: 2, layerName: 'Sicherungsschicht', description: 'Hardware-Adresse der Netzwerkkarte' },
  { item: 'Ethernet-Frame', layer: 2, layerName: 'Sicherungsschicht', description: 'Dateneinheit der Sicherungsschicht' },
  { item: 'VLAN', layer: 2, layerName: 'Sicherungsschicht', description: 'Virtuelles LAN auf Layer 2' },
  { item: 'ARP', layer: 2, layerName: 'Sicherungsschicht', description: 'Address Resolution Protocol' },
  
  // Layer 3 - Network
  { item: 'Router', layer: 3, layerName: 'Vermittlungsschicht', description: 'IP-Adressen, Routing, Pakete' },
  { item: 'IP-Adresse', layer: 3, layerName: 'Vermittlungsschicht', description: 'Logische Netzwerkadresse' },
  { item: 'Paket', layer: 3, layerName: 'Vermittlungsschicht', description: 'Dateneinheit der Vermittlungsschicht' },
  { item: 'ICMP', layer: 3, layerName: 'Vermittlungsschicht', description: 'Internet Control Message Protocol (Ping)' },
  { item: 'Routing-Tabelle', layer: 3, layerName: 'Vermittlungsschicht', description: 'Bestimmt Pfad für Pakete' },
  { item: 'Subnetzmaske', layer: 3, layerName: 'Vermittlungsschicht', description: 'Bestimmt Netzwerk- und Host-Anteil' },
  
  // Layer 4 - Transport
  { item: 'TCP', layer: 4, layerName: 'Transportschicht', description: 'Verbindungsorientiert, zuverlässig' },
  { item: 'UDP', layer: 4, layerName: 'Transportschicht', description: 'Verbindungslos, unzuverlässig' },
  { item: 'Port', layer: 4, layerName: 'Transportschicht', description: 'Identifiziert Anwendungen/Dienste' },
  { item: 'Segment', layer: 4, layerName: 'Transportschicht', description: 'Dateneinheit der Transportschicht' },
  { item: 'Three-Way-Handshake', layer: 4, layerName: 'Transportschicht', description: 'TCP-Verbindungsaufbau' },
  { item: 'Socket', layer: 4, layerName: 'Transportschicht', description: 'IP + Port = Endpunkt einer Verbindung' },
  
  // Layer 5 - Session
  { item: 'Session', layer: 5, layerName: 'Sitzungsschicht', description: 'Verwaltet Sitzungen zwischen Anwendungen' },
  { item: 'NetBIOS', layer: 5, layerName: 'Sitzungsschicht', description: 'Network Basic Input/Output System' },
  { item: 'RPC', layer: 5, layerName: 'Sitzungsschicht', description: 'Remote Procedure Call' },
  { item: 'Sitzungswiederherstellung', layer: 5, layerName: 'Sitzungsschicht', description: 'Wiederaufnahme unterbrochener Sitzungen' },
  
  // Layer 6 - Presentation
  { item: 'SSL/TLS', layer: 6, layerName: 'Darstellungsschicht', description: 'Verschlüsselung auf der Darstellungsschicht' },
  { item: 'JPEG', layer: 6, layerName: 'Darstellungsschicht', description: 'Bildkomprimierung/Formatierung' },
  { item: 'MPEG', layer: 6, layerName: 'Darstellungsschicht', description: 'Videokomprimierung/Formatierung' },
  { item: 'ASCII', layer: 6, layerName: 'Darstellungsschicht', description: 'Zeichenkodierung' },
  { item: 'UTF-8', layer: 6, layerName: 'Darstellungsschicht', description: 'Unicode-Zeichenkodierung' },
  { item: 'Base64', layer: 6, layerName: 'Darstellungsschicht', description: 'Kodierung für binäre Daten' },
  
  // Layer 7 - Application
  { item: 'HTTP', layer: 7, layerName: 'Anwendungsschicht', description: 'Hypertext Transfer Protocol' },
  { item: 'HTTPS', layer: 7, layerName: 'Anwendungsschicht', description: 'HTTP Secure' },
  { item: 'FTP', layer: 7, layerName: 'Anwendungsschicht', description: 'File Transfer Protocol' },
  { item: 'SMTP', layer: 7, layerName: 'Anwendungsschicht', description: 'Simple Mail Transfer Protocol' },
  { item: 'POP3', layer: 7, layerName: 'Anwendungsschicht', description: 'Post Office Protocol' },
  { item: 'IMAP', layer: 7, layerName: 'Anwendungsschicht', description: 'Internet Message Access Protocol' },
  { item: 'DNS', layer: 7, layerName: 'Anwendungsschicht', description: 'Domain Name System' },
  { item: 'DHCP', layer: 7, layerName: 'Anwendungsschicht', description: 'Dynamic Host Configuration Protocol' },
  { item: 'SNMP', layer: 7, layerName: 'Anwendungsschicht', description: 'Simple Network Management Protocol' },
  { item: 'SSH', layer: 7, layerName: 'Anwendungsschicht', description: 'Secure Shell' },
  { item: 'Telnet', layer: 7, layerName: 'Anwendungsschicht', description: 'Unverschlüsselte Terminal-Verbindung' },
  { item: 'Browser', layer: 7, layerName: 'Anwendungsschicht', description: 'HTTP-Client-Anwendung' }
];

export function generateOsiQuestion(): OsiQuestion {
  const entry = OSI_ITEMS[Math.floor(Math.random() * OSI_ITEMS.length)];
  
  return {
    theme: 'TCP/IP-Referenzmodell & Protokolle',
    questionText: `Ordne "${entry.item}" dem korrekten OSI-Layer zu. Nenne die Schichtnummer und den deutschen Namen.`,
    item: entry.item,
    expectedAnswers: {
      layer: entry.layer,
      layerName: entry.layerName
    },
    solutionSteps: [
      `Gegeben: ${entry.item}`,
      ``,
      `Analyse: ${entry.description}`,
      ``,
      `OSI-Modell Überblick:`,
      `  Layer 7: Anwendungsschicht (HTTP, FTP, SMTP...)`,
      `  Layer 6: Darstellungsschicht (Verschlüsselung, Kodierung...)`,
      `  Layer 5: Sitzungsschicht (Sitzungsverwaltung...)`,
      `  Layer 4: Transportschicht (TCP, UDP, Ports...)`,
      `  Layer 3: Vermittlungsschicht (IP, Routing...)`,
      `  Layer 2: Sicherungsschicht (MAC, Switches...)`,
      `  Layer 1: Bitübertragungsschicht (Kabel, Hubs...)`,
      ``,
      `Zuordnung:`,
      `  ${entry.item} → Layer ${entry.layer}: ${entry.layerName}`,
      ``,
      `Ergebnis:`,
      `  Layer: ${entry.layer}`,
      `  Name: ${entry.layerName}`
    ]
  };
}
