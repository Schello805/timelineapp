# Security Policy

Bitte melde Sicherheitsprobleme nicht als oeffentliches Issue.

## Hinweise

- Supabase Keys gehoeren in `.env.local`, nicht ins Repository.
- Der Anon Key ist fuer Browser-Apps vorgesehen, die RLS-Policies bleiben trotzdem wichtig.
- Fuer produktive Nutzung sollten Impressum, Datenschutz und Cookiehinweise rechtlich geprueft werden.
- Abhaengigkeiten regelmaessig mit `npm audit` pruefen. Automatische Fixes nur uebernehmen, wenn sie
  keine Downgrades auf veraltete Framework-Versionen erzwingen.
