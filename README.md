# IHK Study Trainer

Interaktiver Lernassistent für die IHK-Prüfung zum **Fachinformatiker Systemintegration**.

Die App bündelt klassische FiSi-Rechenthemen, Netzwerktechnik, Linux- und Cloud-Grundlagen, kaufmännische Kalkulation sowie einen SQL-Trainer in einer Oberfläche mit Schritt-für-Schritt-Lösungen und Fortschritts-Tracking.

🔗 **Live URL**: https://ihk-study-trainer.vercel.app

> Hinweis: Das **SQL-Modul** ist nur für angemeldete Nutzer sichtbar und nutzbar.

## Highlights

- **18 Lernmodule** für typische IHK-Themen
- **Dynamisch generierte Aufgaben** statt statischer Fragenlisten
- **Schritt-für-Schritt-Lösungen** für Rechen- und Verständnisaufgaben
- **Fortschritts-Tracking pro Modul** inklusive Genauigkeit und Lern-Streaks
- **"Fehler üben"-Modus**, um gezielt schwache Themen zu wiederholen
- **Hash-basierte Anmeldung** ohne E-Mail/Passwort-Flow
- **Mobile-first UI** mit Dark Mode und klarer Karten-Navigation
- **SQL-Training mit KI-generierten Aufgaben** und lokaler Ausführung in einer PGlite-Sandbox

## Neuere Module & Erweiterungen

Diese Module wurden in den letzten Ausbauschritten ergänzt bzw. deutlich erweitert:

- **Bild-Transfer** – kombiniert Bildgrößen- und Übertragungszeit-Aufgaben in einem IHK-typischen Rechenweg
- **Linux** – trainiert Befehle als *Befehl → Beschreibung* und *Beschreibung → Befehl*
- **Cloud** – deckt Service-Modelle, Deployment-Modelle, Security, Networking und moderne Architektur ab
- **Handelskalkulation** – enthält Vorwärts-, Rückwärts- und Differenzkalkulation
- **SQL** – erzeugt variable SQL-Übungen per KI und prüft Lösungen lokal gegen eine temporäre PostgreSQL-kompatible Datenbank

## Lernmodule

### 18 Lernmodule (17 direkt verfügbar + 1 Auth-only)

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
18. **SQL** – KI-generierte SQL-Aufgaben lokal ausführen und validieren **(nur nach Anmeldung)**

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
npm install

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
# Pflicht in Production (sonst startet der Server-Action-Helper nicht).
RATE_LIMIT_PEPPER=$(openssl rand -base64 32)
```

### Hinweise zur lokalen Nutzung

- **Ohne Supabase-Konfiguration** nutzt die App lokale Fallback-Speicherung für Fortschritt/Anmeldung.
- **Ohne `GROQ_API_KEY`** ist das SQL-Modul nicht funktionsfähig.
- **Ohne Upstash-Env-Vars** läuft der Rate-Limiter In-Memory (nur für lokales Dev praktikabel; auf Vercel ist er dann nicht multi-instance-sicher und es erscheint eine Warnung im Log).
- **Ohne `RATE_LIMIT_PEPPER`** wirft der Rate-Limiter in Production einen Fehler beim ersten Request; im Dev wird `dev:<hash>` als Identifier verwendet (kollidiert nie mit Production-HMACs).
- Für Produktionsbetrieb sollten Supabase, Upstash und der Pepper korrekt eingerichtet sein.

## Datenbank-Setup

Die Datei `database/schema.sql` enthält die nötigen Tabellen für die Supabase-gestützte Variante:

- `users` – Benutzer mit `access_hash`
- `progress` – Fortschritt pro Modul
- `question_history` – Verlauf beantworteter Fragen

## Projektstruktur

```text
├── database/
│   └── schema.sql                 # Supabase Schema
├── src/
│   ├── app/
│   │   ├── actions/               # Server Actions (z. B. SQL-Generierung)
│   │   ├── components/            # React Components
│   │   ├── lib/
│   │   │   ├── generators/        # 17 Fragen-Generatoren
│   │   │   ├── answerValidation.ts# Strukturierte Antwortvalidierung
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

Automatisches Deployment erfolgt bei jedem Push auf `main`.

```bash
git add .
git commit -m "Update README"
git push origin main
```

## Lizenz

MIT License - Feel free to use and modify!

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/SweetSophia/ihk-study-trainer?utm_source=oss&utm_medium=github&utm_campaign=SweetSophia%2Fihk-study-trainer&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
