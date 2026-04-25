import { getVideoEmbedUrl } from "@/lib/timeline-format";

export function VideoFrame({ url, title }: { url: string | null; title: string }) {
  const embedUrl = getVideoEmbedUrl(url);
  if (!embedUrl) return null;

  const lowerUrl = embedUrl.toLowerCase();
  const isVideoFile = [".mp4", ".webm", ".mov", ".m4v", ".ogg"].some((extension) =>
    lowerUrl.includes(extension),
  );

  if (isVideoFile || embedUrl.startsWith("/uploads/videos/")) {
    return (
      <video className="h-full w-full object-cover" controls preload="metadata">
        <source src={embedUrl} />
      </video>
    );
  }

  return (
    <iframe
      className="h-full w-full"
      src={embedUrl}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
