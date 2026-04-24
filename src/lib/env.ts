export const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const siteConfig = {
  name: "Media Timeline",
  description:
    "Eine mobile-first Timeline fuer Bilder, Videos und Dokumente mit geschuetztem Admin-Dashboard.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
