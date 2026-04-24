export function getYear(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date.slice(0, 4);
  return String(parsed.getFullYear());
}

export function formatEventDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function getVideoEmbedUrl(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
    }

    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube-nocookie.com/embed${parsed.pathname}`;
    }

    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).at(0);
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }

    return url;
  } catch {
    return url;
  }
}
