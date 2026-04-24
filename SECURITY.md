# Security Policy

Bitte melde Sicherheitsprobleme nicht als oeffentliches Issue.

## Hinweise

- Admin-Zugangsdaten gehoeren in `.env.local`, nicht ins Repository.
- `ADMIN_SESSION_SECRET` sollte ein langer zufaelliger Wert sein.
- Fuer produktive Nutzung sollten Impressum, Datenschutz und Cookiehinweise rechtlich geprueft werden.
- Abhaengigkeiten regelmaessig mit `npm audit` pruefen. Automatische Fixes nur uebernehmen, wenn sie
  keine Downgrades auf veraltete Framework-Versionen erzwingen.
