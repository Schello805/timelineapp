# Media Timeline

Eine mobile-first Web-App fuer eine interaktive Medien-Timeline mit geschuetztem Admin-Dashboard.
Die App speichert Inhalte lokal in SQLite und braucht keinen externen Backend-Dienst.

## Features

- Zoombare oeffentliche Timeline mit Jahres-, Monats- und Ereignisansicht
- Bild-Lightbox, Video-Overlay und PDF-Buttons
- Admin-Login ueber lokale Zugangsdaten aus `.env.local`
- Admin-Formular zum Erstellen, Bearbeiten und Loeschen von Events
- Lokale Uploads fuer Bilder und PDFs
- Rechtsseiten fuer Impressum, Datenschutz und Cookiehinweise
- Demo-Daten, solange lokal noch keine Ereignisse angelegt wurden

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- SQLite ueber `better-sqlite3`
- Framer Motion
- Lucide Icons

## Schnellstart

```bash
npm install
cp .env.example .env.local
npm run dev
```

Die lokale App laeuft danach unter `http://localhost:3000`.

In `.env.local` werden Admin-Zugang, Site URL und lokale Speicherpfade gesetzt:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_SESSION_SECRET=change-this-long-random-secret
TIMELINE_DATABASE_PATH=./data/timeline.sqlite
```

## Deployment

Fuer den Betrieb auf einem Debian-13-LXC gibt es eine eigene Anleitung mit Node.js, systemd und
Reverse-Proxy-Beispiel: `docs/DEBIAN_LXC_DEPLOYMENT.md`.

## Datenmodell

Die lokale SQLite-Tabelle `timeline_events` enthaelt:

- `event_date`
- `title`
- `description`
- `image_url`
- `video_url`
- `pdf_url`

Die Datenbank wird beim ersten Start automatisch erstellt.

## Lizenz

Dieses Projekt ist zur freien nicht-kommerziellen Nutzung gedacht und steht unter der
PolyForm Noncommercial License 1.0.0. Kommerzielle Nutzung ist nur mit separater Erlaubnis
gestattet.

## Status

`npm run lint`, `npm run typecheck` und `npm run build` sollten vor Releases erfolgreich laufen.
Falls `npm audit` eine moderate Next.js/PostCSS-Warnung meldet, pruefe zuerst, ob ein aktuelles
Next.js-Patchrelease verfuegbar ist. Kein automatisches Downgrade auf alte Next-Versionen ausfuehren.
