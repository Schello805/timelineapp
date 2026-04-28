"use client";

import { useState } from "react";
import { AlertTriangle, VideoOff } from "lucide-react";
import { getVideoEmbedUrl } from "@/lib/timeline-format";

export function VideoFrame({ url, title }: { url: string | null; title: string }) {
  const embedUrl = getVideoEmbedUrl(url);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  if (!embedUrl) return null;

  const lowerUrl = embedUrl.toLowerCase();
  const isVideoFile = [".mp4", ".webm", ".mov", ".m4v", ".ogg"].some((extension) =>
    lowerUrl.includes(extension),
  );

  if (isVideoFile || embedUrl.startsWith("/uploads/videos/")) {
    return (
      <div className="relative h-full w-full bg-black">
        <video
          className={`h-full w-full ${errorMessage ? "hidden" : "object-cover"}`}
          controls
          preload="metadata"
          onError={(event) => {
            const code = event.currentTarget.error?.code;
            const reason =
              code === MediaError.MEDIA_ERR_NETWORK
                ? "Das Video konnte vom Server nicht vollständig geladen werden."
                : code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                  ? "Das Videoformat oder der Codec wird im Browser nicht unterstützt."
                  : code === MediaError.MEDIA_ERR_DECODE
                    ? "Das Video konnte nicht decodiert werden."
                    : "Das Video konnte nicht abgespielt werden.";

            setErrorMessage(`${reason} Für beste Kompatibilität bitte MP4 mit H.264/AAC verwenden.`);
          }}
        >
          <source src={embedUrl} />
        </video>

        {errorMessage ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-5 text-center text-sm text-white">
            <VideoOff className="h-8 w-8 text-orange-300" />
            <p className="font-semibold">{title}</p>
            <p className="max-w-xl leading-6 text-stone-200">{errorMessage}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <iframe
        className={`h-full w-full ${errorMessage ? "hidden" : ""}`}
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onError={() => setErrorMessage("Der eingebettete Video-Player konnte nicht geladen werden.")}
      />

      {errorMessage ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-5 text-center text-sm text-white">
          <AlertTriangle className="h-8 w-8 text-orange-300" />
          <p className="font-semibold">{title}</p>
          <p className="max-w-xl leading-6 text-stone-200">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
