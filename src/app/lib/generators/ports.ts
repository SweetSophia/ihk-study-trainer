import { AnswerInputConfig } from '../../types';

export interface PortQuestion {
  theme: string;
  questionText: string;
  port: number;
  expectedAnswers: { service: string; protocol: string } | { port: number; protocol: string };
  /** 'portToService' = given port, identify service+protocol; 'serviceToPort' = given service, identify port+protocol */
  direction: 'portToService' | 'serviceToPort';
  answerInputs: AnswerInputConfig[];
  solutionSteps: string[];
}

const PORT_DATABASE: Array<{ port: number; service: string; protocol: string; description: string }> = [
  { port: 20, service: 'FTP-DATA', protocol: 'TCP', description: 'FTP Datenübertragung' },
  { port: 21, service: 'FTP', protocol: 'TCP', description: 'FTP Kontrollverbindung' },
  { port: 22, service: 'SSH', protocol: 'TCP', description: 'Secure Shell' },
  { port: 23, service: 'Telnet', protocol: 'TCP', description: 'Telnet (unverschlüsselt)' },
  { port: 25, service: 'SMTP', protocol: 'TCP', description: 'Simple Mail Transfer Protocol' },
  { port: 53, service: 'DNS', protocol: 'TCP/UDP', description: 'Domain Name System' },
  { port: 67, service: 'DHCP-Server', protocol: 'UDP', description: 'DHCP Server (Bootstrap Protocol Server)' },
  { port: 68, service: 'DHCP-Client', protocol: 'UDP', description: 'DHCP Client (Bootstrap Protocol Client)' },
  { port: 80, service: 'HTTP', protocol: 'TCP', description: 'Hypertext Transfer Protocol' },
  { port: 110, service: 'POP3', protocol: 'TCP', description: 'Post Office Protocol v3' },
  { port: 123, service: 'NTP', protocol: 'UDP', description: 'Network Time Protocol' },
  { port: 143, service: 'IMAP', protocol: 'TCP', description: 'Internet Message Access Protocol' },
  { port: 161, service: 'SNMP', protocol: 'UDP', description: 'Simple Network Management Protocol' },
  { port: 162, service: 'SNMP-Trap', protocol: 'UDP', description: 'SNMP Traps' },
  { port: 389, service: 'LDAP', protocol: 'TCP/UDP', description: 'Lightweight Directory Access Protocol' },
  { port: 443, service: 'HTTPS', protocol: 'TCP', description: 'HTTP Secure (SSL/TLS)' },
  { port: 465, service: 'SMTPS', protocol: 'TCP', description: 'SMTP over SSL' },
  { port: 514, service: 'Syslog', protocol: 'UDP', description: 'System Logging' },
  { port: 587, service: 'SMTP-Submission', protocol: 'TCP', description: 'SMTP Message Submission' },
  { port: 636, service: 'LDAPS', protocol: 'TCP', description: 'LDAP over SSL' },
  { port: 993, service: 'IMAPS', protocol: 'TCP', description: 'IMAP over SSL' },
  { port: 995, service: 'POP3S', protocol: 'TCP', description: 'POP3 over SSL' },
  { port: 1433, service: 'MSSQL', protocol: 'TCP', description: 'Microsoft SQL Server' },
  { port: 1521, service: 'Oracle', protocol: 'TCP', description: 'Oracle Database' },
  { port: 3306, service: 'MySQL', protocol: 'TCP', description: 'MySQL Database' },
  { port: 3389, service: 'RDP', protocol: 'TCP/UDP', description: 'Remote Desktop Protocol' },
  { port: 5432, service: 'PostgreSQL', protocol: 'TCP', description: 'PostgreSQL Database' },
  { port: 5900, service: 'VNC', protocol: 'TCP', description: 'Virtual Network Computing' },
  { port: 8080, service: 'HTTP-Alt', protocol: 'TCP', description: 'Alternative HTTP Port' },
  { port: 8443, service: 'HTTPS-Alt', protocol: 'TCP', description: 'Alternative HTTPS Port' }
];

export function generatePortQuestion(): PortQuestion {
  // Randomly select a port from the database
  const entry = PORT_DATABASE[Math.floor(Math.random() * PORT_DATABASE.length)];
  
  // Randomly choose between "identify service" or "identify port"
  const direction = Math.random() > 0.5 ? 'portToService' : 'serviceToPort';
  
  const SERVICE_OPTIONS = [...new Set(PORT_DATABASE.map(p => p.service))];
  const PROTOCOL_OPTIONS = [...new Set(PORT_DATABASE.map(p => p.protocol))];
  
  if (direction === 'portToService') {
    return {
      theme: 'TCP/IP-Referenzmodell & Protokolle',
      questionText: `Welcher Dienst und welches Protokoll gehören zu Port ${entry.port}?`,
      port: entry.port,
      direction: 'portToService',
      expectedAnswers: {
        service: entry.service,
        protocol: entry.protocol
      },
      answerInputs: [
        {
          valueKey: 'service',
          label: 'Dienst',
          valueOptions: SERVICE_OPTIONS,
        },
        {
          valueKey: 'protocol',
          label: 'Protokoll',
          valueOptions: PROTOCOL_OPTIONS,
        },
      ],
      solutionSteps: [
        `Gegeben: Port ${entry.port}`,
        ``,
        `Schritt 1: Portnummer identifizieren`,
        `  Port ${entry.port} ist ein ${getPortCategory(entry.port)}`,
        ``,
        `Schritt 2: Dienst zuordnen`,
        `  ${entry.description}`,
        `  Dienst: ${entry.service}`,
        ``,
        `Schritt 3: Protokoll bestimmen`,
        `  ${entry.service} verwendet ${entry.protocol}`,
        ``,
        `Ergebnis:`,
        `  Dienst: ${entry.service}`,
        `  Protokoll: ${entry.protocol}`
      ]
    };
  } else {
    return {
      theme: 'TCP/IP-Referenzmodell & Protokolle',
      questionText: `Welcher Port wird vom Dienst "${entry.service}" verwendet und welches Protokoll kommt zum Einsatz?`,
      port: entry.port,
      direction: 'serviceToPort',
      expectedAnswers: {
        port: entry.port,
        protocol: entry.protocol
      },
      answerInputs: [
        {
          valueKey: 'port',
          label: 'Portnummer',
          // No valueOptions = renders as numeric text input
        },
        {
          valueKey: 'protocol',
          label: 'Protokoll',
          valueOptions: PROTOCOL_OPTIONS,
        },
      ],
      solutionSteps: [
        `Gegeben: Dienst = ${entry.service}`,
        ``,
        `Schritt 1: Standardport ermitteln`,
        `  ${entry.service} verwendet standardmäßig Port ${entry.port}`,
        ``,
        `Schritt 2: Protokoll bestimmen`,
        `  ${entry.description}`,
        `  Protokoll: ${entry.protocol}`,
        ``,
        `Ergebnis:`,
        `  Port: ${entry.port}`,
        `  Protokoll: ${entry.protocol}`
      ]
    };
  }
}

function getPortCategory(port: number): string {
  if (port < 1024) return 'Well-Known Port (0-1023)';
  if (port < 49152) return 'Registered Port (1024-49151)';
  return 'Dynamic/Private Port (49152-65535)';
}
