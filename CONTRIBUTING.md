# Contributing

Danke für dein Interesse an der Media Timeline.

## Entwicklung

```bash
npm install
npm run dev
```

Bitte halte Änderungen klein, nutze TypeScript sauber und prüfe vor Pull Requests:

```bash
npm run lint
npm run build
```

## Stil

- Mobile-first UI.
- Wiederverwendbare Komponenten in `src/components`.
- Datenzugriff über `src/lib/db.ts`.
- Keine Secrets committen.
