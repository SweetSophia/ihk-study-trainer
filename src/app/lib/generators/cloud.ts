import { AnswerInputConfig } from '../../types';

// ============================================================
// CLOUD COMPUTING BASICS - IHK Study Trainer Generator
// ============================================================
// Covers: AWS, Azure, GCP - Service Models, Deployment,
// Networking, Security, Cost, Availability, Modern Arch
// ============================================================

// --- Question Types ---
type QuestionType = 'multipleChoice' | 'matching' | 'trueFalse';

interface CloudQuestion {
  type: QuestionType;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  scenario?: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  acceptedValues?: string[];
  explanation: string;
}

// --- Cloud Question Bank ---
const CLOUD_QUESTIONS: CloudQuestion[] = [
  // ============ SERVICE MODELS ============
  {
    type: 'multipleChoice',
    topic: 'Service Models',
    difficulty: 'easy',
    question: 'Welches Cloud-Servicemodell bietet virtualisierte Infrastruktur (VMs, Storage, Netzwerke)?',
    options: ['IaaS', 'PaaS', 'SaaS', 'FaaS'],
    correctAnswer: 'IaaS',
    explanation: 'IaaS (Infrastructure as a Service) bietet die grundlegende Infrastruktur: virtuelle Maschinen, Netzwerke und Speicher. Der Nutzer verwaltet darauf das Betriebssystem und seine Anwendungen.',
  },
  {
    type: 'multipleChoice',
    topic: 'Service Models',
    difficulty: 'easy',
    question: 'Ein Unternehmen nutzt Microsoft 365 für E-Mail und Office-Anwendungen. Welches Servicemodell wird verwendet?',
    options: ['IaaS', 'PaaS', 'SaaS', 'Private Cloud'],
    correctAnswer: 'SaaS',
    explanation: 'Microsoft 365 ist ein typisches SaaS-Beispiel: Eine fertige Software, die über den Browser oder App zugänglich ist. Der Anbieter kümmert sich um die gesamte Infrastruktur und Wartung.',
  },
  {
    type: 'multipleChoice',
    topic: 'Service Models',
    difficulty: 'medium',
    question: 'Ein Entwickler deployt seine Webanwendung auf AWS Elastic Beanstalk. Welches Servicemodell nutzt er?',
    options: ['IaaS', 'PaaS', 'SaaS', 'FaaS'],
    correctAnswer: 'PaaS',
    explanation: 'Elastic Beanstalk ist ein PaaS-Dienst. Der Entwickler lädt seinen Code hoch, AWS kümmert sich um die Laufzeitumgebung, Server, Load Balancing und Autoscaling.',
  },
  {
    type: 'matching',
    topic: 'Service Models',
    difficulty: 'easy',
    scenario: 'Ordne die Cloud-Dienste dem richtigen Servicemodell zu:',
    question: 'Ordne zu: EC2 = ?',
    options: ['IaaS', 'PaaS', 'SaaS'],
    correctAnswer: 'IaaS',
    explanation: 'AWS EC2 (Elastic Compute Cloud) bietet virtuelle Maschinen und ist ein klassisches IaaS-Beispiel.',
  },
  {
    type: 'matching',
    topic: 'Service Models',
    difficulty: 'easy',
    question: 'Ordne zu: Azure App Service = ?',
    options: ['IaaS', 'PaaS', 'SaaS'],
    correctAnswer: 'PaaS',
    explanation: 'Azure App Service ermöglicht das Deployen von Web-Apps ohne Serververwaltung - typisches PaaS.',
  },
  {
    type: 'matching',
    topic: 'Service Models',
    difficulty: 'easy',
    question: 'Ordne zu: Google Workspace = ?',
    options: ['IaaS', 'PaaS', 'SaaS'],
    correctAnswer: 'SaaS',
    explanation: 'Google Workspace (Docs, Mail, etc.) ist ein fertiges SaaS-Produkt für Endanwender.',
  },
  {
    type: 'multipleChoice',
    topic: 'Service Models',
    difficulty: 'medium',
    question: 'Was ist die Hauptaufgabe des Nutzers bei IaaS?',
    options: [
      'Nur die Anwendung nutzen',
      'Betriebssystem, Anwendungen und Daten verwalten',
      'Die physische Infrastruktur warten',
      'Keine Verwaltung nötig'
    ],
    correctAnswer: 'Betriebssystem, Anwendungen und Daten verwalten',
    explanation: 'Bei IaaS stellt der Provider die Infrastruktur (Server, Storage, Netzwerk) bereit. Der Nutzer ist selbst für OS, Middleware, Runtime, Anwendungen und Daten verantwortlich.',
  },
  {
    type: 'trueFalse',
    topic: 'Service Models',
    difficulty: 'easy',
    question: 'Bei SaaS muss der Nutzer sich um Betriebssystem und Serverwartung kümmern.',
    correctAnswer: 'Falsch',
    acceptedValues: ['falsch', 'false', 'no', 'nein', 'unwahr', 'stimmt nicht'],
    explanation: 'Falsch! Bei SaaS kümmert sich der Anbieter um die gesamte Infrastruktur inkl. OS, Server und Wartung. Der Nutzer verwendet nur die fertige Anwendung.',
  },
  {
    type: 'trueFalse',
    topic: 'Service Models',
    difficulty: 'easy',
    question: 'PaaS eignet sich besonders gut für Entwickler, die sich auf ihren Anwendungscode konzentrieren wollen.',
    correctAnswer: 'Wahr',
    acceptedValues: ['wahr', 'true', 'yes', 'ja', 'richtig', 'stimmt'],
    explanation: 'Richtig! PaaS eliminiert die Notwendigkeit, sich um Infrastruktur, OS und Runtime zu kümmern. Entwickler können sich voll auf ihre Anwendung konzentrieren.',
  },

  // ============ DEPLOYMENT MODELS ============
  {
    type: 'multipleChoice',
    topic: 'Deployment Models',
    difficulty: 'easy',
    question: 'Welches Deployment-Modell kombiniert Public Cloud mit eigenen On-Premise-Ressourcen?',
    options: ['Public Cloud', 'Private Cloud', 'Hybrid Cloud', 'Multi-Cloud'],
    correctAnswer: 'Hybrid Cloud',
    explanation: 'Hybrid Cloud verbindet Public Cloud mit Private Cloud oder On-Premise Infrastruktur. Typischerweise über VPN oder dedizierte Standleitungen.',
  },
  {
    type: 'multipleChoice',
    topic: 'Deployment Models',
    difficulty: 'easy',
    question: 'Ein Unternehmen nutzt AWS und Azure gleichzeitig, um nicht von einem Anbieter abhängig zu sein. Welches Modell ist das?',
    options: ['Public Cloud', 'Private Cloud', 'Hybrid Cloud', 'Multi-Cloud'],
    correctAnswer: 'Multi-Cloud',
    explanation: 'Multi-Cloud bezeichnet die Nutzung mehrerer Public-Cloud-Anbieter gleichzeitig, um Vendor Lock-in zu vermeiden und die besten Dienste jedes Anbieters zu nutzen.',
  },
  {
    type: 'multipleChoice',
    topic: 'Deployment Models',
    difficulty: 'medium',
    question: 'Welches Deployment-Modell bietet die höchste Kontrolle über Daten und Infrastruktur?',
    options: ['Public Cloud', 'Private Cloud', 'Hybrid Cloud', 'Multi-Cloud'],
    correctAnswer: 'Private Cloud',
    explanation: 'Private Cloud bietet dedizierte Infrastruktur für ein einzelnes Unternehmen - entweder im eigenen Rechenzentrum oder exklusiv gehostet. Maximale Kontrolle und Sicherheit.',
  },
  {
    type: 'trueFalse',
    topic: 'Deployment Models',
    difficulty: 'easy',
    question: 'Hybrid Cloud ermöglicht es, besonders sensible Daten on-premise zu halten, während man für elastische Lastspitzen die Public Cloud nutzt.',
    correctAnswer: 'Wahr',
    acceptedValues: ['wahr', 'true', 'yes', 'ja', 'richtig', 'stimmt'],
    explanation: 'Richtig! Das ist ein typischer Hybrid-Cloud-Ansatz: Sensitive Daten verbleiben im eigenen Rechenzentrum, während die Public Cloud für Bursting (Lastspitzen) genutzt wird.',
  },
  {
    type: 'multipleChoice',
    topic: 'Deployment Models',
    difficulty: 'medium',
    question: 'Was ist ein Hauptnachteil von Public Cloud im Vergleich zu Private Cloud?',
    options: [
      'Geringere Skalierbarkeit',
      'Weniger Flexibilität',
      'Weniger Kontrolle über Daten und Infrastruktur',
      'Höhere Anfangskosten'
    ],
    correctAnswer: 'Weniger Kontrolle über Daten und Infrastruktur',
    explanation: 'In der Public Cloud teilst du dir die Infrastruktur mit anderen. Das bedeutet weniger Kontrolle über die Umgebung, obwohl die großen Provider strenge Sicherheitsstandards haben.',
  },
  {
    type: 'matching',
    topic: 'Deployment Models',
    difficulty: 'medium',
    question: 'Ordne zu: AWS Outposts = ?',
    options: ['Public Cloud', 'Private Cloud', 'Hybrid Cloud', 'Multi-Cloud'],
    correctAnswer: 'Hybrid Cloud',
    explanation: 'AWS Outposts bringt AWS-Infrastruktur und -Dienste in das lokale Rechenzentrum. Es ist eine Hybrid-Cloud-Lösung, die Public-Cloud-Dienste on-premise verfügbar macht.',
  },

  // ============ NETWORKING ============
  {
    type: 'multipleChoice',
    topic: 'Networking',
    difficulty: 'easy',
    question: 'Was ist eine VPC (Virtual Private Cloud)?',
    options: [
      'Ein physisches Rechenzentrum',
      'Ein isoliertes, logisches Netzwerk innerhalb einer Public Cloud',
      'Ein VPN-Client für Endbenutzer',
      'Ein Content Delivery Network'
    ],
    correctAnswer: 'Ein isoliertes, logisches Netzwerk innerhalb einer Public Cloud',
    explanation: 'Eine VPC ist ein isoliertes, virtualisiertes Netzwerk innerhalb einer Public Cloud. Sie ermöglicht die Kontrolle über IP-Adressbereiche, Subnets, Routing und Sicherheitsregeln.',
  },
  {
    type: 'multipleChoice',
    topic: 'Networking',
    difficulty: 'medium',
    question: 'Welcher AWS-Dienst wird verwendet, um Last auf mehrere EC2-Instanzen zu verteilen?',
    options: ['Amazon VPC', 'Amazon S3', 'Elastic Load Balancer', 'Amazon Route 53'],
    correctAnswer: 'Elastic Load Balancer',
    explanation: 'Der Elastic Load Balancer (ELB) verteilt eingehenden Traffic auf mehrere EC2-Instanzen in verschiedenen Availability Zones für Hochverfügbarkeit und Ausfallsicherheit.',
  },
  {
    type: 'multipleChoice',
    topic: 'Networking',
    difficulty: 'medium',
    question: 'Was ist der Unterschied zwischen einem Public Subnet und einem Private Subnet in einer VPC?',
    options: [
      'Es gibt keinen Unterschied',
      'Public Subnets haben Internetzugang, Private Subnets nicht',
      'Private Subnets sind kostenpflichtig',
      'Public Subnets sind nur in Private Cloud verfügbar'
    ],
    correctAnswer: 'Public Subnets haben Internetzugang, Private Subnets nicht',
    explanation: 'Public Subnets sind über ein Internet Gateway direkt aus dem Internet erreichbar. Private Subnets haben keinen direkten Internetzugang und werden für sensible Ressourcen wie Datenbanken verwendet.',
  },
  {
    type: 'trueFalse',
    topic: 'Networking',
    difficulty: 'easy',
    question: 'Ein VPN (Virtual Private Network) wird genutzt, um das Firmennetzwerk sicher mit der Cloud zu verbinden.',
    correctAnswer: 'Wahr',
    acceptedValues: ['wahr', 'true', 'yes', 'ja', 'richtig', 'stimmt'],
    explanation: 'Richtig! Site-to-Site VPNs erstellen verschlüsselte Tunnel zwischen dem Unternehmensnetzwerk und der Cloud-Infrastruktur für sichere Kommunikation.',
  },
  {
    type: 'matching',
    topic: 'Networking',
    difficulty: 'medium',
    question: 'Ordne zu: Azure Virtual Network = ?',
    options: ['Load Balancer', 'VPN', 'VPC', 'CDN'],
    correctAnswer: 'VPC',
    explanation: 'Azure Virtual Network (VNet) ist das Äquivalent zu AWS VPC in Microsoft Azure - ein isoliertes Netzwerk in der Azure Cloud.',
  },
  {
    type: 'matching',
    topic: 'Networking',
    difficulty: 'easy',
    question: 'Ordne zu: Cloud CDN = ?',
    options: ['Lastverteilung', 'Isoliertes Netzwerk', 'Inhaltsauslieferung mit niedriger Latenz', 'VPN-Verbindung'],
    correctAnswer: 'Inhaltsauslieferung mit niedriger Latenz',
    explanation: 'CDN (Content Delivery Network) verteilt Inhalte über Edge Locations weltweit, um niedrige Latenz für Endbenutzer zu gewährleisten.',
  },

  // ============ SECURITY ============
  {
    type: 'multipleChoice',
    topic: 'Security',
    difficulty: 'easy',
    question: 'Was beschreibt das Shared Responsibility Model in der Cloud?',
    options: [
      'Dass alle Kosten geteilt werden',
      'Dass Sicherheit zwischen Provider und Kunde aufgeteilt wird',
      'Dass VMs geteilt werden',
      'Dass Daten zwischen Clouds geteilt werden'
    ],
    correctAnswer: 'Dass Sicherheit zwischen Provider und Kunde aufgeteilt wird',
    explanation: 'Das Shared Responsibility Model teilt Sicherheitsverantwortlichkeiten: Der Cloud-Provider sichert DIE Cloud (Infrastruktur, Hardware, Netzwerk). Der Kunde sichert IN der Cloud (Daten, Zugriff, Anwendung).',
  },
  {
    type: 'multipleChoice',
    topic: 'Security',
    difficulty: 'medium',
    question: 'Welches Prinzip besagt, dass ein Benutzer nur die minimal notwendigen Berechtigungen haben sollte?',
    options: [
      'Shared Responsibility',
      'Defense in Depth',
      'Principle of Least Privilege',
      'Zero Trust'
    ],
    correctAnswer: 'Principle of Least Privilege',
    explanation: 'Das Principle of Least Privilege (PoLP) bedeutet, dass Benutzer nur die absolut notwendigen Berechtigungen erhalten, die sie für ihre Aufgaben benötigen - nicht mehr.',
  },
  {
    type: 'trueFalse',
    topic: 'Security',
    difficulty: 'easy',
    question: 'Zero Trust bedeutet, dass man innerhalb des eigenen Netzwerks implizit vertrauen kann.',
    correctAnswer: 'Falsch',
    acceptedValues: ['falsch', 'false', 'no', 'nein', 'unwahr', 'stimmt nicht'],
    explanation: 'Falsch! Zero Trust bedeutet genau das Gegenteil: "Vertraue niemandem, überprüfe jeden". Auch interne Netzwerkzugriffe müssen authentifiziert und autorisiert werden.',
  },
  {
    type: 'multipleChoice',
    topic: 'Security',
    difficulty: 'medium',
    question: 'Was ist MFA (Multi-Faktor-Authentifizierung)?',
    options: [
      'Anmeldung mit zwei Passwörtern',
      'Authentifizierung mit etwas, das man weiß, hat, und/oder ist',
      'Nur die Anmeldung mit Passwort',
      'Eine Datenverschlüsselung'
    ],
    correctAnswer: 'Authentifizierung mit etwas, das man weiß, hat, und/oder ist',
    explanation: 'MFA kombiniert mehrere Authentifizierungsfaktoren: Wissen (Passwort), Besitz (Token/Smartphone), und/oder Sein (Biometrie). Dies erhöht die Sicherheit erheblich.',
  },
  {
    type: 'matching',
    topic: 'Security',
    difficulty: 'easy',
    question: 'Ordne zu: AWS IAM = ?',
    options: ['Identitäts- und Zugriffsverwaltung', 'Content Delivery', 'Serverlose Datenbank', 'Lastverteilung'],
    correctAnswer: 'Identitäts- und Zugriffsverwaltung',
    explanation: 'AWS IAM (Identity and Access Management) ermöglicht die zentrale Verwaltung von Benutzern, Gruppen, Rollen und deren Berechtigungen in AWS.',
  },
  {
    type: 'multipleChoice',
    topic: 'Security',
    difficulty: 'medium',
    question: 'Was bedeutet Data-at-Rest Encryption?',
    options: [
      'Daten werden während der Übertragung verschlüsselt',
      'Daten werden im gespeicherten Zustand verschlüsselt',
      'Daten werden beim Import verschlüsselt',
      'Daten werden in Rechenzentren verschlüsselt'
    ],
    correctAnswer: 'Daten werden im gespeicherten Zustand verschlüsselt',
    explanation: 'Data-at-Rest bezeichnet Daten, die auf Festplatten, in Datenbanken oder anderen Speichermedien gespeichert sind. Diese sollten verschlüsselt sein, um bei Diebstahl des Mediums geschützt zu sein.',
  },
  {
    type: 'trueFalse',
    topic: 'Security',
    difficulty: 'easy',
    question: 'Bei AWS ist der Kunde für die Sicherheit der Daten in S3 verantwortlich, AWS ist für die Sicherheit des Rechenzentrums verantwortlich.',
    correctAnswer: 'Wahr',
    acceptedValues: ['wahr', 'true', 'yes', 'ja', 'richtig', 'stimmt'],
    explanation: 'Richtig! Das ist ein Beispiel für das Shared Responsibility Model. AWS sichert die Infrastruktur (Rechenzentrum, Server, Storage-System), der Kunde sichert seine Daten (Verschlüsselung, Zugriffskontrolle).',
  },
  {
    type: 'trueFalse',
    topic: 'Security',
    difficulty: 'medium',
    question: 'Ein Cloud-Kunde muss auf Anfrage einer betroffenen Person deren Rechte (z.B. Löschung) gewährleisten können - unabhängig davon, ob die Daten bei einem Cloud-Provider liegen.',
    correctAnswer: 'Wahr',
    acceptedValues: ['wahr', 'true', 'yes', 'ja', 'richtig', 'stimmt'],
    explanation: 'Richtig! Als Datenverantwortlicher (Controller) muss der Kunde sicherstellen, dass betroffene Personen ihre DSGVO-Rechte (Auskunft, Berichtigung, Löschung, Datenübertragbarkeit) wahrnehmen können - auch bei Cloud-verarbeiteten Daten. Der Auftragsverarbeiter (Processor) unterstützt den Kunden dabei.',
  },

  // ============ COST & AVAILABILITY ============
  {
    type: 'multipleChoice',
    topic: 'Cost',
    difficulty: 'easy',
    question: 'Was ist der Unterschied zwischen CAPEX und OPEX?',
    options: [
      'CAPEX sind langfristige Investitionen, OPEX sind laufende Betriebskosten',
      'Es gibt keinen Unterschied',
      'CAPEX sind günstiger',
      'OPEX sind Investitionen'
    ],
    correctAnswer: 'CAPEX sind langfristige Investitionen, OPEX sind laufende Betriebskosten',
    explanation: 'CAPEX (Capital Expenditure) = hohe Anfangsinvestitionen in Hardware. OPEX (Operational Expenditure) = laufende Kosten für Cloud-Dienste. Cloud ermöglicht den Shift von CAPEX zu OPEX.',
  },
  {
    type: 'multipleChoice',
    topic: 'Cost',
    difficulty: 'easy',
    question: 'Was bedeutet Pay-as-you-go in der Cloud?',
    options: [
      'Man zahlt nur für das, was man nutzt',
      'Man zahlt eine monatliche Flatrate',
      'Man muss im Voraus bezahlen',
      'Kosten werden nicht angezeigt'
    ],
    correctAnswer: 'Man zahlt nur für das, was man nutzt',
    explanation: 'Pay-as-you-go (nutzungsbasierte Abrechnung) bedeutet, dass du nur für die Ressourcen zahlst, die du tatsächlich verwendest - ohne langfristige Verträge oder Vorauszahlungen.',
  },
  {
    type: 'multipleChoice',
    topic: 'Availability',
    difficulty: 'medium',
    question: 'Was ist der Vorteil von Reserved Instances gegenüber On-Demand Instances?',
    options: [
      'Mehr Flexibilität',
      'Garantierte Verfügbarkeit',
      'Rabattierte Preise bei Vorauszahlung',
      'Schnellere Bereitstellung'
    ],
    correctAnswer: 'Rabattierte Preise bei Vorauszahlung',
    explanation: 'Reserved Instances bieten erhebliche Rabatte (oft 30-60%) gegenüber On-Demand-Preisen, wenn du dich für 1-3 Jahre verbindest. Im Gegenzug ist die Flexibilität geringer.',
  },
  {
    type: 'trueFalse',
    topic: 'Availability',
    difficulty: 'medium',
    question: 'High Availability (HA) bedeutet, dass ein System so designed ist, dass es bei Ausfall einer Komponente automatisch auf eine redundante Komponente umschaltet.',
    correctAnswer: 'Wahr',
    acceptedValues: ['wahr', 'true', 'yes', 'ja', 'richtig', 'stimmt'],
    explanation: 'Richtig! HA-Design eliminiert Single Points of Failure durch Redundanz und automatische Failover. Typische HA-Architekturen nutzen mehrere Availability Zones.',
  },
  {
    type: 'multipleChoice',
    topic: 'Availability',
    difficulty: 'medium',
    question: 'RTO (Recovery Time Objective) definiert:',
    options: [
      'Wie viel Daten maximal verloren gehen darf',
      'Wie lange ein System nach einem Ausfall maximal nicht verfügbar sein darf',
      'Wie oft Backups erstellt werden müssen',
      'Wie viele Server benötigt werden'
    ],
    correctAnswer: 'Wie lange ein System nach einem Ausfall maximal nicht verfügbar sein darf',
    explanation: 'RTO ist die maximale akzeptable Ausfallzeit nach einem Disaster. RPO (Recovery Point Objective) definiert hingegen, wie viel Daten verloren gehen darf (zeitlich).',
  },
  {
    type: 'multipleChoice',
    topic: 'Availability',
    difficulty: 'medium',
    question: 'Was ist Autoscaling?',
    options: [
      'Manuelles Hinzufügen von Servern',
      'Automatische Anpassung der Ressourcen basierend auf der Last',
      'Automatische Datensicherung',
      'Automatische Verschlüsselung'
    ],
    correctAnswer: 'Automatische Anpassung der Ressourcen basierend auf der Last',
    explanation: 'Autoscaling passt die Anzahl der Compute-Ressourcen automatisch an die aktuelle Last an: Mehr bei hoher Last (Scale Out), weniger bei niedriger Last (Scale In) - optimiert Kosten und Performance.',
  },

  // ============ MODERN ARCHITECTURES ============
  {
    type: 'multipleChoice',
    topic: 'Modern Architecture',
    difficulty: 'easy',
    question: 'Was ist der Hauptunterschied zwischen VMs und Containern?',
    options: [
      'VMs sind schneller als Container',
      'Container teilen sich das Host-OS, VMs haben ein eigenes OS',
      'Container sind sicherer als VMs',
      'Es gibt keinen Unterschied'
    ],
    correctAnswer: 'Container teilen sich das Host-OS, VMs haben ein eigenes OS',
    explanation: 'VMs enthalten ein vollständiges Gast-Betriebssystem und sind dadurch schwergewichtiger. Container teilen sich den OS-Kernel des Hosts, sind leichter, starten schneller und sind effizienter.',
  },
  {
    type: 'multipleChoice',
    topic: 'Modern Architecture',
    difficulty: 'medium',
    question: 'Welcher Dienst ist ein Beispiel für Serverless/FaaS?',
    options: ['Amazon EC2', 'AWS Lambda', 'Amazon RDS', 'Amazon S3'],
    correctAnswer: 'AWS Lambda',
    explanation: 'AWS Lambda ist ein Serverless/Function-as-a-Service: Du lädst Code hoch, AWS führt ihn aus und skaliert automatisch. Du zahlst nur für die Rechenzeit, die tatsächlich verbraucht wird.',
  },
  {
    type: 'matching',
    topic: 'Modern Architecture',
    difficulty: 'easy',
    question: 'Ordne zu: Managed Database (z.B. Amazon RDS) = ?',
    options: ['Serverless', 'Managed Service', 'Container', 'VPN'],
    correctAnswer: 'Managed Service',
    explanation: 'RDS (Relational Database Service) ist ein Managed Service: AWS kümmert sich um Datenbankwartung, Backups, Patches und Hochverfügbarkeit - der Kunde nutzt nur die Datenbank.',
  },
  {
    type: 'trueFalse',
    topic: 'Modern Architecture',
    difficulty: 'easy',
    question: 'Kubernetes ist ein Container-Orchestrierungs-Tool zur Verwaltung, Skalierung und Bereitstellung von Container-Anwendungen.',
    correctAnswer: 'Wahr',
    acceptedValues: ['wahr', 'true', 'yes', 'ja', 'richtig', 'stimmt'],
    explanation: 'Richtig! Kubernetes (K8s) automatisiert das Management von Container-Anwendungen: Deployment, Skalierung, Load Balancing, Rolling Updates und Self-Healing.',
  },
  {
    type: 'multipleChoice',
    topic: 'Modern Architecture',
    difficulty: 'hard',
    question: 'Ein Unternehmen plant eine Cloud-Migration. Welcher Ansatz hat typischerweise den höchsten operativen Aufwand und die steilste Lernkurve für ein Team ohne Kubernetes-Erfahrung?',
    options: [
      'Start mit einer einzelnen EC2-Instanz (Lift & Shift)',
      'Start mit einer vollständigen Container-Architektur auf EKS',
      'Start mit einer Serverless-Architektur (Lambda + API Gateway)',
      'Start mit einer Managed Database (RDS)'
    ],
    correctAnswer: 'Start mit einer vollständigen Container-Architektur auf EKS',
    explanation: 'Kubernetes erfordert ein tiefes Verständnis von Orchestrierungskonzepten, YAML-Konfiguration, Networking, Storage und Monitoring. EKS fügt zusätzlich AWS-spezifische Komplexität hinzu (IAM, VPC, Security Groups). Die Lernkurve ist deutlich steiler als bei EC2 (einfache VM-Verwaltung) oder Lambda (abstrakte Ausführung ohne Server-Management). Hinzu kommt der Betriebsaufwand für Cluster-Wartung, Upgrades und Self-Healing-Konfiguration.',
  },
  {
    type: 'multipleChoice',
    topic: 'Modern Architecture',
    difficulty: 'hard',
    question: 'Welches Szenario zeigt den typischen Vorteil von Multi-Cloud?',
    options: [
      'Ein Unternehmen nutzt AWS für alle Workloads',
      'Ein Unternehmen nutzt AWS und Azure, um bei Ausfall eines Anbieters auf den anderen umzuschalten',
      'Ein Unternehmen hat eine Private Cloud',
      'Ein Unternehmen nutzt nur dedizierte Server'
    ],
    correctAnswer: 'Ein Unternehmen nutzt AWS und Azure, um bei Ausfall eines Anbieters auf den anderen umzuschalten',
    explanation: 'Multi-Cloud ermöglicht Resilience durch Redundanz über Anbieter hinweg. Bei einem Ausfall von AWS kann das Unternehmen auf Azure umschalten - das erhöht die Ausfallsicherheit.',
  },

  // ============ PROVIDER COMPARISON ============
  {
    type: 'matching',
    topic: 'Provider Comparison',
    difficulty: 'easy',
    question: 'Ordne zu: Compute Engine = ?',
    options: ['AWS', 'Azure', 'GCP'],
    correctAnswer: 'GCP',
    explanation: 'Compute Engine ist der IaaS-Compute-Dienst von Google Cloud Platform (GCP) für virtuelle Maschinen.',
  },
  {
    type: 'matching',
    topic: 'Provider Comparison',
    difficulty: 'easy',
    question: 'Ordne zu: Blob Storage = ?',
    options: ['AWS', 'Azure', 'GCP'],
    correctAnswer: 'Azure',
    explanation: 'Blob Storage ist der Object-Storage-Dienst von Microsoft Azure. AWS hat S3, GCP hat Cloud Storage.',
  },
  {
    type: 'matching',
    topic: 'Provider Comparison',
    difficulty: 'medium',
    question: 'Ordne zu: EKS (Elastic Kubernetes Service) = ?',
    options: ['AWS', 'Azure', 'GCP'],
    correctAnswer: 'AWS',
    explanation: 'EKS ist der Managed Kubernetes Service von AWS. Azure hat AKS (Azure Kubernetes Service), GCP hat GKE (Google Kubernetes Engine).',
  },
  {
    type: 'multipleChoice',
    topic: 'Provider Comparison',
    difficulty: 'medium',
    question: 'Welcher Cloud-Provider bietet "Regions" und "Zones" als geografische Unterteilung an?',
    options: ['Nur AWS', 'Alle drei (AWS, Azure, GCP)', 'Nur Azure', 'Keiner'],
    correctAnswer: 'Alle drei (AWS, Azure, GCP)',
    explanation: 'Alle drei großen Cloud-Provider nutzen Regions und Availability Zones: AWS (Regionen + AZs), Azure (Regions + Availability Zones), GCP (Regions + Zones). Dies ermöglicht Hochverfügbarkeit und Disaster Recovery.',
  },
];

/**
 * Selects a uniformly distributed integer between the given bounds, inclusive.
 *
 * @param min - The lower bound (inclusive)
 * @param max - The upper bound (inclusive)
 * @returns A random integer x such that `min <= x <= max`
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Main Generator Function ---
export interface CloudQuestionResult {
  theme: string;
  questionText: string;
  expectedAnswers: Record<string, string | number | boolean>;
  solutionSteps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  answerInputs: AnswerInputConfig[];
  scenario?: string;
}

/**
 * Generate a randomized cloud knowledge question, optionally filtered by difficulty.
 *
 * If `difficulty` is provided the function prefers questions with that difficulty but falls back to the full question bank when none match.
 *
 * @param difficulty - Optional difficulty filter: 'easy', 'medium', or 'hard'
 * @returns A `CloudQuestionResult` containing:
 *  - `theme`: the question topic
 *  - `questionText`: the question prompt (scenario returned separately via `scenario`)
 *  - `expectedAnswers`: keyed expected answer values (e.g., `{ answer: ... }`)
 *  - `solutionSteps`: array of strings summarizing topic, question, correct answer, and explanation
 *  - `difficulty`: the chosen question's difficulty
 *  - `answerInputs`: UI input configuration including `valueOptions` and `acceptedValues`
 *  - `scenario` (optional): associated scenario text
 * @throws Error if a `multipleChoice` or `matching` question is selected but `options` is not a non-empty array
 */
export function generateCloudQuestion(difficulty?: 'easy' | 'medium' | 'hard'): CloudQuestionResult {
  // Filter by difficulty if specified
  let availableQuestions = CLOUD_QUESTIONS;
  if (difficulty) {
    availableQuestions = CLOUD_QUESTIONS.filter(q => q.difficulty === difficulty);
  }

  // If no questions with specified difficulty, use all
  if (availableQuestions.length === 0) {
    availableQuestions = CLOUD_QUESTIONS;
  }

  // Pick random question
  const q = availableQuestions[getRandomInt(0, availableQuestions.length - 1)];

  // Build question text (include scenario if present for UI compatibility)
  const questionText = q.scenario
    ? `${q.scenario}\n\n${q.question}`
    : q.question;

  // Build answer inputs based on question type
  let answerInputs: AnswerInputConfig[] = [];
  let expectedAnswers: Record<string, string | number | boolean> = {};

  switch (q.type) {
    case 'multipleChoice':
    case 'matching':
      // Validate that q.options exists and has entries before using it
      if (!Array.isArray(q.options) || q.options.length === 0) {
        throw new Error(`Frage "${q.question.slice(0, 40)}...": Antwortoptionen müssen für ${q.type}-Fragen als nicht-leeres Array definiert sein.`);
      }
      answerInputs = [{
        valueKey: 'answer',
        label: 'Antwort',
        valueOptions: q.options,
        acceptedValues: q.acceptedValues || [q.correctAnswer],
      }];
      expectedAnswers = { answer: q.correctAnswer };
      break;

    case 'trueFalse': {
      const trueFalseOptions = ['Wahr', 'Falsch'];
      answerInputs = [{
        valueKey: 'answer',
        label: 'Antwort',
        valueOptions: trueFalseOptions,
        acceptedValues: q.acceptedValues || [q.correctAnswer],
      }];
      expectedAnswers = { answer: q.correctAnswer };
      break;
    }
  }

  // Build solution steps
  const solutionSteps = [
    `Thema: ${q.topic}`,
    `Frage: ${q.question}`,
    `Richtige Antwort: ${q.correctAnswer}`,
    `Erklärung: ${q.explanation}`,
  ];

  return {
    theme: q.topic,
    questionText,
    expectedAnswers,
    solutionSteps,
    difficulty: q.difficulty,
    answerInputs,
    scenario: q.scenario,
  };
}

// Export topic list for reference
export const CLOUD_TOPICS = [
  'Service Models',
  'Deployment Models',
  'Networking',
  'Security',
  'Cost',
  'Availability',
  'Modern Architecture',
  'Provider Comparison',
] as const;

export type CloudTopic = typeof CLOUD_TOPICS[number];
