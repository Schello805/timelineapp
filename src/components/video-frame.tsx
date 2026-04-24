import { getVideoEmbedUrl } from "@/lib/timeline-format";

export function VideoFrame({ url, title }: { url: string | null; title: string }) {
  const embedUrl = getVideoEmbedUrl(url);
  if (!embedUrl) return null;

  const isMp4 = embedUrl.toLowerCase().includes(".mp4");

  if (isMp4) {
    return (
      <video className="h-full w-full object-cover" controls preload="metadata">
        <source src={embedUrl} type="video/mp4" />
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
