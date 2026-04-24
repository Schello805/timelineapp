# Media Timeline

Eine mobile-first Web-App fuer eine interaktive Medien-Timeline mit geschuetztem Admin-Dashboard.
Die App unterstuetzt Bilder, YouTube-/Vimeo-/MP4-Videos und PDF-Dokumente.

## Features

- Oeffentliche horizontale Swipe-Timeline fuer Smartphone, Tablet und Desktop
- Bild-Lightbox, Video-Overlay und PDF-Buttons
- Zeitstrahl-Regler fuer schnelles Springen zwischen Jahren
- Admin-Login ueber Supabase Auth
- Admin-Formular zum Erstellen, Bearbeiten und Loeschen von Events
- Uploads fuer Bilder und PDFs ueber Supabase Storage
- Rechtsseiten fuer Impressum, Datenschutz und Cookiehinweise
- Demo-Daten, solange Supabase noch nicht konfiguriert ist

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Database und Storage
- Framer Motion
- Lucide Icons

## Schnellstart

```bash
npm install
cp .env.example .env.local
npm run dev
```

Die lokale App laeuft danach unter `http://localhost:3000`.

Ohne Supabase-Konfiguration zeigt die Startseite Demo-Daten. Fuer echte Inhalte:

1. Supabase-Projekt erstellen.
2. `supabase/schema.sql` im Supabase SQL Editor ausfuehren.
3. Admin-User in Supabase Auth anlegen.
4. `.env.local` mit Supabase URL, Anon Key und `NEXT_PUBLIC_SITE_URL` fuellen.
5. `/admin` oeffnen und Inhalte verwalten.

Mehr Details stehen in `docs/SUPABASE_SETUP.md`.

## Deployment

Fuer den Betrieb auf einem Debian-13-LXC gibt es eine eigene Anleitung mit Node.js, systemd und
Reverse-Proxy-Beispiel: `docs/DEBIAN_LXC_DEPLOYMENT.md`.

## Datenmodell

Die Tabelle `timeline_events` enthaelt:

- `event_date`
- `title`
- `description`
- `image_url`
- `video_url`
- `pdf_url`

## Lizenz

Dieses Projekt ist zur freien nicht-kommerziellen Nutzung gedacht und steht unter der
PolyForm Noncommercial License 1.0.0. Kommerzielle Nutzung ist nur mit separater Erlaubnis
gestattet.

## Status

`npm run lint`, `npm run typecheck` und `npm run build` sollten vor Releases erfolgreich laufen.
Falls `npm audit` eine moderate Next.js/PostCSS-Warnung meldet, pruefe zuerst, ob ein aktuelles
Next.js-Patchrelease verfuegbar ist. Kein automatisches Downgrade auf alte Next-Versionen ausfuehren.
