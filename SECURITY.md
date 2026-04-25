# Security Policy

Bitte melde Sicherheitsprobleme nicht als öffentliches Issue.

## Hinweise

- Admin-Zugangsdaten gehören in `.env.local`, nicht ins Repository.
- `ADMIN_SESSION_SECRET` sollte ein langer zufälliger Wert sein.
- Für produktive Nutzung sollten Impressum, Datenschutz und Cookiehinweise rechtlich geprüft werden.
- Abhängigkeiten regelmäßig mit `npm audit` prüfen. Automatische Fixes nur übernehmen, wenn sie
  keine Downgrades auf veraltete Framework-Versionen erzwingen.
