# Media Timeline

Eine mobile-first Web-App für eine interaktive Medien-Timeline mit geschütztem Admin-Dashboard.
Die App speichert Inhalte lokal in SQLite und braucht keinen externen Backend-Dienst.

## Features

- Zoombare öffentliche Timeline mit Jahres-, Monats- und Ereignisansicht
- Jahreskennzahlen pro Jahr mit optionalem Vergleichswert und automatisch berechneter Quote
- Drei Ereignis-Stufen: `Standard`, `Wichtig`, `Meilenstein`
- Bild-Lightbox, Video-Overlay und PDF-Buttons
- Admin-Login über lokale Zugangsdaten aus `.env.local`
- Admin-Formular zum Erstellen, Bearbeiten und Löschen von Ereignissen
- Lokale Uploads für Bilder, Videos und PDFs
- Video-Upload mit Fortschrittsbalken und Fehlerhinweisen bei nicht abspielbaren Formaten
- automatische Bildverkleinerung beim Upload
- QR-Codes und direkte Ereignislinks
- Suche und Sortierung in der öffentlichen Timeline
- zusätzliche lokale Admin-Benutzer im Dashboard verwaltbar
- Admin-Passwort kann im Dashboard geändert werden
- Healthcheck unter `/health`
- Rechtsseiten für Impressum, Datenschutz und Cookiehinweise
- Demo-Daten, solange lokal noch keine Ereignisse angelegt wurden

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- SQLite über `better-sqlite3`
- Framer Motion
- Lucide Icons

## Schnellstart

```bash
npm install
cp .env.example .env.local
npm run dev
```

Die lokale App läuft danach unter `http://localhost:3000`.

In `.env.local` werden Admin-Zugang, Site URL und lokale Speicherpfade gesetzt:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_SESSION_SECRET=change-this-long-random-secret
TIMELINE_DATABASE_PATH=./data/timeline.sqlite
```

Für produktive Installationen sollte `ADMIN_SESSION_SECRET` mit `openssl rand -hex 32`
erzeugt werden.

## Deployment

Für den Betrieb auf einem Debian-13-LXC gibt es eine eigene Anleitung mit Node.js, systemd und
Reverse-Proxy-Beispiel: `docs/DEBIAN_LXC_DEPLOYMENT.md`.

## Admin-Bereiche

- `Verwaltung`:
  Ereignisse anlegen, bearbeiten, löschen und Jahreskennzahlen pflegen
- `App-Einstellungen`:
  Name der öffentlichen Timeline und Backup/Restore
- `Sicherheit`:
  lokale Admin-Benutzer und Passwortverwaltung

## Datenmodell

Die lokale SQLite-Datenbank wird beim ersten Start automatisch erstellt.

### Ereignisse

Die Tabelle `timeline_events` enthält unter anderem:

- `event_date`
- `title`
- `description`
- `importance`
- `image_url`
- `video_url`
- `pdf_url`

`importance` unterstützt:

- `standard`
- `important`
- `milestone`

### Jahreskennzahlen

Die Tabelle `annual_metrics` enthält flexible Kennzahlen pro Jahr:

- `year`
- `label`
- `value`
- `unit`
- `comparison_label`
- `comparison_value`
- `comparison_unit`
- `description`
- `display_order`

Beispiel:

- `label = Geflüchtete Ukrainer`
- `value = 148`
- `unit = Personen`
- `comparison_label = davon berufstätig`
- `comparison_value = 61`
- `comparison_unit = Personen`

In der öffentlichen Timeline wird daraus zusätzlich automatisch die Quote berechnet.

## Ereignis-Stufen

Im Admin-Formular kann jedes Ereignis bewusst einer Stufe zugeordnet werden:

- `Standard`:
  normales Ereignis im Fluss der Timeline
- `Wichtig`:
  stärker hervorgehoben, aber noch nicht der zentrale Jahresanker
- `Meilenstein`:
  besonders stark hervorgehoben und als prägender Orientierungspunkt gedacht

Wenn keine bewusste Stufe gewählt würde, nutzt die UI zusätzlich interne Heuristiken für besonders medienreiche oder lange Inhalte. Mit dem Feld im Admin hast du jetzt aber volle Kontrolle.

## Jahreskennzahlen verwenden

Jahreskennzahlen sind bewusst flexibel gehalten und nicht auf einzelne Fachbegriffe fest verdrahtet. Damit lassen sich zum Beispiel abbilden:

- Umsatz
- Anzahl Mitarbeiter
- Fördermittel
- Geflüchtete Ukrainer
- davon berufstätig

Empfohlene Eingabe:

1. Hauptkennzahl als `label + value + unit`
2. optionaler Vergleichswert als `comparison_label + comparison_value + comparison_unit`
3. kurze Zusatzinfo für Kontext

Wenn Hauptwert und Vergleichswert zusammengehören, zeigt die Timeline automatisch den Prozentanteil.

## Medien-Uploads

### Bilder

- lokale Bilder werden automatisch optimiert und als `webp` gespeichert
- Querformat wirkt in der Timeline meist am besten

### Videos

- empfohlen: `MP4` mit `H.264/AAC`
- große Dateien sind möglich, abhängig von Server, Proxy und Verbindung
- der Admin-Upload zeigt einen Fortschrittsbalken
- falls ein Video später nicht abgespielt werden kann, zeigt die App einen verständlichen Hinweis

Wenn vor der App ein Reverse Proxy wie Nginx sitzt, muss das Upload-Limit dort ausreichend hoch gesetzt sein.

## Direkte Ereignislinks

Jedes Ereignis kann direkt per URL verlinkt werden:

```text
https://timeline.bechhofen-hilft.de/ereignis/EREIGNIS-SLUG
```

Im Admin-Bereich gibt es pro Ereignis einen Button zum Öffnen. In der öffentlichen Detailansicht
kann der direkte Link kopiert und anschließend als QR-Code verwendet werden.

## Externe Bild-URLs

Externe Bild-URLs werden in der öffentlichen Timeline bewusst ohne Next-Image-Optimierung geladen,
damit auch fremde Quellen robust funktionieren. Im Admin können daher sowohl lokale Uploads als
auch externe URLs genutzt werden.

## Healthcheck

```text
https://timeline.bechhofen-hilft.de/health
```

Antwortet mit JSON und prüft dabei, ob die lokale SQLite-Datenbank erreichbar ist.

## Updates auf dem Server

Auf dem Debian-LXC reicht nach der Erstinstallation:

```bash
cd /opt/media-timeline
sudo ./scripts/update.sh
```

Das Script holt den aktuellen GitHub-Stand, installiert Abhängigkeiten, baut die App neu,
setzt Rechte, startet den systemd-Service neu und prüft `/health`.

## Praxis-Hinweise für neue Inhalte

- Für prägende Jahre zuerst Jahreskennzahlen anlegen, dann die wichtigsten Ereignisse zuordnen
- Meilensteine sparsam einsetzen, damit sie ihre Wirkung behalten
- Für Vergleiche möglichst strukturierte Zahlen statt Freitext verwenden
- Videos vor Upload nach Möglichkeit browserfreundlich exportieren

## Lizenz

Dieses Projekt ist zur freien nicht-kommerziellen Nutzung gedacht und steht unter der
PolyForm Noncommercial License 1.0.0. Kommerzielle Nutzung ist nur mit separater Erlaubnis
gestattet.

## Status

`npm run lint`, `npm run typecheck` und `npm run build` sollten vor Releases erfolgreich laufen.
Falls `npm audit` eine moderate Next.js/PostCSS-Warnung meldet, prüfe zuerst, ob ein aktuelles
Next.js-Patchrelease verfügbar ist. Kein automatisches Downgrade auf alte Next-Versionen ausführen.
