# IHK Study Trainer

Interaktiver Lernassistent für die IHK-Prüfung zum **Fachinformatiker Systemintegration**.

🔗 **Live URL**: https://ihk-study-trainer.vercel.app

## Features

### 17 Lernmodule
1. **Übertragungszeit** - Dateitransfer bei gegebener Bandbreite berechnen
2. **Bildgröße** - Speicherbedarf von Bildern berechnen
3. **Bild-Transfer** - Kombinierte Bildgröße + Übertragungszeit berechnen
4. **Overhead** - Protokoll-Overhead berechnen
5. **Subnetting** - IP-Subnetze und Host-Bereiche berechnen
6. **Einheiten** - Byte-Einheiten umrechnen (MiB vs MB)
7. **Binär** - Binär/Dezimal Konvertierungen
8. **Hexadezimal** - Hex/Dezimal Konvertierungen
9. **Subnetzmaske** - CIDR zu dotted-decimal Maske
10. **Aggregation** - Route Summarization
11. **Ports** - Port-Nummern und Protokolle
12. **OSI-Modell** - Schichten und Zuordnungen
13. **Kabel** - Kabeltypen-Auswahl nach Szenario
14. **Linux** - Linux-Befehle (Befehl → Beschreibung oder Beschreibung → Befehl)
15. **Cloud** - Cloud Computing Konzepte und Services
16. **Handelskalkulation** - Vorwärts-/Rückwärts-/Differenzkalkulation
17. **SQL** - AI generierte SQL Aufgaben, geprüft in einer Live-Datenbank

### Features
- ✅ Zufällig generierte Übungsaufgaben pro Modul
- ✅ Schritt-für-Schritt Lösungen
- ✅ Fortschritts-Tracking pro Modul
- ✅ Genauigkeits-Statistiken
- ✅ Tägliche Lern-Streaks
- ✅ "Fehler üben" - Modus
- ✅ Hash-basierte Authentifizierung (keine Email nötig)
- ✅ Mobile-optimiertes Design
- ✅ Dark Mode (Cyber-Security Theme)

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/SweetSophia/ihk-study-trainer.git
cd ihk-study-trainer

# Dependencies installieren
npm install

# Environment Variablen (.env.local)
NEXT_PUBLIC_SUPABASE_URL=deine_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_supabase_key

# Dev Server starten
npm run dev
```

## Datenbank Setup

Die SQL-Datei `database/schema.sql` enthält alle nötigen Tabellen:

- `users` - Benutzer mit access_hash
- `progress` - Fortschritt pro Modul
- `question_history` - Fragen-Verlauf

## Projektstruktur

```
├── database/
│   └── schema.sql          # Supabase Schema
├── src/
│   ├── app/
│   │   ├── components/     # React Components
│   │   ├── lib/
│   │   │   ├── generators/ # 17 Fragen-Generatoren
│   │   │   ├── auth.ts     # Authentifizierung
│   │   │   └── supabase.ts # Supabase Client
│   │   ├── types/
│   │   │   └── index.ts    # TypeScript Interfaces
│   │   ├── page.tsx        # Hauptseite
│   │   └── layout.tsx
│   └── ...
└── package.json
```

## Deployment

Automatisches Deployment bei jedem Push auf `main`:

```bash
git add .
git commit -m "Update..."
git push origin main
```

## Lizenz

MIT License - Feel free to use and modify!  
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/SweetSophia/ihk-study-trainer?utm_source=oss&utm_medium=github&utm_campaign=SweetSophia%2Fihk-study-trainer&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
