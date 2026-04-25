# Media Timeline

Eine mobile-first Web-App für eine interaktive Medien-Timeline mit geschütztem Admin-Dashboard.
Die App speichert Inhalte lokal in SQLite und braucht keinen externen Backend-Dienst.

## Features

- Zoombare öffentliche Timeline mit Jahres-, Monats- und Ereignisansicht
- Bild-Lightbox, Video-Overlay und PDF-Buttons
- Admin-Login über lokale Zugangsdaten aus `.env.local`
- Admin-Formular zum Erstellen, Bearbeiten und Löschen von Events
- Lokale Uploads für Bilder und PDFs
- automatische Bildverkleinerung beim Upload
- QR-Codes und direkte Ereignislinks
- Suche und Medienfilter in der öffentlichen Timeline
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

## Datenmodell

Die lokale SQLite-Tabelle `timeline_events` enthält:

- `event_date`
- `title`
- `description`
- `image_url`
- `video_url`
- `pdf_url`

Die Datenbank wird beim ersten Start automatisch erstellt.

## Direkte Ereignislinks

Jedes Ereignis kann direkt per URL verlinkt werden:

```text
https://timeline.bechhofen-hilft.de/ereignis/EREIGNIS-SLUG
```

Im Admin-Bereich gibt es pro Ereignis einen Button zum Öffnen. In der öffentlichen Detailansicht
kann der direkte Link kopiert und anschließend als QR-Code verwendet werden.

## Externe Bild-URLs

Externe Bild-URLs müssen in `next.config.ts` unter `images.remotePatterns` erlaubt sein, damit
Next.js sie optimieren und anzeigen kann. Bereits erlaubt sind unter anderem Unsplash, Pexels,
Pixabay und Wikimedia.

## Healthcheck

```text
https://timeline.bechhofen-hilft.de/health
```

Antwortet mit JSON und prüft dabei, ob die lokale SQLite-Datenbank erreichbar ist.

## Updates auf dem Server

Auf dem Debian-LXC reicht nach der Erstinstallation:

```bash
cd /opt/media-timeline
sudo ./scripts/update-production.sh
```

Das Script holt den aktuellen GitHub-Stand, installiert Abhängigkeiten, baut die App neu,
setzt Rechte, startet den systemd-Service neu und prüft `/health`.

## Lizenz

Dieses Projekt ist zur freien nicht-kommerziellen Nutzung gedacht und steht unter der
PolyForm Noncommercial License 1.0.0. Kommerzielle Nutzung ist nur mit separater Erlaubnis
gestattet.

## Status

`npm run lint`, `npm run typecheck` und `npm run build` sollten vor Releases erfolgreich laufen.
Falls `npm audit` eine moderate Next.js/PostCSS-Warnung meldet, prüfe zuerst, ob ein aktuelles
Next.js-Patchrelease verfügbar ist. Kein automatisches Downgrade auf alte Next-Versionen ausführen.
