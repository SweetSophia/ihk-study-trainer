# IHK Study Trainer

Interaktiver Lernassistent für die IHK-Prüfung zum **Fachinformatiker Systemintegration**.

Die App bündelt klassische FiSi-Rechenthemen, Netzwerktechnik, Linux- und Cloud-Grundlagen, kaufmännische Kalkulation sowie acht zusammenhängende AP2-Szenarien und einen SQL-Trainer in einer Oberfläche mit Schritt-für-Schritt-Lösungen und Fortschritts-Tracking.

🔗 **Live URL**: https://ihk-study-trainer.vercel.app

> Die AP2-Szenarien sind eigene Übungen mit Schwerpunkt Baden-Württemberg, keine Original-Prüfungsaufgaben und kein offiziell von der IHK bestätigtes Angebot.

> Das separate, KI-gestützte **SQL-Modul** erfordert eine Anmeldung. **AP2 Datenbankentwurf & SQL** ist dagegen auch als Gast nutzbar und benötigt keinen KI-Dienst.

## Highlights

- **30 Lernmodule** (29 ohne Anmeldung zugänglich + das separate SQL-Modul nach Anmeldung) für typische IHK-Themen
- **Generierte Einzelaufgaben und feste AP2-Szenarien** für Rechenwege, Planung und begründete Entscheidungen
- **Schritt-für-Schritt-Lösungen** für Rechen- und Verständnisaufgaben
- **Fortschritts-Tracking pro Modul** inklusive Genauigkeit und Lern-Streaks
- **"Fehler üben"-Modus**, um gezielt schwache Themen zu wiederholen
- **Anmeldung per persönlicher Account-ID** ohne E-Mail/Passwort-Flow
- **Mobile-first UI** mit Dark Mode und klarer Karten-Navigation
- **SQL im Browser** mit PGlite: feste AP2-Aufgaben sowie ein separates Modul mit KI-generierten Übungen

## Neuere Module & Erweiterungen

### Acht AP2-Szenarien

- **Netzwerkplanung** – Teilnetze und VLANs für Büro, Werkstatt und Gäste planen. Alternative gültige, ausreichend große und überlappungsfreie Aufteilungen werden akzeptiert; die Begründung der Verkehrsregeln bleibt Selbstbewertung.
- **Datenbankentwurf & SQL** – Geräte, Standorte und Wartungen modellieren, danach drei SQL-Aufgaben auf einem vorgegebenen Lehrschema lösen: geordnete Abfrage, Wartungsanzahl einschließlich Geräten ohne Wartungen und gezieltes UPDATE. Gleichwertige Lösungen werden anhand von zwei synthetischen Datensätzen und aufgabenspezifischen Ergebnis-/Änderungsregeln geprüft.
- **Projektplanung** – einen Backup-Rollout mit Abhängigkeiten, frühesten/spätesten Zeitpunkten, Gesamtpuffern und kritischen Vorgängen berechnen; anschließend die Auswirkung einer Verzögerung untersuchen.
- **Algorithmen** – vorgegebenen Pseudocode zur Speicherüberwachung von fünf Servern nachvollziehen: Zähler, geordnete Warnungen und einen Grenzfehler prüfen. Es wird kein eingegebener Programmcode ausgeführt.
- **Fehlersuche** – in einem synthetischen DNS-Vorfall belegte und unbelegte Aussagen unterscheiden, eine begrenzte Profilkorrektur und passende Verifikation auswählen. Fehlende Ping-Antworten allein beweisen keine allgemeine Unerreichbarkeit; es werden keine echten Netzwerkbefehle ausgeführt.
- **Wirtschaftlichkeit** – zwei fiktive Dateidienst-Angebote anhand fester Netto-Anfangs- und Monatskosten vergleichen: Gesamtkosten nach 36 Monaten und erster vollständig abgerechneter Monat mit strikt günstigeren Serverkosten. Exakte Cent-Prüfung; Betrieb, Wiederherstellung und Vertragsbedingungen bleiben Selbstbewertung. Das vereinfachte Kostenmodell ist ausdrücklich keine vollständige reale Betriebskostenanalyse.

- **Berechtigungen** – effektive Zugriffe aus überlappenden positiven Gruppengewährungen bestimmen und eine eng begrenzte Korrektur mit positiven und negativen Kontrollen planen. Vorgegebenes Lehrmodell ohne Vererbung oder ausdrückliche Verbote; keine echten Rechteänderungen. Freigabe und Rücknahme bleiben Selbstbewertung.

- **Datensicherung** – mögliches Datenverlustfenster und Ausfalldauer mit vorgegebenen RPO-/RTO-Zielen vergleichen; eine vollständige Voll-/Inkrementalkette zum neuesten rekonstruierbaren Datenstand wählen. Beide gültigen Alternativen werden akzeptiert. Betriebsfreigabe bleibt Selbstbewertung; es werden keine echten Wiederherstellungen ausgeführt.

Die objektiven Prüfungen liefern Rückmeldung; schriftliche Begründungen und Rubriken werden ausdrücklich selbst bewertet. Pro Durchlauf zählt nur der erste abgeschlossene objektive Check je Abschnitt bzw. SQL-Aufgabe: Netzwerkplanung einmal, Datenbank/SQL bis zu dreimal, Projektplanung, Algorithmen, Fehlersuche, Wirtschaftlichkeit, Datensicherung und Berechtigungen jeweils bis zu zweimal. Wiederholungen und Selbstbewertung vergeben keine zusätzlichen Punkte; eine vorher aufgedeckte Lösung macht den zugehörigen Teil ungewertet. Als Gast wird kein AP2-Fortschritt gespeichert. Sitzungseingaben werden nicht als Aufgabenentwurf gespeichert und gehen beim Verlassen verloren. Datenbank/SQL, Projektplanung, Algorithmen, Fehlersuche, Wirtschaftlichkeit, Datensicherung und Berechtigungen setzen den Durchlauf auch beim Anmelden oder Kontowechsel zurück. Projektplanung, Algorithmen, Fehlersuche, Wirtschaftlichkeit, Datensicherung und Berechtigungen zeigen dafür einen dauerhaften Hinweis; Datenbank/SQL zeigt den Hinweis zur Anmeldung nur im Gastmodus.

**AP2-Trainingslauf:** Ein kuratierter Durchgang verbindet Wirtschaftlichkeit, Fehlersuche und Datensicherung als drei unabhängige Szenarien. Antworten, Rückmeldungen, Lösungshinweise und Selbstbewertung bleiben beim Wechsel zwischen Aufgaben und Auswertung erhalten. Die Auswertung trennt unveränderliche Erstprüfungen, aktuelle Rückmeldungen und unbewertete Begründungen; gezielte Rücksprünge helfen beim Wiederholen. Es gibt keinen Timer und keinen Anspruch auf Gleichwertigkeit mit einer offiziellen Prüfung. Neuladen, Verlassen des Moduls sowie Anmelden oder Kontowechsel verwerfen den Sitzungsentwurf. Objektive Versuche zählen ausschließlich bei den ursprünglichen Themen, nie zusätzlich beim Trainingslauf. Als Gast bleibt alles ungespeichert.

Beim AP2-SQL-Training laufen Prüfungen in wegwerfbaren Browser-Datenbanken mit Worker-Abbruch und einer 30-Sekunden-Frist. Pausierte Browser können Timer verzögern; dies ist keine harte Echtzeit- oder Speichergrenze.

### Weitere Erweiterungen und Verbesserungen

- **RAID-Rechner** mit visueller Laufwerksdarstellung, Kapazität und Ausfallsicherheit
- **Subnetting-Visualisierung** nach der Prüfung oder beim Öffnen der Lösung sowie **OSI-Sortierübung** mit Tastaturbedienung
- Getrennte Vorwärts- und Rückwärtskalkulation neben gemischter Handelskalkulation
- Genauere Prüfung diskreter Zahlen und Netzwerkangaben, korrekt ausgerichtete Aggregationsnetze und SQL-Bewertung mit getrennten Testdatenbanken
- Verbesserte SQL-Fehlermeldungen, Schutz vor veralteten Fortschrittsantworten und zugängliche Rückmeldungen in den neuen Trainern

## Lernmodule

### 30 Lernmodule (29 direkt verfügbar + 1 nach Anmeldung)

Die Nummerierung dient als Lese-Reihenfolge; die Modul-Auswahl in der App ist anders angeordnet.

1. **Übertragungszeit** – Übertragungsdauer aus Datenmenge und Bandbreite berechnen
2. **Bildgröße** – Speicherbedarf unkomprimierter Bilder berechnen
3. **Bild-Transfer** – Bildgröße und Übertragungszeit in einer kombinierten Aufgabe lösen
4. **Overhead** – Protokoll-Overhead und effektive Datenmengen bestimmen
5. **Subnetting** – IPv4-Subnetze, Netzadressen und Host-Bereiche berechnen
6. **Einheiten** – dezimale und binäre Speichereinheiten sicher umrechnen (MB/MiB, GB/GiB)
7. **Binär** – Binär- und Dezimalwerte umwandeln
8. **Hexadezimal** – Hexadezimal- und Dezimalwerte umwandeln
9. **Hex/Binär** – Hexadezimal- und Binärwerte direkt umwandeln (ohne Dezimalumweg)
10. **Subnetzmaske** – CIDR-Präfixe in dotted-decimal Subnetzmasken übersetzen
11. **Aggregation** – Netze per Route Summarization zusammenfassen
12. **Ports** – Dienste, Portnummern und Protokolle korrekt zuordnen
13. **OSI-Modell** – Schichten, Aufgaben und Zuordnungen trainieren
14. **Kabel** – passende Kabeltypen anhand von Strecke, Geschwindigkeit und Umgebung wählen
15. **Linux** – Linux-Befehle und typische Admin-Kommandos üben
16. **Cloud** – Cloud-Computing-Konzepte, Provider-Modelle und Sicherheitsgrundlagen wiederholen
17. **Handelskalkulation** – Vorwärts-, Rückwärts- und Differenzkalkulation Schritt für Schritt lösen
18. **Vorwärtskalkulation** – vom Listeneinkaufspreis zum Bruttoverkaufspreis
19. **Rückwärtskalkulation** – vom Bruttoverkaufspreis zurück zum Listeneinkaufspreis
20. **RAID-Rechner** – Kapazität und Ausfallsicherheit von RAID-Verbünden
21. **AP2 Netzwerkplanung** – Teilnetze, VLANs und Verkehrsregeln
22. **AP2 Datenbankentwurf & SQL** – Modellierung und ausführbare SQL-Aufgaben
23. **AP2 Projektplanung** – Abhängigkeiten, Puffer und Verzögerungen
24. **AP2 Algorithmen** – Ablauf und Grenzfälle nachvollziehen
25. **AP2 Fehlersuche** – DNS-Evidenz, Korrektur und Verifikation
26. **AP2 Wirtschaftlichkeit** – IT-Kosten über einen festen Zeitraum und die Monatsgrenze vergleichen
27. **AP2 Datensicherung** – RPO/RTO und vollständige Wiederherstellungsketten
28. **AP2-Trainingslauf** – Wirtschaftlichkeit, Fehlersuche und Datensicherung mit gemeinsamer Auswertung
29. **AP2 Berechtigungen** – effektive Gruppenrechte, begrenzte Korrektur und geplante Kontrolle
30. **SQL** – KI-generierte SQL-Aufgaben lokal ausführen und validieren **(nur nach Anmeldung)**

## UI & Lernerlebnis

- **Desktop**: kartenbasierte Modulübersicht mit schneller Themenauswahl
- **Mobile**: kompakte Grid-Navigation für schnelles Üben unterwegs
- **Visual Style**: dunkles Cyber-/Tech-Theme mit klarer Zustandsanzeige
- **Direkte Nutzung**: über die Live-URL sofort testbar

Aktuell liegen im Repository keine gepflegten Produkt-Screenshots. Die **Live-Demo** ist daher die verlässlichste Vorschau auf den aktuellen UI-Stand.

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **Animationen**: Framer Motion
- **Icons**: Lucide React
- **Persistenz / Auth**: Supabase (PostgreSQL)
- **SQL-Sandbox**: PGlite
- **KI für SQL-Übungen**: Groq über AI SDK
- **Testing**: Vitest + Testing Library
- **Deployment**: Vercel

## Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/SweetSophia/ihk-study-trainer.git
cd ihk-study-trainer

# Dependencies installieren
npm ci

# Development Server starten
npm run dev
```

### Optionale Environment-Variablen (`.env.local`)

```bash
# Für Supabase-gestützte Anmeldung und Fortschritts-Speicherung
NEXT_PUBLIC_SUPABASE_URL=deine_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_supabase_key

# Für das SQL-Modul (KI-Generierung der Aufgaben)
GROQ_API_KEY=dein_groq_api_key

# Rate-Limit für die SQL Server Action (empfohlen in Produktion).
# Ohne diese Vars läuft ein In-Memory-Limiter, der pro Vercel-Instance
# getrennt zählt — also nicht multi-instance-sicher.
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=dein_upstash_token

# Pepper fürs HMAC des accessHash vor dem Upstash-Identifer. Ohne diesen
# würde der Hash (und damit das Login-Credential) roh im Upstash-Keyspace
# und im Analytics-Dashboard landen. 32+ Bytes zufälliges base64 reichen.
# Rotation invalidiert nur die Rate-Limit-Buckets, NICHT die User-Accounts.
# Für die Rate-Limit-Prüfung in Production erforderlich.
RATE_LIMIT_PEPPER=hier_den_generierten_zufallswert_eintragen
```

Den Pepper separat mit `openssl rand -base64 32` erzeugen und den ausgegebenen Wert in `.env.local` eintragen. Shell-Ausdrücke werden in dieser Datei nicht als Befehle ausgeführt.

### Hinweise zur lokalen Nutzung

- **Ohne Supabase-Konfiguration** nutzt die App lokale Fallback-Speicherung für Fortschritt/Anmeldung. Neuer Fortschritt wird pro Account-ID getrennt gespeichert; Lesen und Schreiben benötigen HTTPS bzw. localhost (Web Crypto für den Account-Schlüssel); parallele Schreibzugriffe werden zusätzlich mit [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) koordiniert. Ohne diese API oder bei Speicherfehlern wird kein ungesicherter Schreibversuch verwendet; die App zeigt eine Fehlermeldung.
- Der alte lokale Schlüssel `ihk_progress` bleibt unverändert und keinem Account zugeordnet. Er wird weder automatisch übernommen noch gelöscht; neue Account-Zähler beginnen getrennt. Das betrifft nur den lokalen Fallback, nicht die Supabase-Speicherung.
- **Ohne `GROQ_API_KEY`** kann das separate SQL-Modul keine KI-Aufgaben erzeugen. Die acht festen AP2-Szenarien einschließlich ihrer SQL-Prüfungen benötigen diesen Schlüssel nicht.
- Die KI-Server-Action prüft Account-IDs über Supabase; lokaler Fallback allein ersetzt diese Prüfung nicht. Für KI-SQL sind daher auch eine eingerichtete Supabase-Datenbank und eine dort gültige Account-ID nötig.
- **Ohne Upstash-Env-Vars** läuft der Rate-Limiter In-Memory (nur für lokales Dev praktikabel; auf Vercel ist er dann nicht multi-instance-sicher und es erscheint eine Warnung im Log).
- **Ohne `RATE_LIMIT_PEPPER`** wirft der Rate-Limiter in Production einen Fehler, sobald eine SQL-Anfrage die Rate-Limit-Prüfung erreicht; im Dev wird `dev:<hash>` als Identifier verwendet (kollidiert nie mit Production-HMACs).
- Für Produktionsbetrieb sollten Supabase, Upstash und der Pepper korrekt eingerichtet sein.

## Datenbank-Setup

Für eine neue Supabase-Instanz enthält `database/schema.sql` die Tabellen und sechs `SECURITY DEFINER`-RPC-Funktionen. Row Level Security wird auf allen drei Tabellen aktiviert; separate Policies (`CREATE POLICY`) werden nicht angelegt. Die App greift über die RPC-Funktionen zu; direkter Tabellenzugriff ist für die normalen Clientrollen ohne Policies standardmäßig gesperrt. Das Schema nicht ungeprüft erneut auf eine bereits eingerichtete Datenbank anwenden. Die Tabellen sind:

- `users` – Benutzer mit `access_hash`
- `progress` – Fortschritt pro Modul
- `question_history` – Verlauf beantworteter Fragen

## Verifikation

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

Die AP2-Erweiterungen wurden mit Unit-/Komponententests, Seitenintegration sowie Desktop-/Mobile-Prüfungen eines lokalen Produktions-Builds geprüft. Das bestätigt keine durchgängige Prüfung der Live-Account-Persistenz; diese bleibt separat zu verifizieren. Browser-Fallback und Supabase-Speicherung sind unterschiedliche Betriebsarten.

## Projektstruktur

```text
├── database/
│   └── schema.sql                 # Supabase Schema
├── src/
│   ├── app/
│   │   ├── actions/               # Server Actions (z. B. SQL-Generierung)
│   │   ├── components/            # React Components
│   │   ├── lib/
│   │   │   ├── generators/        # Generatoren für Einzelaufgaben
│   │   │   ├── answerValidation.ts # Strukturierte Antwortvalidierung
│   │   │   ├── modules.ts          # Modulkatalog
│   │   │   ├── changelog.ts        # „Was ist neu?“
│   │   │   ├── databaseWorkerClient.ts # AP2-SQL-Prüfungen im Worker
│   │   │   ├── auth.ts            # Authentifizierung + Fortschritt
│   │   │   ├── moduleIds.ts       # Legacy/kanonische Modul-IDs
│   │   │   └── supabase.ts        # Supabase Client
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript Interfaces
│   │   ├── page.tsx               # Hauptseite
│   │   └── layout.tsx
│   └── ...
└── package.json
```

## Deployment

Vercel erstellt für Pull Requests eine Vorschau und nach Änderungen auf `main` automatisch das Produktions-Deployment. Änderungen über einen geprüften Pull Request integrieren; Vorschau und Produktionsstatus getrennt kontrollieren. Die Bereitstellung ersetzt keine Prüfung der externen Dienste oder der Live-Persistenz.

## Lizenz

MIT License - Feel free to use and modify!

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/SweetSophia/ihk-study-trainer?utm_source=oss&utm_medium=github&utm_campaign=SweetSophia%2Fihk-study-trainer&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
