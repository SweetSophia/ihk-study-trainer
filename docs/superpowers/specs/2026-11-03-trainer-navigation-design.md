# Trainer-Navigation und Darstellung — Entwurf A

**Status:** Design am 03.11.2026 um 08:30 UTC freigegeben; Umsetzung separat im zugehörigen Plan. Basis: Main `c9e79907ececcbb2999e2910e85a624ff5d0686a`, am 03.11.2026 erneut geprüft. Alle nachfolgend konkretisierten Details sind begründete Gestaltungsvorschläge, keine zusätzlichen Nutzeranforderungen.

## Ziel und Auswahl

Die laufende Übung steht im Mittelpunkt. Fünf aufklappbare Themen ersetzen die vollständige Wand aus 29 Gast-/30 angemeldeten Moduleinträgen. Höchstens zwei Navigationsebenen: **Thema → Modul**. Der AP2-Trainingslauf bleibt ein eigener, sichtbarer Einstieg; AP2-Szenarien stehen mit Kennzeichen bei ihrem Fachthema.

Der Nutzer hat **A „Fokus & Themen“** gewählt. B „Themen entdecken“ mit großen Themenkarten wäre gut für einen Katalogüberblick, beansprucht aber mehr Platz vor der eigentlichen Übung. A passt besser zum wiederholten Lernen und zur mobilen Aufgabenansicht. Es gibt keine zusätzliche Themen-Startseite und keine dritte Untermenüebene.

Bildreferenz: `mockup-a-fokus-und-themen.png`, Library `libfile_36a70f423b488191a6d19d54a7a808c2`. Die Datei ließ sich in dieser Ausführungsumgebung nicht herunterladen; kein Pixelabgleich. Grundlage sind die ausgewählte Richtung und ihre ausführliche Beschreibung. Das Bild ist ohnehin keine pixelgenaue Spezifikation. Doppelte „System“-Beschriftungen, Beispielzähler wie „3 von 10“ und erfundene Lernmechaniken werden nicht übernommen.

## Themen und bestehende Identitäten

| Thema | Vorhandene Module |
|---|---|
| Rechnen & Zahlensysteme | Übertragungszeit, Bildgröße, Bild-Transfer, Overhead, Einheiten, Binär, Hexadezimal, Hex/Binär |
| Netzwerke | Subnetting, Subnetzmaske, Aggregation, Ports, OSI-Modell, Kabel, AP2 Netzwerkplanung, AP2 Fehlersuche |
| Systeme & Sicherheit | Linux, Cloud, RAID-Rechner, AP2 Berechtigungen, AP2 Datensicherung |
| Daten & Algorithmen | SQL, AP2 Datenbankentwurf & SQL, AP2 Algorithmen |
| Wirtschaft & Projekt | Vorwärtskalkulation, Rückwärtskalkulation, Differenzkalkulation, AP2 Wirtschaftlichkeit, AP2 Projektplanung |

Jedes aktive Modul kommt genau einmal vor; der Trainingslauf zusätzlich als eigener Einstieg. Sichtbare Anzahlen zählen **Module**, keine behauptete Anzahl von Aufgaben. Namen/Icons kommen weiter aus der kanonischen Registrierung. Die Gruppenzuordnung ist reine Darstellungsmetadaten: keine neuen Fortschritts-IDs und keine Umbuchung. Gemischte historische Kalkulationsdaten bleiben ausschließlich im bestehenden Altbestand sichtbar. SQL bleibt nur nach Anmeldung verfügbar; die AP2-Datenbankaufgabe und übrige Gastangebote bleiben zugänglich.

## Desktop und Mobil

**Ab 1024 px:** kompakte linke Navigation, vorgeschlagen ca. 260 px breit, daneben ein flexibler Arbeitsbereich; Gesamtrahmen maximal ca. 1440 px. Links: vorhandener kompakter Fortschritt mit aufklappbaren Details, Trainingslauf-Einstieg, fünf Themenbuttons und kurze Modulzeilen statt großer Kacheln. Höchstens ein Thema geöffnet; anfangs keines, bei aktiver Aufgabe zunächst deren Thema. Andere Themen dürfen geöffnet werden, ohne die Aufgabe zu wechseln. Der aktive Themenbutton bleibt mit „Aktiv“ erkennbar, auch wenn geschlossen; der aktuelle Themen-/Modulpfad steht zusätzlich am Arbeitsbereich. Lange Namen umbrechen. Sidebar bei Bedarf innerhalb der Fensterhöhe scrollbar; keine Bedienelemente unter dem Kopfbereich verstecken.

**Unter 1024 px:** volle Aufgabenbreite. Oberhalb steht ein geschlossener Button **„Aufgabe wechseln“** mit aktuellem Thema und vollständigem Modulnamen; ohne Auswahl „Thema und Aufgabe wählen“. Er öffnet die gleiche zweistufige Auswahl als Bereich im normalen Seitenfluss, nicht als überlagerndes Menü. Vorgeschlagene maximale Panelhöhe: 60% der verfügbaren Fensterhöhe mit eigener Scrollmöglichkeit. Nach Modulwahl klappt er zu. Keine schwebende Navigation über Antwortfeldern, Tastatur oder Prüfbuttons. Es bleibt eine einzige Arbeitsfläche; responsive Darstellung dupliziert keine Trainer.

Der vorhandene angemeldete Fortschritt erhält mobil unter dem Aufgabenwechsler einen kompakten, zunächst geschlossenen Bereich „Fortschritt“. Erst Öffnen zeigt vorhandene Kennzahlen, Details und „Fehler üben“; keine neue Statistik und keine große Übersicht vor jeder Aufgabe. Offen-/Geschlossen-Zustände der Themen und mobilen Auswahl bleiben reine Sitzungszustände, nicht zusätzlich gespeicherte Präferenzen.

**Vorgeschlagene Interaktionsentscheidungen:** Aufklappen/Schließen und Farbwechsel erzeugen keine Aufgabe, unmounten keinen Trainer und buchen keinen Versuch. Der aktive Moduleintrag führt zurück zur bestehenden Aufgabe, statt sie erneut zu erzeugen — eine bewusste Verbesserung gegenüber dem heutigen erneuten Generieren beim Klick. Neue Fragen/Überspringen/Neuer Trainingslauf bleiben die vorhandenen ausdrücklichen Aktionen. Ein tatsächlicher Wechsel zu einem anderen Modul verwendet die bisherigen Reset-/Abbruchregeln; keine neue allgemeine Entwurfsspeicherung.

## Tastatur, Fokus und Sitzungsschutz

Gruppen sind echte Disclosure-Buttons mit `aria-expanded`/`aria-controls`, Module eine Liste echter Auswahlbuttons mit eindeutigem aktuellem Zustand und sichtbarer Markierung zusätzlich zur Farbe. Keine komplexe Treeview. Verdeckte Navigation ist weder fokussierbar noch für Leser doppelt vorhanden. Bedienziele werden möglichst mindestens 44 px hoch gestaltet.

Beim mobilen Öffnen bleibt Fokus zunächst auf dem Auslöser; Tab erreicht den geöffneten Inhalt. Schließen oder Escape **innerhalb der Navigation** bringt Fokus zum Auslöser zurück; keine globalen Escape-Kürzel für Aufgabenfelder/SQL-Editoren. Bei Modulwahl Fokus zur sichtbaren Aufgabenüberschrift, mit Abstand zum bestehenden Sticky-Header. Das vorhandene Eingabe-Autofokusverhalten muss damit koordiniert werden: „Nächste Frage“ darf weiter das erste Feld fokussieren, die Navigation darf die Überschriftenfokussierung nicht sofort überschreiben. Farbwechsel behält Fokus am Darstellungswähler. Beim Breakpoint-Wechsel geht Fokus aus einer verschwindenden Navigation in die entsprechende sichtbare Navigation, nicht ins Dokument-Nirgendwo.

Der Trainingslauf erhält Eingaben nur **innerhalb seines Moduls**. Kleinster sicherer Schutz: Solange er aktiv ist, verlangt jeder echte interne Modulwechsel eine Bestätigung — auch ohne zusätzliche Dirty-Erfassung. Das gilt zentral für Modulauswahl, Trainingslauf-/Themenaktionen und „Fehler üben“, nicht für seine internen drei Aufgaben/Auswertung. Kein neuer Autosave und kein vollständiges Mounten aller Trainer.

Vorgeschlagene Inline-Bestätigung nach dem bestehenden Reset-Muster: **„Trainingslauf verlassen? Sitzungseingaben und Auswertung gehen verloren. Gespeicherter Themenfortschritt bleibt erhalten.“** Dazu Zielmodul, „Weiterarbeiten“ (initial fokussiert) und „Trainingslauf verlassen“. Erst Bestätigen führt den Wechsel aus. Abbrechen/Navigation schließen/Escape verwirft nur die Wechselabsicht, erhält den Lauf und bringt Fokus sinnvoll zurück. Eine andere Modulwahl ersetzt lediglich das klar benannte ausstehende Ziel. Keine blockierende neue Modalbibliothek.

Neuladen, Tab-Schließen und bestehende Anmelde-/Kontowechsel bleiben außerhalb dieses Navigationsschutzes und können den Lauf weiter zurücksetzen. Die vorhandene Warnung bleibt sichtbar; es wird keine geräteübergreifende oder sitzungsübergreifende Fortsetzung versprochen. Anmeldung/Abmeldung wird nicht durch neue Navigationsbestätigungen blockiert. Bereits gespeicherter Fortschritt bleibt unberührt.

## Hell, Dunkel und Typografie

Ein beschrifteter Darstellungswähler im Kopfbereich: **System / Hell / Dunkel**. Standard System; nur diese Präferenz lokal unter einem neuen, getrennten Schlüssel speichern (Vorschlag `ihk_theme_preference`). Keine Konto-/Fortschrittsdaten oder Synchronisationsversprechen. Ungültiger/fehlender Wert bedeutet System; bei blockiertem Speicher funktioniert die Wahl für die aktuelle Sitzung. Betriebssystemwechsel wirkt nur bei System. Native Formularfarben über `color-scheme` passend setzen.

Eine kleine frühe Darstellungsauswahl und CSS-Systemfallback verhindern unnötiges Aufblitzen der falschen Palette, ohne die Seite bis zur Hydration zu verstecken. Bestehende CSP/Sicherheitsregeln bleiben unverändert; kein neuer Dienst oder Theme-Paket. React/Next.js, Tailwind 4, Lucide und vorhandene Bewegungsfunktionen reichen. Erscheinungswahl ändert CSS/Tokens, keine Komponenten-Keys, Fragen, Worker-Ausführungen oder Bewertungszustände.

Vorgeschlagene Ausgangspalette, vor Freigabe der Umsetzung in allen Zuständen zu prüfen:

| Semantische Rolle | Hell | Dunkel |
|---|---|---|
| Hintergrund | warmes Off-White `#F7F8F5` | tiefes Blaugrau `#101A24` |
| Oberfläche | `#FFFFFF` | `#172733` |
| Text / Sekundärtext | `#172D34` / `#4C626B` | `#E7EFF2` / `#B1C4CC` |
| Primäraktion / Text darauf | Petrol `#0F766E` / Weiß | Teal `#63D8CB` / `#102A2C` |
| Eingabegrenze / Fokus | `#72858B` / `#0F766E` | `#78929E` / `#63D8CB` |

Gemeinsame Tokens für Hintergrund, Oberfläche/gedämpfte Fläche, Text, Grenze, Aktion, Fokus, Auswahl, Erfolg, Warnung und Fehler; semantische Zustände zusätzlich durch Text/Icon. Keine globale Farbinvertierung. Schriften: vorhandenes Geist für Oberfläche und Fließtext, Geist Mono für passende Rechnungen/Code; keine zusätzliche Schriftabhängigkeit. Dokument korrekt `lang="de"`, verständliche deutsche Labels. Zurückhaltende Animationen, reduzierte Bewegung respektieren.

**Vollständiger Umfang:** Header/Seite/Footer und Modulauswahl; Fortschrittsübersicht und AuthModal; StudyCard mit allen Antwort-, Auswahl-, Lösungs-, Hinweis- und Statuszuständen; LinuxTerminal, SQL-Editor, DragOrderExercise, Subnetz-/RAID-Darstellungen einschließlich SVG-/Legendenfarben; alle acht fachlichen AP2-Trainer und Trainingslauf/Auswertung/Resetbestätigung. Keine vergessenen dunklen Formulare oder Modals im Hellmodus. Geprüfte/deaktivierte Antworten bleiben gut lesbar; Tabellen und Code erhalten lokale Überlaufbehandlung. Bestehende Semantik, kurze Live-Statusmeldungen und getrennte ausführliche Hinweise bleiben erhalten.

## Grenzen und Abnahme

Unverändert bleiben Modul-/Speicher-IDs, Altbestand, Generatoren, Cent-Rundung/5%-Toleranz/Nullwert-Regel, erste Wertungen, Lösungsoffenlegung, Fortschrittsbuchungen, SQL-Anmeldegrenze, Worker-Timeout/Abbruch und AP2-Inhalte. Keine neuen Aufgaben, Statistik-/Streakmechanik, Konten, Bibliotheken, Datenbank-/Backend-/Sicherheitsänderungen oder neue Routen erforderlich. PR #58 bleibt gehalten.

Vor Abschluss einer späteren Umsetzung prüfen:
- Vollständige, eindeutige Katalogzuordnung; Gast29/angemeldet30 Einträge; SQL-Grenze und drei reine Kalkulationsmodule erhalten.
- Gruppen öffnen/schließen, aktive Aufgabe erneut wählen, Theme-/Systemwechsel und Responsive-Wechsel: Frage-ID, Antworten, Lösungen, Rubrik, Erstwertungen und Fortschrittsaufrufe unverändert; Arbeitsfläche nicht neu gemountet.
- Trainingslauf: interne Wechsel bleiben erhalten; jeder externe Modulweg bestätigt Verlust; Abbrechen erhält alle Sitzungseingaben, Bestätigen resettiert nur wie bisher und bucht keinen Versuch. Keine neue Speicherzusage.
- Tastatur/Fokus, Escape, lange Labels und Header-Abstände bei 320/390/768/1024/1440 px, direkt beiderseits des Breakpoints, Zoom und mobiler Tastatur; keine verdeckten Aktionen oder horizontale Seitenscrollbar. Breite Tabellen dürfen lokal scrollen.
- Alle genannten Komponenten/Zustände in beiden Paletten, auch Fehler, deaktivierte Werte, SQL, Diagramme und Accountdialog. Textkontrast mindestens 4,5:1 (große Schrift 3:1), erforderliche Kontroll-/Zustandsmerkmale 3:1 gegen angrenzende Farben; Fokus klar sichtbar. [W3C Textkontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Nicht-Text-Kontrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Die vorgeschlagenen Grundpaare wurden rechnerisch geprüft, nicht die vollständige UI; das ist noch kein Konformitätsnachweis.
- Theme: gespeicherte/systemabhängige Wahl, OS-Wechsel, Reload, ungültiger/gesperrter Speicher, erster Paint und Hydration unter bestehender Produktions-CSP. Fachliche Regressionen, bestehende Tests, Typen/Lint/Build und Browserprüfungen; echte Screenreaderprüfungen getrennt ausweisen.

## Reihenfolge und Freigabe

Designfolge, kein ausführbarer Implementierungsplan: (1) Gruppenzuordnung und Farb-/Typografiegrundlagen, (2) gemeinsame responsive Navigation mit Fokus und Lauf-Verlassenschutz, (3) vollständige Umstellung aller Lern-/Dialog-/Diagrammflächen, (4) integrierte funktionale und visuelle Abnahme. Ein Hell-/Dunkelschalter gilt erst mit der vollständigen Flächenmigration als fertig.

Konsequente Vorschläge zur Freigabe sind insbesondere: aktiven Eintrag nicht neu erzeugen; mobile Inline-Auswahl statt Overlay; konservative Bestätigung beim Verlassen eines Trainingslaufs. Innerhalb dieses Vorschlags besteht keine zusätzliche fachliche Entscheidungssperre. Erst nach Designfreigabe folgen formale Implementierungsplanung und Produktänderungen. Bei Abschluss der Designvorbereitung bestanden weder Commit noch Veröffentlichung, PR, Merge oder Deployment.

### Quellen der Bestandsaufnahme

`src/app/lib/modules.ts`, `src/app/components/ThemeSelector.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/components/TrainingRun.tsx`, `src/app/components/ProgressDashboard.tsx`, `next.config.ts`. Bei der Design-Bestandsaufnahme wurde die Codebasis verifiziert; damals wurden keine Produktdateien verändert und keine Tests/Builds ausgeführt. Bildmaterialisierung scheiterte mit „download failed“, Zielbild nicht angelegt; kein anderer Zugriffsweg versucht.

Unabhängige Builder-Prüfung am 03.11.2026: vollständigen Entwurf auf planungsrelevante Unklarheiten geprüft; Ergebnis „nothing important left“. Anschließend mobile Platzierung des vorhandenen Fortschritts und rein sitzungsbezogene Aufklappzustände ausdrücklich präzisiert. Kein Produktcode und kein formaler Implementierungsplan erstellt.
