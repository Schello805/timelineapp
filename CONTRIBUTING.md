# Contributing

Danke fuer dein Interesse an der Media Timeline.

## Entwicklung

```bash
npm install
npm run dev
```

Bitte halte Aenderungen klein, nutze TypeScript sauber und pruefe vor Pull Requests:

```bash
npm run lint
npm run build
```

## Stil

- Mobile-first UI.
- Wiederverwendbare Komponenten in `src/components`.
- Datenzugriff ueber `src/lib/db.ts`.
- Keine Secrets committen.
