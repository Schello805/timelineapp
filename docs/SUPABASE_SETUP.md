# Supabase Setup

1. Neues Supabase-Projekt anlegen.
2. In Supabase unter **SQL Editor** den Inhalt aus `supabase/schema.sql` ausfuehren.
3. Unter **Authentication > Users** einen Admin-Benutzer mit E-Mail und Passwort anlegen.
4. `.env.example` nach `.env.local` kopieren und URL, Anon Key sowie Site URL eintragen.
   Lokal ist `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, produktiv deine Domain.
5. Lokal starten:

```bash
npm install
npm run dev
```

Die oeffentliche Timeline ist unter `/` erreichbar. Der Admin-Bereich liegt unter `/admin`.

## Storage

Das SQL erstellt den public Bucket `timeline-media`. Der Admin kann Bilder und PDFs hochladen.
Videos koennen als YouTube-/Vimeo-Link oder als direkte MP4-URL eingetragen werden.

## Sicherheit

Die aktuelle Version ist fuer einen einzelnen Admin gedacht. Alle authentifizierten Supabase-User
duerfen Inhalte verwalten. Fuer Teams sollte spaeter eine Rollen-Tabelle oder ein Allowlist-Check
ergaenzt werden.
