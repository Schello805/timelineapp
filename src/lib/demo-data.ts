import type { TimelineEvent } from "@/lib/types";

export const demoEvents: TimelineEvent[] = [
  {
    id: "demo-1",
    event_date: "1989-11-09",
    title: "Ein Wendepunkt",
    description:
      "Ein Beispielereignis mit Bild, Text und dokumentarischem Charakter. Sobald Supabase verbunden ist, erscheinen hier deine eigenen Inhalte.",
    image_url:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    video_url: null,
    pdf_url: null,
  },
  {
    id: "demo-2",
    event_date: "2007-01-09",
    title: "Mobile wird Alltag",
    description:
      "Die Timeline ist mobile-first gebaut: Karten lassen sich horizontal wischen, der Jahresregler springt schnell durch die Einträge.",
    image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    video_url: "https://www.youtube.com/watch?v=MnrJzXM7a6o",
    pdf_url: null,
  },
  {
    id: "demo-3",
    event_date: "2026-04-24",
    title: "Eigene Medien-Timeline",
    description:
      "Bilder, Videos und PDF-Dokumente können im Admin-Bereich gepflegt und in der öffentlichen Ansicht elegant geöffnet werden.",
    image_url:
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1200&q=80",
    video_url: null,
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
];
