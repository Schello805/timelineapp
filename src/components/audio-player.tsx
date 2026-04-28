"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function AudioPlayer({ url, title }: { url: string | null; title: string }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  if (!url) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white/80 p-3">
      <audio
        className={`w-full ${errorMessage ? "hidden" : ""}`}
        controls
        preload="metadata"
        onError={(event) => {
          const code = event.currentTarget.error?.code;
          const reason =
            code === MediaError.MEDIA_ERR_NETWORK
              ? "Die Audiodatei konnte vom Server nicht vollständig geladen werden."
              : code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                ? "Das Audioformat oder der Codec wird im Browser nicht unterstützt."
                : code === MediaError.MEDIA_ERR_DECODE
                  ? "Die Audiodatei konnte nicht decodiert werden."
                  : "Die Audiodatei konnte nicht abgespielt werden.";

          setErrorMessage(`${reason} Für beste Kompatibilität bitte MP3 verwenden.`);
        }}
      >
        <source src={url} />
      </audio>

      {errorMessage ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-3 text-center text-sm text-stone-700">
          <AlertTriangle className="h-6 w-6 text-orange-400" />
          <p className="font-semibold">{title}</p>
          <p className="leading-6 text-stone-500">{errorMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
