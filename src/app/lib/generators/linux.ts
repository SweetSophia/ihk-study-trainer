import { AnswerInputConfig } from '../../types';

/**
 * Linux/Bash Commands Generator for the IHK Study Trainer.
 *
 * Supports two question directions:
 *  - commandToDescription: Show a command → user picks the correct description (dropdown)
 *  - descriptionToCommand: Show a description → user types the command (text input)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LinuxQuestion {
  theme: string;
  questionText: string;
  command: string;
  example?: string;
  direction: 'commandToDescription' | 'descriptionToCommand';
  expectedAnswers: { answer: string };
  answerInputs?: AnswerInputConfig[];
  solutionSteps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// ---------------------------------------------------------------------------
// Command Database — one entry per command with rich metadata
// ---------------------------------------------------------------------------

interface CommandEntry {
  command: string;
  /** Short German description used as the "correct" answer for commandToDescription */
  description: string;
  /** Longer explanation for solution steps */
  explanation: string;
  /** Example usage */
  example: string;
  /** Category name (German) */
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Alternative accepted command names (e.g. "vi" for "vim") */
  aliases?: string[];
}

const COMMAND_DATABASE: CommandEntry[] = [
  // ── File and Directory Management ──────────────────────────────────────
  {
    command: 'ls',
    description: 'Listet Dateien und Verzeichnisse in einem Verzeichnis auf',
    explanation:
      'ls (list) zeigt den Inhalt eines Verzeichnisses an. Mit -la werden versteckte Dateien und detaillierte Informationen (Berechtigungen, Besitzer, Größe, Datum) angezeigt.',
    example: 'ls -la /home/user',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'cd',
    description: 'Wechselt das aktuelle Arbeitsverzeichnis',
    explanation:
      'cd (change directory) ändert das aktuelle Verzeichnis. cd ohne Argumente wechselt ins Home-Verzeichnis, cd .. eine Ebene nach oben.',
    example: 'cd /var/log',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'pwd',
    description: 'Zeigt das aktuelle Arbeitsverzeichnis an',
    explanation:
      'pwd (print working directory) gibt den vollständigen Pfad des aktuellen Verzeichnisses aus.',
    example: 'pwd',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'mkdir',
    description: 'Erstellt ein neues Verzeichnis',
    explanation:
      'mkdir (make directory) erstellt Verzeichnisse. Mit -p werden auch Elternverzeichnisse angelegt, falls sie nicht existieren.',
    example: 'mkdir -p /tmp/test/unterordner',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'rm',
    description: 'Löscht Dateien oder Verzeichnisse',
    explanation:
      'rm (remove) löscht Dateien. Mit -r werden Verzeichnisse rekursiv gelöscht, -f erzwingt das Löschen ohne Nachfrage. Achtung: rm -rf / löscht das gesamte System!',
    example: 'rm -rf /tmp/old',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'cp',
    description: 'Kopiert Dateien oder Verzeichnisse',
    explanation:
      'cp (copy) kopiert Dateien. Mit -r werden Verzeichnisse rekursiv kopiert, -p erhält die Dateiattribute.',
    example: 'cp -r /home/user/docs /backup/',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'mv',
    description: 'Verschiebt oder benennt Dateien und Verzeichnisse um',
    explanation:
      'mv (move) verschiebt Dateien von A nach B. Wenn Quelle und Ziel im selben Verzeichnis liegen, wirkt mv als Umbenennung.',
    example: 'mv alt.txt neu.txt',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'touch',
    description: 'Erstellt eine leere Datei oder aktualisiert den Zeitstempel',
    explanation:
      'touch erstellt eine neue leere Datei, falls sie nicht existiert. Wenn die Datei bereits existiert, wird der Zugriffs- und Änderungszeitstempel aktualisiert.',
    example: 'touch neue_datei.txt',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'ln',
    description: 'Erstellt Hardlinks oder symbolische Links (Symlinks)',
    explanation:
      'ln erstellt Links zwischen Dateien. Mit -s wird ein symbolischer Link erstellt (ln -s Ziel Linkname). Ohne -s wird ein Hardlink erstellt.',
    example: 'ln -s /var/www/html /home/user/web',
    category: 'Datei- und Verzeichnisverwaltung',
    difficulty: 'medium',
  },

  // ── File Viewing and Editing ───────────────────────────────────────────
  {
    command: 'cat',
    description: 'Gibt den gesamten Inhalt einer Datei auf der Standardausgabe aus',
    explanation:
      'cat (concatenate) zeigt den gesamten Inhalt einer Datei an. Es kann auch mehrere Dateien verketten. Für große Dateien sind less oder more besser geeignet.',
    example: 'cat /etc/hostname',
    category: 'Dateibetrachtung und -bearbeitung',
    difficulty: 'easy',
  },
  {
    command: 'less',
    description: 'Zeigt Dateiinhalte seitenweise an (vor- und zurückblättern)',
    explanation:
      'less ist ein Pager, der große Dateien seitenweise anzeigt. Man kann mit Pfeiltasten vor und zurück scrollen. Mit q wird less beendet.',
    example: 'less /var/log/syslog',
    category: 'Dateibetrachtung und -bearbeitung',
    difficulty: 'easy',
  },
  {
    command: 'tail',
    description: 'Zeigt die letzten Zeilen einer Datei an',
    explanation:
      'tail zeigt standardmäßig die letzten 10 Zeilen einer Datei. Mit -n 20 werden 20 Zeilen angezeigt, mit -f wird die Datei in Echtzeit verfolgt (follow).',
    example: 'tail -f /var/log/syslog',
    category: 'Dateibetrachtung und -bearbeitung',
    difficulty: 'easy',
  },
  {
    command: 'head',
    description: 'Zeigt die ersten Zeilen einer Datei an',
    explanation:
      'head zeigt standardmäßig die ersten 10 Zeilen einer Datei. Mit -n 20 werden die ersten 20 Zeilen angezeigt.',
    example: 'head -n 20 /var/log/syslog',
    category: 'Dateibetrachtung und -bearbeitung',
    difficulty: 'easy',
  },
  {
    command: 'nano',
    description: 'Einfacher terminalbasierter Texteditor',
    explanation:
      'nano ist ein anfängerfreundlicher Texteditor im Terminal. Befehle werden unten angezeigt (Strg+O speichern, Strg+X beenden).',
    example: 'nano /etc/hosts',
    category: 'Dateibetrachtung und -bearbeitung',
    difficulty: 'easy',
  },
  {
    command: 'vim',
    description: 'Mächtiger terminalbasierter Texteditor (Vi Improved)',
    explanation:
      'vim (Vi IMproved) ist ein leistungsfähiger Texteditor mit Modal-Konzept: Normal-Modus (Navigation), Insert-Modus (Eingabe mit i), Command-Modus (:wq speichern/beenden). Alias: vi.',
    example: 'vim /etc/fstab',
    category: 'Dateibetrachtung und -bearbeitung',
    difficulty: 'medium',
    aliases: ['vi'],
  },

  // ── System Information and Resource Monitoring ─────────────────────────
  {
    command: 'top',
    description: 'Zeigt aktive Prozesse und Systemressourcen in Echtzeit an',
    explanation:
      'top zeigt eine dynamische Echtzeitansicht der laufenden Prozesse, CPU-Auslastung, Speicherverbrauch und Swap-Nutzung. Mit q wird es beendet.',
    example: 'top',
    category: 'Systeminformationen und Ressourcenüberwachung',
    difficulty: 'easy',
  },
  {
    command: 'htop',
    description: 'Verbesserte, interaktive Prozessanzeige mit Farbausgabe',
    explanation:
      'htop ist eine erweiterte Alternative zu top mit farbiger Ausgabe, Mausunterstützung und einer übersichtlicheren Darstellung von CPU-Kernen und Prozessbäumen.',
    example: 'htop',
    category: 'Systeminformationen und Ressourcenüberwachung',
    difficulty: 'easy',
  },
  {
    command: 'df',
    description: 'Zeigt den freien und belegten Speicherplatz der Dateisysteme an',
    explanation:
      'df (disk free) zeigt die Speicherplatznutzung aller eingehängten Dateisysteme. Mit -h wird die Ausgabe in lesbarer Form (KB, MB, GB) angezeigt.',
    example: 'df -h',
    category: 'Systeminformationen und Ressourcenüberwachung',
    difficulty: 'easy',
  },
  {
    command: 'du',
    description: 'Zeigt die Festplattennutzung von Dateien und Verzeichnissen an',
    explanation:
      'du (disk usage) zeigt den Speicherverbrauch von Dateien und Verzeichnissen. Mit -h lesbare Ausgabe, -s nur Gesamtsumme, -sh für eine einzelne Zusammenfassung.',
    example: 'du -sh /home/user',
    category: 'Systeminformationen und Ressourcenüberwachung',
    difficulty: 'easy',
  },
  {
    command: 'free',
    description: 'Zeigt den freien und belegten Arbeitsspeicher (RAM) an',
    explanation:
      'free zeigt die Speicherbelegung: insgesamt, benutzt, frei, geteilt, gepuffert und Cache. Mit -h in lesbarer Form.',
    example: 'free -h',
    category: 'Systeminformationen und Ressourcenüberwachung',
    difficulty: 'easy',
  },
  {
    command: 'uname',
    description: 'Zeigt Systeminformationen wie Kernel-Version und Architektur an',
    explanation:
      'uname (Unix name) zeigt Systeminformationen. Mit -a werden alle Informationen ausgegeben: Kernelname, Hostname, Kernel-Version, Architektur usw.',
    example: 'uname -a',
    category: 'Systeminformationen und Ressourcenüberwachung',
    difficulty: 'easy',
  },
  {
    command: 'uptime',
    description: 'Zeigt die Systemlaufzeit und die durchschnittliche Systemauslastung an',
    explanation:
      'uptime zeigt an, wie lange das System bereits läuft, wie viele Benutzer angemeldet sind und die Load-Average-Werte (1, 5 und 15 Minuten).',
    example: 'uptime',
    category: 'Systeminformationen und Ressourcenüberwachung',
    difficulty: 'easy',
  },

  // ── Process and Service Management ─────────────────────────────────────
  {
    command: 'ps',
    description: 'Zeigt Informationen über laufende Prozesse an',
    explanation:
      'ps (process status) zeigt Prozesse an. ps aux zeigt alle Prozesse mit detaillierten Informationen (Benutzer, PID, CPU, Speicher, Befehl).',
    example: 'ps aux | grep nginx',
    category: 'Prozess- und Dienstverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'kill',
    description: 'Sendet ein Signal an einen Prozess (standardmäßig SIGTERM)',
    explanation:
      'kill beendet Prozesse anhand ihrer PID. kill PID sendet SIGTERM (höflich), kill -9 PID sendet SIGKILL (erzwungen).',
    example: 'kill -9 12345',
    category: 'Prozess- und Dienstverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'killall',
    description: 'Beendet alle Prozesse mit einem bestimmten Namen',
    explanation:
      'killall sendet Signale an alle Prozesse, die einen bestimmten Namen tragen. killall nginx beendet z.B. alle nginx-Prozesse.',
    example: 'killall nginx',
    category: 'Prozess- und Dienstverwaltung',
    difficulty: 'medium',
  },
  {
    command: 'systemctl',
    description: 'Verwaltet Systemd-Dienste (starten, stoppen, Status abfragen)',
    explanation:
      'systemctl ist das zentrale Werkzeug zur Verwaltung von Systemd-Diensten. Wichtige Unterbefehle: start, stop, restart, status, enable, disable.',
    example: 'systemctl restart nginx',
    category: 'Prozess- und Dienstverwaltung',
    difficulty: 'medium',
  },
  {
    command: 'journalctl',
    description: 'Zeigt Systemprotokolle (Logs) des Systemd-Journals an',
    explanation:
      'journalctl zeigt Protokolle des systemd-Journals. Mit -u DIENST werden Logs eines bestimmten Dienstes gefiltert, -f folgt in Echtzeit.',
    example: 'journalctl -u nginx -f',
    category: 'Prozess- und Dienstverwaltung',
    difficulty: 'medium',
  },

  // ── Networking ─────────────────────────────────────────────────────────
  {
    command: 'ping',
    description: 'Prüft die Netzwerkverbindung zu einem Remote-Host',
    explanation:
      'ping sendet ICMP-Echo-Anfragen an einen Host und misst die Round-Trip-Zeit. Mit -c ANZAHL wird die Anzahl der Pakete begrenzt.',
    example: 'ping -c 4 google.de',
    category: 'Netzwerk',
    difficulty: 'easy',
  },
  {
    command: 'ip',
    description: 'Konfiguriert und zeigt Netzwerkschnittstellen und Routing an',
    explanation:
      'ip ist das moderne Nachfolgetool von ifconfig. ip addr show zeigt IP-Adressen, ip link show Netzwerkschnittstellen, ip route zeigt die Routing-Tabelle.',
    example: 'ip addr show',
    category: 'Netzwerk',
    difficulty: 'medium',
  },
  {
    command: 'ss',
    description: 'Zeigt Netzwerkverbindungen und offene Ports an',
    explanation:
      'ss (socket statistics) ist der moderne Ersatz für netstat. ss -tulpn zeigt alle TCP/UDP-Verbindungen mit Prozessinformationen.',
    example: 'ss -tulpn',
    category: 'Netzwerk',
    difficulty: 'medium',
  },
  {
    command: 'curl',
    description: 'Überträgt Daten von oder zu einem Server (HTTP, FTP usw.)',
    explanation:
      'curl (Client URL) ist ein vielseitiges Tool für Datenübertragungen. Es unterstützt HTTP, HTTPS, FTP und viele weitere Protokolle. -o speichert die Ausgabe, -I zeigt nur Header.',
    example: 'curl -I https://example.com',
    category: 'Netzwerk',
    difficulty: 'easy',
  },
  {
    command: 'wget',
    description: 'Lädt Dateien aus dem Internet herunter (non-interaktiv)',
    explanation:
      'wget (Web Get) lädt Dateien rekursiv von Webservern herunter. Es unterstützt Fortsetzen abgebrochener Downloads und Spiegeln von Websites.',
    example: 'wget https://example.com/file.tar.gz',
    category: 'Netzwerk',
    difficulty: 'easy',
  },
  {
    command: 'ssh',
    description: 'Stellt eine verschlüsselte Verbindung zu einem Remote-Host her',
    explanation:
      'ssh (Secure Shell) ermöglicht den sicheren Fernzugriff auf andere Rechner. Mit -p PORT kann ein abweichender Port angegeben werden.',
    example: 'ssh user@192.168.1.100',
    category: 'Netzwerk',
    difficulty: 'easy',
  },
  {
    command: 'scp',
    description: 'Kopiert Dateien sicher zwischen Hosts über SSH',
    explanation:
      'scp (Secure Copy) kopiert Dateien verschlüsselt zwischen lokalem und remote System. Mit -r werden Verzeichnisse rekursiv kopiert.',
    example: 'scp file.txt user@remote:/tmp/',
    category: 'Netzwerk',
    difficulty: 'medium',
  },

  // ── Search, Filter, and Data Manipulation ──────────────────────────────
  {
    command: 'grep',
    description: 'Sucht nach Textmustern in Dateien mittels regulärer Ausdrücke',
    explanation:
      'grep (Global Regular Expression Print) durchsucht Dateien nach Mustern. -i ignoriert Groß-/Kleinschreibung, -r sucht rekursiv, -n zeigt Zeilennummern.',
    example: 'grep -r "error" /var/log/',
    category: 'Suche, Filter und Datenmanipulation',
    difficulty: 'easy',
  },
  {
    command: 'find',
    description: 'Sucht Dateien und Verzeichnisse anhand verschiedener Kriterien',
    explanation:
      'find sucht Dateien nach Name, Typ, Größe, Datum und vielen weiteren Kriterien. -name nach Dateiname, -type f nur Dateien, -exec führt Befehle aus.',
    example: 'find /var -name "*.log" -mtime +7',
    category: 'Suche, Filter und Datenmanipulation',
    difficulty: 'medium',
  },
  {
    command: 'locate',
    description: 'Findet Dateien schnell anhand einer vorindizierten Datenbank',
    explanation:
      'locate sucht Dateien mithilfe einer vorab erstellten Datenbank (mit updatedb aktualisiert). Es ist deutlich schneller als find, aber nicht in Echtzeit.',
    example: 'locate nginx.conf',
    category: 'Suche, Filter und Datenmanipulation',
    difficulty: 'easy',
  },
  {
    command: 'awk',
    description: 'Verarbeitet und analysiert Textdaten spaltenweise',
    explanation:
      'awk ist eine mächtige Textverarbeitungssprache. Es teilt Zeilen in Felder auf und ermöglicht komplexe Transformationen. {print $1} gibt die erste Spalte aus.',
    example: "awk '{print $1, $3}' /etc/passwd",
    category: 'Suche, Filter und Datenmanipulation',
    difficulty: 'hard',
  },
  {
    command: 'sed',
    description: 'Stream-Editor zur textuellen Transformation von Datenströmen',
    explanation:
      'sed (Stream Editor) bearbeitet Text zeilenweise. Mit s/Suche/Ersetzen/g werden Texte ersetzt, -i ändert die Datei direkt.',
    example: "sed -i 's/alt/neu/g' datei.txt",
    category: 'Suche, Filter und Datenmanipulation',
    difficulty: 'hard',
  },

  // ── Permissions and Ownership ──────────────────────────────────────────
  {
    command: 'chmod',
    description: 'Ändert die Zugriffsrechte (Lesen, Schreiben, Ausführen) von Dateien',
    explanation:
      'chmod (change mode) ändert Dateiberechtigungen. Mit Oktalnotation (chmod 755 file) oder symbolisch (chmod u+x file). 4=lesen, 2=schreiben, 1=ausführen.',
    example: 'chmod 755 script.sh',
    category: 'Berechtigungen und Besitz',
    difficulty: 'medium',
  },
  {
    command: 'chown',
    description: 'Ändert den Besitzer und/oder die Gruppe einer Datei',
    explanation:
      'chown (change owner) ändert den Dateibesitzer. chown user:gruppe datei ändert Besitzer und Gruppe. Mit -R rekursiv.',
    example: 'chown -R www-data:www-data /var/www',
    category: 'Berechtigungen und Besitz',
    difficulty: 'medium',
  },
  {
    command: 'sudo',
    description: 'Führt einen Befehl mit Administratorrechten (root) aus',
    explanation:
      'sudo (superuser do) ermöglicht die Ausführung von Befehlen mit root-Rechten, ohne sich als root anzumelden. Die Berechtigungen werden in /etc/sudoers konfiguriert.',
    example: 'sudo apt update',
    category: 'Berechtigungen und Besitz',
    difficulty: 'easy',
  },
  {
    command: 'su',
    description: 'Wechselt den aktuellen Benutzer (standardmäßig zu root)',
    explanation:
      'su (switch user) wechselt die Benutzeridentität. su ohne Argumente wechselt zu root, su - username zu einem bestimmten Benutzer. su - lädt auch die Umgebung.',
    example: 'su - postgres',
    category: 'Berechtigungen und Besitz',
    difficulty: 'easy',
  },
  {
    command: 'passwd',
    description: 'Ändert das Passwort eines Benutzers',
    explanation:
      'passwd ändert das Passwort des aktuellen Benutzers. Als root kann man mit passwd BENUTZER das Passwort eines beliebigen Benutzers setzen.',
    example: 'passwd',
    category: 'Berechtigungen und Besitz',
    difficulty: 'easy',
  },

  // ── Archiving and Compression ──────────────────────────────────────────
  {
    command: 'tar',
    description: 'Erstellt oder entpackt Tar-Archive (oft mit gzip/bzip2 kombiniert)',
    explanation:
      'tar (tape archiver) erstellt oder extrahiert Archive. -c erstellen, -x extrahieren, -z gzip, -j bzip2, -v ausführlich, -f Dateiname. Beispiel: tar -czf archiv.tar.gz ordner/',
    example: 'tar -xzf backup.tar.gz',
    category: 'Archivierung und Komprimierung',
    difficulty: 'medium',
  },
  {
    command: 'zip',
    description: 'Erstellt ZIP-komprimierte Archive',
    explanation:
      'zip erstellt ZIP-Archive. Mit -r werden Verzeichnisse rekursiv hinzugefügt.',
    example: 'zip -r archiv.zip ordner/',
    category: 'Archivierung und Komprimierung',
    difficulty: 'easy',
  },
  {
    command: 'unzip',
    description: 'Entpackt ZIP-Archive',
    explanation:
      'unzip extrahiert ZIP-Archive. Mit -l wird der Inhalt aufgelistet, ohne ihn zu entpacken.',
    example: 'unzip archiv.zip -d /ziel/',
    category: 'Archivierung und Komprimierung',
    difficulty: 'easy',
  },
  {
    command: 'gzip',
    description: 'Komprimiert Dateien im gzip-Format (.gz)',
    explanation:
      'gzip komprimiert einzelne Dateien. Die Originaldatei wird durch die komprimierte Version ersetzt. Mit -d oder gunzip wird dekomprimiert, -k behält das Original.',
    example: 'gzip -k datei.txt',
    category: 'Archivierung und Komprimierung',
    difficulty: 'easy',
  },

  // ── User Management ────────────────────────────────────────────────────
  {
    command: 'useradd',
    description: 'Erstellt einen neuen Benutzeraccount',
    explanation:
      'useradd erstellt einen neuen Benutzer. Mit -m wird das Home-Verzeichnis erstellt, -s setzt die Shell, -G fügt zusätzliche Gruppen hinzu.',
    example: 'useradd -m -s /bin/bash neueruser',
    category: 'Benutzerverwaltung',
    difficulty: 'medium',
  },
  {
    command: 'userdel',
    description: 'Löscht einen Benutzeraccount',
    explanation:
      'userdel entfernt einen Benutzer. Mit -r wird auch das Home-Verzeichnis gelöscht.',
    example: 'userdel -r alteruser',
    category: 'Benutzerverwaltung',
    difficulty: 'medium',
  },
  {
    command: 'usermod',
    description: 'Ändert die Eigenschaften eines Benutzeraccounts',
    explanation:
      'usermod modifiziert Benutzerattribute. -aG fügt Gruppen hinzu, -s ändert die Shell, -L sperrt den Account, -U entsperrt ihn.',
    example: 'usermod -aG docker user',
    category: 'Benutzerverwaltung',
    difficulty: 'medium',
  },
  {
    command: 'groupadd',
    description: 'Erstellt eine neue Benutzergruppe',
    explanation:
      'groupadd erstellt eine neue Gruppe im System.',
    example: 'groupadd entwickler',
    category: 'Benutzerverwaltung',
    difficulty: 'medium',
  },
  {
    command: 'groupdel',
    description: 'Löscht eine Benutzergruppe',
    explanation:
      'groupdel entfernt eine bestehende Gruppe aus dem System.',
    example: 'groupdel altegruppe',
    category: 'Benutzerverwaltung',
    difficulty: 'medium',
  },
  {
    command: 'id',
    description: 'Zeigt die UID, GID und Gruppenzugehörigkeit eines Benutzers an',
    explanation:
      'id zeigt die Benutzer-ID (UID), Gruppen-ID (GID) und alle Gruppen, denen ein Benutzer angehört.',
    example: 'id username',
    category: 'Benutzerverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'who',
    description: 'Zeigt die aktuell angemeldeten Benutzer an',
    explanation:
      'who listet alle aktuell angemeldeten Benutzer mit Terminal, Login-Zeit und Remote-Host.',
    example: 'who',
    category: 'Benutzerverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'w',
    description: 'Zeigt angemeldete Benutzer und ihre aktuelle Aktivität an',
    explanation:
      'w zeigt detaillierte Informationen über angemeldete Benutzer: was sie gerade ausführen, seit wann sie angemeldet sind und die Systemauslastung.',
    example: 'w',
    category: 'Benutzerverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'last',
    description: 'Zeigt die Liste der letzten Benutzeranmeldungen an',
    explanation:
      'last zeigt die Historie der Benutzeranmeldungen, einschließlich Zeitpunkt und Dauer der Sitzung.',
    example: 'last -n 10',
    category: 'Benutzerverwaltung',
    difficulty: 'easy',
  },
  {
    command: 'lastlog',
    description: 'Zeigt den letzten Anmeldezeitpunkt aller Benutzer an',
    explanation:
      'lastlog zeigt für jeden Benutzer im System, wann er sich zuletzt angemeldet hat.',
    example: 'lastlog',
    category: 'Benutzerverwaltung',
    difficulty: 'easy',
  },

  // ── Package Management ─────────────────────────────────────────────────
  {
    command: 'apt',
    description: 'Paketverwaltung für Debian/Ubuntu (installieren, aktualisieren, entfernen)',
    explanation:
      'apt (Advanced Packaging Tool) ist die Paketverwaltung für Debian-basierte Systeme. apt update aktualisiert die Paketliste, apt install PAKET installiert Pakete, apt upgrade aktualisiert alle Pakete.',
    example: 'apt install nginx',
    category: 'Paketverwaltung',
    difficulty: 'easy',
    aliases: ['apt-get'],
  },
  {
    command: 'dnf',
    description: 'Paketverwaltung für RHEL/Fedora/CentOS (Nachfolger von yum)',
    explanation:
      'dnf (Dandified YUM) ist die Paketverwaltung für RPM-basierte Systeme (RHEL, Fedora, CentOS). dnf install PAKET installiert, dnf update aktualisiert.',
    example: 'dnf install httpd',
    category: 'Paketverwaltung',
    difficulty: 'medium',
    aliases: ['yum'],
  },
  {
    command: 'zypper',
    description: 'Paketverwaltung für SUSE/openSUSE',
    explanation:
      'zypper ist die Paketverwaltung für SUSE-Linux-Distributionen. zypper install PAKET installiert, zypper update aktualisiert alle Pakete.',
    example: 'zypper install nginx',
    category: 'Paketverwaltung',
    difficulty: 'medium',
  },
  {
    command: 'snap',
    description: 'Installiert und verwaltet containerisierte Snap-Pakete',
    explanation:
      'snap ist ein universelles Paketformat von Canonical. Snap-Pakete sind containerisiert und automatisch aktualisierend. snap install PAKET installiert ein Snap.',
    example: 'snap install code --classic',
    category: 'Paketverwaltung',
    difficulty: 'medium',
  },

  // ── Disk & Filesystem ──────────────────────────────────────────────────
  {
    command: 'mount',
    description: 'Hängt ein Dateisystem in die Verzeichnisstruktur ein',
    explanation:
      'mount bindet Dateisysteme (Festplatten, USB, Netzwerkfreigaben) in die Verzeichnisstruktur ein. Ohne Argumente werden alle eingehängten Dateisysteme angezeigt.',
    example: 'mount /dev/sdb1 /mnt/usb',
    category: 'Festplatte und Dateisystem',
    difficulty: 'medium',
  },
  {
    command: 'umount',
    description: 'Hängt ein Dateisystem aus der Verzeichnisstruktur aus',
    explanation:
      'umount (unmount) trennt ein eingehängtes Dateisystem sicher ab. Vor dem Abziehen von USB-Laufwerken sollte umount ausgeführt werden.',
    example: 'umount /mnt/usb',
    category: 'Festplatte und Dateisystem',
    difficulty: 'medium',
  },
  {
    command: 'lsblk',
    description: 'Listet alle Blockgeräte (Festplatten, Partitionen) auf',
    explanation:
      'lsblk (list block devices) zeigt alle verfügbaren Blockgeräte in einer Baumstruktur an, inklusive Partitionen und Größen.',
    example: 'lsblk -f',
    category: 'Festplatte und Dateisystem',
    difficulty: 'medium',
  },
  {
    command: 'fdisk',
    description: 'Verwaltet Festplattenpartitionen (anzeigen, erstellen, löschen)',
    explanation:
      'fdisk ist ein Tool zur Partitionierung von Festplatten. Mit -l werden Partitionen angezeigt, ohne Argumente startet der interaktive Modus.',
    example: 'fdisk -l',
    category: 'Festplatte und Dateisystem',
    difficulty: 'hard',
  },
  {
    command: 'mkfs',
    description: 'Erstellt ein Dateisystem auf einer Partition (Formatierung)',
    explanation:
      'mkfs (make filesystem) formatiert eine Partition mit einem Dateisystem. mkfs.ext4 /dev/sdb1 erstellt z.B. ein ext4-Dateisystem.',
    example: 'mkfs.ext4 /dev/sdb1',
    category: 'Festplatte und Dateisystem',
    difficulty: 'hard',
  },

  // ── SSH & Remote ───────────────────────────────────────────────────────
  {
    command: 'ssh-keygen',
    description: 'Erstellt SSH-Schlüsselpaare (Public/Private Key)',
    explanation:
      'ssh-keygen generiert RSA- oder Ed25519-Schlüsselpaare für die SSH-Authentifizierung. Mit -t ed25519 wird ein moderner Schlüsseltyp empfohlen.',
    example: 'ssh-keygen -t ed25519 -C "user@host"',
    category: 'SSH und Remote',
    difficulty: 'medium',
  },
  {
    command: 'ssh-copy-id',
    description: 'Kopiert den öffentlichen SSH-Schlüssel auf einen Remote-Host',
    explanation:
      'ssh-copy-id überträgt den öffentlichen Schlüssel auf den Zielhost, sodass künftig eine passwortfreie SSH-Authentifizierung möglich ist.',
    example: 'ssh-copy-id user@remote-host',
    category: 'SSH und Remote',
    difficulty: 'medium',
  },
  {
    command: 'sftp',
    description: 'Sichere Dateiübertragung über SSH (Interactive FTP)',
    explanation:
      'sftp (SSH File Transfer Protocol) ermöglicht die interaktive Dateiübertragung über eine verschlüsselte SSH-Verbindung. Befehle: put, get, cd, ls.',
    example: 'sftp user@remote-host',
    category: 'SSH und Remote',
    difficulty: 'medium',
  },

  // ── Process Management (Additional) ────────────────────────────────────
  {
    command: 'pgrep',
    description: 'Sucht Prozesse anhand ihres Namens und gibt die PID zurück',
    explanation:
      'pgrep durchsucht die Prozessliste nach Namen und gibt die passenden PIDs aus. Mit -u USER wird auf einen bestimmten Benutzer gefiltert.',
    example: 'pgrep -u www-data nginx',
    category: 'Prozessverwaltung (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'pkill',
    description: 'Beendet Prozesse anhand ihres Namens oder anderer Attribute',
    explanation:
      'pkill sendet Signale an Prozesse, die auf ein Muster passen. Ähnlich wie killall, aber mit erweiterten Filtermöglichkeiten.',
    example: 'pkill -f "python script.py"',
    category: 'Prozessverwaltung (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'nice',
    description: 'Startet einen Prozess mit einer bestimmten Priorität',
    explanation:
      'nice startet Prozesse mit angepasster Scheduling-Priorität. Der Wert reicht von -20 (höchste Priorität) bis 19 (niedrigste). Standard ist 0.',
    example: 'nice -n 10 backup.sh',
    category: 'Prozessverwaltung (erweitert)',
    difficulty: 'hard',
  },
  {
    command: 'renice',
    description: 'Ändert die Priorität eines laufenden Prozesses',
    explanation:
      'renice ändert die Priorität eines bereits laufenden Prozesses anhand seiner PID. Nur root kann die Priorität erhöhen (niedrigere Werte).',
    example: 'renice -n 5 -p 12345',
    category: 'Prozessverwaltung (erweitert)',
    difficulty: 'hard',
  },
  {
    command: 'nohup',
    description: 'Führt einen Befehl aus, der nach dem Ausloggen weiterläuft',
    explanation:
      'nohup (no hangup) verhindert, dass ein Prozess beim Abmelden beendet wird. Die Ausgabe wird in nohup.out geschrieben. Oft mit & kombiniert.',
    example: 'nohup ./server.sh &',
    category: 'Prozessverwaltung (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'bg',
    description: 'Setzt einen angehaltenen Prozess im Hintergrund fort',
    explanation:
      'bg (background) nimmt einen mit Strg+Z angehaltenen Job und lässt ihn im Hintergrund weiterlaufen.',
    example: 'bg %1',
    category: 'Prozessverwaltung (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'fg',
    description: 'Holt einen Hintergrundprozess in den Vordergrund',
    explanation:
      'fg (foreground) bringt einen Hintergrund-Job zurück in den Vordergrund.',
    example: 'fg %1',
    category: 'Prozessverwaltung (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'jobs',
    description: 'Zeigt die im Hintergrund laufenden Prozesse der aktuellen Shell an',
    explanation:
      'jobs listet alle Hintergrund-Jobs der aktuellen Shell-Sitzung mit ihrer Job-Nummer und ihrem Status (Running, Stopped).',
    example: 'jobs -l',
    category: 'Prozessverwaltung (erweitert)',
    difficulty: 'easy',
  },

  // ── Networking (Additional) ────────────────────────────────────────────
  {
    command: 'netstat',
    description: 'Zeigt Netzwerkverbindungen, Routing-Tabellen und Statistiken an (veraltet, ss bevorzugen)',
    explanation:
      'netstat (network statistics) zeigt Netzwerkverbindungen und offene Ports. -tulpn zeigt alle TCP/UDP-Verbindungen. Es gilt als veraltet, ss wird bevorzugt.',
    example: 'netstat -tulpn',
    category: 'Netzwerk (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'traceroute',
    description: 'Verfolgt den Pfad von Netzwerkpaketen zum Zielhost',
    explanation:
      'traceroute zeigt alle Router (Hops), die ein Paket auf dem Weg zum Ziel durchläuft, einschließlich der Latenzzeiten.',
    example: 'traceroute google.de',
    category: 'Netzwerk (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'nslookup',
    description: 'Führt DNS-Abfragen durch (Name → IP oder IP → Name)',
    explanation:
      'nslookup (Name Server Lookup) fragt DNS-Server ab, um IP-Adressen zu Hostnamen aufzulösen oder umgekehrt.',
    example: 'nslookup google.de',
    category: 'Netzwerk (erweitert)',
    difficulty: 'easy',
  },
  {
    command: 'dig',
    description: 'Führt detaillierte DNS-Abfragen durch (Domain Information Groper)',
    explanation:
      'dig ist ein mächtigeres DNS-Abfragetool als nslookup. Es zeigt detaillierte DNS-Informationen inklusive aller Record-Typen (A, AAAA, MX, CNAME, TXT).',
    example: 'dig google.de MX',
    category: 'Netzwerk (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'iptables',
    description: 'Konfiguriert die Linux-Firewall (Paketfilter-Regeln)',
    explanation:
      'iptables verwaltet die Netfilter-Firewall-Regeln im Linux-Kernel. Es kann Pakete akzeptieren, ablehnen, umleiten oder protokollieren. Wird zunehmend durch nftables ersetzt.',
    example: 'iptables -L -n -v',
    category: 'Netzwerk (erweitert)',
    difficulty: 'hard',
    aliases: ['nft'],
  },
  {
    command: 'tracepath',
    description: 'Verfolgt den Netzwerkpfad zum Ziel und ermittelt die MTU',
    explanation:
      'tracepath ähnelt traceroute, benötigt jedoch keine root-Rechte und ermittelt zusätzlich die Path MTU (Maximum Transmission Unit).',
    example: 'tracepath google.de',
    category: 'Netzwerk (erweitert)',
    difficulty: 'medium',
  },

  // ── Shell & Data ───────────────────────────────────────────────────────
  {
    command: 'cut',
    description: 'Extrahiert Spalten oder Felder aus Textzeilen',
    explanation:
      'cut schneidet Teile aus jeder Zeile eines Textes heraus. Mit -d Trennzeichen und -f Feldnummer. Beispiel: cut -d: -f1 /etc/passwd zeigt alle Benutzernamen.',
    example: "cut -d':' -f1 /etc/passwd",
    category: 'Shell und Datenverarbeitung',
    difficulty: 'easy',
  },
  {
    command: 'sort',
    description: 'Sortiert Textzeilen alphabetisch oder numerisch',
    explanation:
      'sort sortiert Zeilen. -n numerisch, -r absteigend, -k SPALTE nach bestimmter Spalte, -u entfernt Duplikate.',
    example: 'sort -n -k3 daten.txt',
    category: 'Shell und Datenverarbeitung',
    difficulty: 'easy',
  },
  {
    command: 'uniq',
    description: 'Entfernt oder zählt aufeinanderfolgende doppelte Zeilen',
    explanation:
      'uniq filtert aufeinanderfolgende doppelte Zeilen. Oft in Kombination mit sort verwendet. -c zählt die Häufigkeit, -d zeigt nur Duplikate.',
    example: 'sort datei.txt | uniq -c',
    category: 'Shell und Datenverarbeitung',
    difficulty: 'easy',
  },
  {
    command: 'wc',
    description: 'Zählt Zeilen, Wörter und Bytes/Zeichen in einer Datei',
    explanation:
      'wc (word count) zählt Zeilen (-l), Wörter (-w) und Bytes/Zeichen (-c). Ohne Optionen werden alle drei ausgegeben.',
    example: 'wc -l /var/log/syslog',
    category: 'Shell und Datenverarbeitung',
    difficulty: 'easy',
  },
  {
    command: 'diff',
    description: 'Vergleicht zwei Dateien Zeile für Zeile und zeigt Unterschiede an',
    explanation:
      'diff zeigt die Unterschiede zwischen zwei Dateien an. -u zeigt ein einheitliches Format (unified), das auch in Patches verwendet wird.',
    example: 'diff -u alt.txt neu.txt',
    category: 'Shell und Datenverarbeitung',
    difficulty: 'medium',
  },
  {
    command: 'xargs',
    description: 'Übergibt Eingabezeilen als Argumente an einen anderen Befehl',
    explanation:
      'xargs liest Eingaben und übergibt sie als Argumente an einen Befehl. Oft mit find kombiniert: find . -name "*.tmp" | xargs rm.',
    example: 'find . -name "*.tmp" | xargs rm',
    category: 'Shell und Datenverarbeitung',
    difficulty: 'medium',
  },
  {
    command: 'alias',
    description: 'Erstellt Kurzbefehle (Aliase) für längere Befehle',
    explanation:
      'alias definiert Abkürzungen für Befehle. Beispiel: alias ll="ls -la". Ohne Argumente werden alle definierten Aliase angezeigt.',
    example: 'alias ll="ls -la"',
    category: 'Shell und Datenverarbeitung',
    difficulty: 'easy',
  },
  {
    command: 'export',
    description: 'Setzt eine Umgebungsvariable und macht sie für Kindprozesse verfügbar',
    explanation:
      'export macht Shell-Variablen für nachfolgende Prozesse sichtbar. export PATH=$PATH:/neuer/pfad erweitert z.B. den Suchpfad.',
    example: 'export PATH=$PATH:/usr/local/bin',
    category: 'Shell und Datenverarbeitung',
    difficulty: 'medium',
  },
  {
    command: 'history',
    description: 'Zeigt die Liste der zuletzt eingegebenen Befehle an',
    explanation:
      'history zeigt die Befehlshistorie. Mit !NUMMER kann ein Befehl wiederholt werden. Strg+r durchsucht die Historie rückwärts.',
    example: 'history | tail -20',
    category: 'Shell und Datenverarbeitung',
    difficulty: 'easy',
  },

  // ── Terminal Multiplexers ──────────────────────────────────────────────
  {
    command: 'screen',
    description: 'Terminal-Multiplexer: Mehrere Shell-Sitzungen in einem Terminal',
    explanation:
      'screen ermöglicht mehrere virtuelle Terminals in einer Sitzung. Sitzungen bleiben auch nach dem Abmelden aktiv (detached). Strg+a ist der Kommando-Präfix.',
    example: 'screen -S session_name',
    category: 'Terminal-Multiplexer',
    difficulty: 'medium',
  },
  {
    command: 'tmux',
    description: 'Moderner Terminal-Multiplexer mit Fenster- und Pane-Verwaltung',
    explanation:
      'tmux (Terminal Multiplexer) ist eine moderne Alternative zu screen. Es unterstützt Fenster, Panes und Sitzungen. Strg+b ist der Standard-Präfix.',
    example: 'tmux new -s arbeit',
    category: 'Terminal-Multiplexer',
    difficulty: 'medium',
  },

  // ── Cron/Scheduling ────────────────────────────────────────────────────
  {
    command: 'crontab',
    description: 'Verwaltet zeitgesteuerte Aufgaben (Cronjobs)',
    explanation:
      'crontab verwaltet Cronjobs (zeitgesteuerte Aufgaben). -e bearbeitet, -l listet auf. Format: MIN STU TAG MON WOT Befehl (z.B. 0 2 * * * backup.sh = täglich um 2 Uhr).',
    example: 'crontab -e',
    category: 'Zeitplanung (Cron)',
    difficulty: 'medium',
  },
  {
    command: 'at',
    description: 'Plant einen einmaligen Befehl für eine bestimmte Uhrzeit',
    explanation:
      'at führt Befehle einmalig zu einem bestimmten Zeitpunkt aus. at 02:00 planed einen Befehl für 2 Uhr nachts. atq zeigt geplante Jobs, atrm entfernt sie.',
    example: 'echo "backup.sh" | at 02:00',
    category: 'Zeitplanung (Cron)',
    difficulty: 'medium',
  },

  // ── Output Redirection ─────────────────────────────────────────────────
  {
    command: '|',
    description: 'Leitet die Ausgabe eines Befehls als Eingabe an den nächsten weiter (Pipe)',
    explanation:
      'Der Pipe-Operator | verbindet zwei Befehle: die Standardausgabe des ersten Befehls wird zur Standardeingabe des zweiten. Beispiel: ps aux | grep nginx.',
    example: 'ps aux | grep nginx',
    category: 'Ausgabeumleitung',
    difficulty: 'easy',
  },
  {
    command: '>',
    description: 'Leitet die Ausgabe in eine Datei um (überschreibt vorhandene Datei)',
    explanation:
      'Der Operator > schreibt die Standardausgabe in eine Datei und überschreibt dabei den vorhandenen Inhalt. echo "text" > datei.txt.',
    example: 'echo "Hallo" > datei.txt',
    category: 'Ausgabeumleitung',
    difficulty: 'easy',
  },
  {
    command: '>>',
    description: 'Hängt die Ausgabe an eine Datei an (ohne zu überschreiben)',
    explanation:
      'Der Operator >> hängt die Standardausgabe ans Ende einer Datei an, ohne den bestehenden Inhalt zu löschen.',
    example: 'echo "Neue Zeile" >> datei.txt',
    category: 'Ausgabeumleitung',
    difficulty: 'easy',
  },
  {
    command: '<',
    description: 'Liest die Eingabe für einen Befehl aus einer Datei',
    explanation:
      'Der Operator < leitet den Inhalt einer Datei als Standardeingabe an einen Befehl weiter. sort < unsortiert.txt.',
    example: 'sort < unsortiert.txt',
    category: 'Ausgabeumleitung',
    difficulty: 'medium',
  },
  {
    command: '2>&1',
    description: 'Leitet die Fehlerausgabe (stderr) in die Standardausgabe (stdout) um',
    explanation:
      '2>&1 verbindet die Fehlerausgabe (Dateideskriptor 2) mit der Standardausgabe (Deskriptor 1). Oft verwendet: befehl > datei.txt 2>&1 leitet beides in eine Datei um.',
    example: 'befehl > ausgabe.txt 2>&1',
    category: 'Ausgabeumleitung',
    difficulty: 'hard',
  },

  // ── Systemd (Additional) ───────────────────────────────────────────────
  {
    command: 'systemd-analyze',
    description: 'Analysiert die Systemstartzeit und Boot-Prozesse',
    explanation:
      'systemd-analyze zeigt die Boot-Zeit an. blame listet die Dienste nach Dauer, critical-chain zeigt die kritische Startkette, plot erstellt ein Diagramm.',
    example: 'systemd-analyze blame',
    category: 'Systemd (erweitert)',
    difficulty: 'hard',
  },
  {
    command: 'systemctl enable',
    description: 'Aktiviert einen Dienst für den automatischen Start beim Booten',
    explanation:
      'systemctl enable DIENST erstellt die Symlinks, damit der Dienst beim Systemstart automatisch gestartet wird. --now startet den Dienst zusätzlich sofort.',
    example: 'systemctl enable --now nginx',
    category: 'Systemd (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'systemctl disable',
    description: 'Deaktiviert den automatischen Start eines Dienstes beim Booten',
    explanation:
      'systemctl disable DIENST entfernt die Symlinks, sodass der Dienst beim nächsten Systemstart nicht mehr automatisch gestartet wird. Der Dienst läuft weiter bis zum nächsten Reboot.',
    example: 'systemctl disable apache2',
    category: 'Systemd (erweitert)',
    difficulty: 'medium',
  },
  {
    command: 'daemon-reload',
    description: 'Lädt die Systemd-Konfigurationsdateien neu (nach Änderungen an Unit-Files)',
    explanation:
      'systemctl daemon-reload lädt alle Unit-Dateien neu. Muss nach manuellen Änderungen an .service-Dateien oder neuen Unit-Files ausgeführt werden.',
    example: 'systemctl daemon-reload',
    category: 'Systemd (erweitert)',
    difficulty: 'hard',
  },
];

// ---------------------------------------------------------------------------
// Precomputed options for commandToDescription dropdown
// ---------------------------------------------------------------------------

const ALL_DESCRIPTIONS = COMMAND_DATABASE.map((c) => c.description);
const ALL_COMMANDS = COMMAND_DATABASE.map((c) => c.command);

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateLinuxQuestion(): LinuxQuestion {
  const entry = COMMAND_DATABASE[Math.floor(Math.random() * COMMAND_DATABASE.length)];

  // 50/50 chance for each direction
  const direction: 'commandToDescription' | 'descriptionToCommand' =
    Math.random() > 0.5 ? 'commandToDescription' : 'descriptionToCommand';

  if (direction === 'commandToDescription') {
    return buildCommandToDescription(entry);
  } else {
    return buildDescriptionToCommand(entry);
  }
}

/**
 * commandToDescription:
 *  - Shows the command + example
 *  - User picks the correct description from a dropdown
 */
function buildCommandToDescription(entry: CommandEntry): LinuxQuestion {
  // Pick 4 random wrong descriptions
  const wrongDescriptions = ALL_DESCRIPTIONS.filter(
    (d) => d !== entry.description
  );
  const shuffled = wrongDescriptions.sort(() => Math.random() - 0.5).slice(0, 4);
  const options = [entry.description, ...shuffled].sort(() => Math.random() - 0.5);

  return {
    theme: entry.category,
    questionText: `Was macht der Befehl \`${entry.command}\`?${entry.example ? `\n\nBeispiel: \`${entry.example}\`` : ''}`,
    command: entry.command,
    example: entry.example,
    direction: 'commandToDescription',
    expectedAnswers: { answer: entry.description },
    answerInputs: [
      {
        valueKey: 'answer',
        label: 'Beschreibung',
        valueOptions: options,
        acceptedValues: [entry.description],
      },
    ],
    solutionSteps: [
      `Gegeben: Befehl \`${entry.command}\``,
      '',
      `Erklärung:`,
      `  ${entry.explanation}`,
      '',
      `Kategorie: ${entry.category}`,
      `Beispiel: ${entry.example}`,
      '',
      'Ergebnis:',
      `  ${entry.description}`,
    ],
    difficulty: entry.difficulty,
  };
}

/**
 * descriptionToCommand:
 *  - Shows a description
 *  - User types the command name in a terminal-style text input
 */
function buildDescriptionToCommand(entry: CommandEntry): LinuxQuestion {
  // Build accepted values: command + aliases
  const acceptedValues = [entry.command, ...(entry.aliases ?? [])];

  return {
    theme: entry.category,
    questionText: `Welcher Linux-Befehl wird hier beschrieben?\n\n"${entry.description}"`,
    command: entry.command,
    example: entry.example,
    direction: 'descriptionToCommand',
    expectedAnswers: { answer: entry.command },
    // No answerInputs → uses the LinuxTerminal text input component
    // The validation in page.tsx handles text comparison (case-insensitive, trimmed)
    answerInputs: [
      {
        valueKey: 'answer',
        label: 'Befehl',
        acceptedValues,
      },
    ],
    solutionSteps: [
      `Gesucht: Befehl für "${entry.description}"`,
      '',
      `Erklärung:`,
      `  ${entry.explanation}`,
      '',
      `Kategorie: ${entry.category}`,
      `Beispiel: ${entry.example}`,
      '',
      'Ergebnis:',
      `  Befehl: ${entry.command}${entry.aliases?.length ? ` (auch: ${entry.aliases.join(', ')})` : ''}`,
    ],
    difficulty: entry.difficulty,
  };
}

// Re-export for use in ThemeSelector
export { COMMAND_DATABASE, ALL_COMMANDS, ALL_DESCRIPTIONS };
