"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import {
  FileText,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { upsertTimelineEvent } from "@/app/actions";
import { AudioPlayer } from "@/components/audio-player";
import { VideoFrame } from "@/components/video-frame";
import type { TimelineEvent } from "@/lib/types";

type State = { ok: boolean; message: string } | null;
type UploadProgressState = {
  progress: number;
  pending: boolean;
  message: string;
  error: string;
};
type UploadedMediaPaths = {
  image: string;
  video: string;
  audio: string;
  pdf: string;
};
type MediaType = keyof UploadedMediaPaths;

export function EventForm({ event }: { event?: TimelineEvent }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_previousState, formData) => upsertTimelineEvent(formData),
    null,
  );
  const [imageUrl, setImageUrl] = useState(event?.image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(event?.video_url ?? "");
  const [audioUrl, setAudioUrl] = useState(event?.audio_url ?? "");
  const [pdfUrl, setPdfUrl] = useState(event?.pdf_url ?? "");
  const [uploadedPaths, setUploadedPaths] = useState<UploadedMediaPaths>({
    image: "",
    video: "",
    audio: "",
    pdf: "",
  });
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    try {
      return JSON.parse(event?.gallery_urls || "[]");
    } catch {
      return [];
    }
  });
  const [isDragActive, setIsDragActive] = useState(false);
  const [mediaUpload, setMediaUpload] = useState<UploadProgressState>({
    progress: 0,
    pending: false,
    message: "",
    error: "",
  });
  const [galleryUpload, setGalleryUpload] = useState<UploadProgressState>({
    progress: 0,
    pending: false,
    message: "",
    error: "",
  });

  const previewMedia = {
    image: uploadedPaths.image || imageUrl,
    video: uploadedPaths.video || videoUrl,
    audio: uploadedPaths.audio || audioUrl,
    pdf: uploadedPaths.pdf || pdfUrl,
  };

  function updateMediaUrl(type: MediaType, value: string) {
    setUploadedPaths((current) => {
      if (!current[type] || current[type] === value) {
        return current;
      }

      return {
        ...current,
        [type]: "",
      };
    });

    if (type === "image") setImageUrl(value);
    if (type === "video") setVideoUrl(value);
    if (type === "audio") setAudioUrl(value);
    if (type === "pdf") setPdfUrl(value);
  }

  function clearMedia(type: MediaType) {
    setUploadedPaths((current) => ({ ...current, [type]: "" }));
    updateMediaUrl(type, "");
  }

  function uploadMediaFile(file: File) {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/uploads/media");
    request.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    if (file.type) {
      request.setRequestHeader("Content-Type", file.type);
    }

    setMediaUpload({
      progress: 0,
      pending: true,
      message: "",
      error: "",
    });

    request.upload.onprogress = (progressEvent) => {
      if (!progressEvent.lengthComputable) return;
      setMediaUpload((current) => ({
        ...current,
        progress: Math.round((progressEvent.loaded / progressEvent.total) * 100),
      }));
    };

    request.onerror = () => {
      setMediaUpload({
        progress: 0,
        pending: false,
        message: "",
        error: "Der Upload ist fehlgeschlagen. Bitte Verbindung und Dateigröße prüfen.",
      });
    };

    request.onload = () => {
      try {
        const response = JSON.parse(request.responseText) as {
          ok?: boolean;
          mediaType?: MediaType;
          path?: string;
        };

        if (request.status >= 200 && request.status < 300 && response.ok && response.path && response.mediaType) {
          setUploadedPaths((current) => ({
            ...current,
            [response.mediaType!]: response.path!,
          }));
          updateMediaUrl(response.mediaType, response.path);

          const mediaTypeLabel =
            response.mediaType === "image"
              ? "Bild"
              : response.mediaType === "video"
                ? "Video"
                : response.mediaType === "audio"
                  ? "Audio"
                  : "PDF";

          setMediaUpload({
            progress: 100,
            pending: false,
            message: `${mediaTypeLabel} vollständig hochgeladen und automatisch zugeordnet.`,
            error: "",
          });
          return;
        }
      } catch {}

      setMediaUpload({
        progress: 0,
        pending: false,
        message: "",
        error: "Die Datei konnte nicht verarbeitet werden.",
      });
    };

    request.send(file);
  }

  function uploadGalleryFile(file: File) {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/uploads/media");
    request.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    if (file.type) request.setRequestHeader("Content-Type", file.type);

    setGalleryUpload({ progress: 0, pending: true, message: "", error: "" });

    request.upload.onprogress = (progressEvent) => {
      if (!progressEvent.lengthComputable) return;
      setGalleryUpload((current) => ({
        ...current,
        progress: Math.round((progressEvent.loaded / progressEvent.total) * 100),
      }));
    };

    request.onerror = () => {
      setGalleryUpload({ progress: 0, pending: false, message: "", error: "Fehler beim Upload der Galerie." });
    };

    request.onload = () => {
      try {
        const response = JSON.parse(request.responseText) as { ok?: boolean; mediaType?: string; path?: string };
        if (request.status >= 200 && request.status < 300 && response.ok && response.path) {
          if (response.mediaType === "image") {
            setGalleryUrls((current) => [...current, response.path!]);
            setGalleryUpload({ progress: 100, pending: false, message: "Galerie-Bild hochgeladen.", error: "" });
            return;
          } else {
            setGalleryUpload({ progress: 0, pending: false, message: "", error: "In die Galerie können nur Bilder hochgeladen werden." });
            return;
          }
        }
      } catch {}
      setGalleryUpload({ progress: 0, pending: false, message: "", error: "Fehler bei der Dateiverarbeitung." });
    };
    request.send(file);
  }

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      {event?.id ? <input type="hidden" name="id" defaultValue={event.id} /> : null}
      <input type="hidden" name="image_uploaded_path" value={uploadedPaths.image} readOnly />
      <input type="hidden" name="video_uploaded_path" value={uploadedPaths.video} readOnly />
      <input type="hidden" name="audio_uploaded_path" value={uploadedPaths.audio} readOnly />
      <input type="hidden" name="pdf_uploaded_path" value={uploadedPaths.pdf} readOnly />
      <input type="hidden" name="gallery_urls" value={JSON.stringify(galleryUrls)} readOnly />

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="event_date">
          Datum
        </label>
        <input
          id="event_date"
          name="event_date"
          type="date"
          required
          defaultValue={event?.event_date ?? ""}
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
        <p className="text-sm leading-6 text-stone-600">Vergangene und zukünftige Termine sind erlaubt.</p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="title">
          Titel
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={event?.title ?? ""}
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
      </div>

      {event?.slug ? (
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-stone-800" htmlFor="slug">
            URL-Slug
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={event.slug}
            className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="description">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          defaultValue={event?.description ?? ""}
          className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-teal-700"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="importance">
          Stufe
        </label>
        <select
          id="importance"
          name="importance"
          defaultValue={event?.importance ?? "standard"}
          className="h-11 rounded-md border border-stone-300 bg-white px-3 outline-none focus:border-teal-700"
        >
          <option value="standard">Standard</option>
          <option value="important">Wichtig</option>
          <option value="milestone">Meilenstein</option>
        </select>
        <p className="text-sm leading-6 text-stone-600">
          Meilensteine werden in der Timeline stärker hervorgehoben und wirken als echte Jahresanker.
        </p>
        <p className="text-sm leading-6 text-stone-500">
          `Standard` bleibt kompakt, `Wichtig` erhält mehr Raum und `Meilenstein` die volle Detaildarstellung.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Medien verwalten</h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Bild, Video, Audio oder PDF einfach ziehen oder auswählen. Der Dateityp wird automatisch erkannt und passend zugeordnet.
          </p>
        </div>

        <label
          className={
            isDragActive
              ? "grid cursor-pointer gap-3 rounded-2xl border-2 border-dashed border-teal-700 bg-teal-50/60 p-5 text-center"
              : "grid cursor-pointer gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-5 text-center hover:border-teal-700 hover:bg-stone-50"
          }
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              uploadMediaFile(file);
            }
          }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-700">
            {mediaUpload.pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          </div>
          <div className="grid gap-1">
            <span className="text-sm font-semibold text-stone-900">
              {mediaUpload.pending ? "Datei wird hochgeladen..." : "Datei hier ablegen oder auswählen"}
            </span>
            <span className="text-sm leading-6 text-stone-500">
              Unterstützt: Bilder, MP4/Video, MP3/Audio und PDF
            </span>
          </div>
          <span className="mx-auto inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800">
            Datei auswählen
          </span>
          <input
            type="file"
            accept="image/*,video/*,audio/*,application/pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) {
                uploadMediaFile(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </label>

        {mediaUpload.pending ? (
          <div className="grid gap-2 rounded-lg border border-stone-200 bg-white p-3">
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-teal-700 transition-[width] duration-150"
                style={{ width: `${mediaUpload.progress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-stone-700">{mediaUpload.progress}% hochgeladen</p>
          </div>
        ) : null}
        {mediaUpload.message ? <p className="text-sm leading-6 text-teal-700">{mediaUpload.message}</p> : null}
        {mediaUpload.error ? <p className="text-sm leading-6 text-red-700">{mediaUpload.error}</p> : null}

        <MediaPreviewShelf
          title={event?.title ?? "Neues Ereignis"}
          media={previewMedia}
          onClear={clearMedia}
        />
      </div>

      <div className="grid gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Bildergalerie (Zusätzliche Bilder)</h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Füge mehrere Bilder hinzu, die beim Ereignis als Galerie angezeigt werden.
          </p>
        </div>

        <label
          className="grid cursor-pointer gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-5 text-center hover:border-teal-700 hover:bg-stone-50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files || []);
            files.forEach((file) => {
              if (file.type.startsWith("image/")) uploadGalleryFile(file);
            });
          }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-700">
            {galleryUpload.pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          </div>
          <div className="grid gap-1">
            <span className="text-sm font-semibold text-stone-900">
              {galleryUpload.pending ? "Bild wird hochgeladen..." : "Galerie-Bilder hier ablegen oder auswählen"}
            </span>
            <span className="text-sm leading-6 text-stone-500">Es können auch mehrere Bilder markiert werden.</span>
          </div>
          <span className="mx-auto inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800">
            Bilder auswählen
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files || []);
              files.forEach((file) => {
                if (file.type.startsWith("image/")) uploadGalleryFile(file);
              });
              e.currentTarget.value = "";
            }}
          />
        </label>

        {galleryUpload.pending ? (
          <div className="grid gap-2 rounded-lg border border-stone-200 bg-white p-3">
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-teal-700 transition-[width] duration-150"
                style={{ width: `${galleryUpload.progress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-stone-700">{galleryUpload.progress}% hochgeladen</p>
          </div>
        ) : null}
        {galleryUpload.message ? <p className="text-sm leading-6 text-teal-700">{galleryUpload.message}</p> : null}
        {galleryUpload.error ? <p className="text-sm leading-6 text-red-700">{galleryUpload.error}</p> : null}

        {galleryUrls.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {galleryUrls.map((url, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Galerie ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setGalleryUrls((current) => current.filter((_, index) => index !== i))}
                  className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-700 opacity-0 shadow-sm transition-opacity hover:bg-white hover:text-red-600 group-hover:opacity-100"
                  aria-label="Bild entfernen"
                  title="Bild entfernen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Direkte Medien-Links</h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Alternativ kannst du auch externe URLs oder lokale Pfade eintragen. Die Vorschau aktualisiert sich direkt.
          </p>
        </div>

        <MediaUrlField
          name="image_url"
          label="Bild"
          value={imageUrl}
          onChange={setImageUrl}
          hint="Bilder wirken am besten mit klarer Hauptszene und genug Luft rund ums Motiv."
        />

        <MediaUrlField
          name="video_url"
          label="Video"
          value={videoUrl}
          onChange={setVideoUrl}
          placeholder="YouTube, Vimeo, MP4-URL oder lokaler Upload-Pfad"
          hint="Empfohlen für lokale Uploads: MP4 mit H.264/AAC. Große Dateien sind möglich, laden aber je nach Verbindung und Proxy langsamer."
        />

        <MediaUrlField
          name="audio_url"
          label="Audio"
          value={audioUrl}
          onChange={setAudioUrl}
          placeholder="MP3-, WAV-, OGG-URL oder lokaler Upload-Pfad"
          hint="Empfohlen für breite Kompatibilität: MP3. Alternativ funktionieren meist auch WAV, OGG oder M4A."
        />

        <MediaUrlField
          name="pdf_url"
          label="PDF"
          value={pdfUrl}
          onChange={setPdfUrl}
          hint="PDFs werden in der öffentlichen Timeline als direkter Dokument-Link geöffnet."
        />
      </div>

      {state?.message ? (
        <p className={state.ok ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}

      <button
        className="h-12 rounded-md bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Speichert..." : event ? "Ereignis aktualisieren" : "Ereignis erstellen"}
      </button>
    </form>
  );
}

function MediaUrlField({
  name,
  label,
  value,
  onChange,
  hint,
  placeholder = "Optional: URL oder lokaler Upload-Pfad",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-stone-800" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
      />
      {hint ? <p className="text-sm leading-6 text-stone-600">{hint}</p> : null}
    </div>
  );
}

function MediaPreviewShelf({
  title,
  media,
  onClear,
}: {
  title: string;
  media: UploadedMediaPaths;
  onClear: (type: MediaType) => void;
}) {
  const hasAnyMedia = Boolean(media.image || media.video || media.audio || media.pdf);

  if (!hasAnyMedia) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white/90 p-4 text-sm leading-6 text-stone-500">
        Noch keine Medien zugeordnet. Sobald du etwas hochlädst oder einen Link einträgst, erscheint hier direkt die Vorschau.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {media.image ? (
        <MediaPreviewCard title="Bild" tone="blue" onClear={() => onClear("image")}>
          <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl bg-stone-100 p-2">
            {/* Admin previews may use arbitrary external URLs or local upload paths. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.image} alt="Bildvorschau" className="max-h-[280px] w-full object-contain" />
          </div>
        </MediaPreviewCard>
      ) : null}

      {media.video ? (
        <MediaPreviewCard title="Video" tone="orange" onClear={() => onClear("video")}>
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <VideoFrame url={media.video} title={title} />
          </div>
        </MediaPreviewCard>
      ) : null}

      {media.audio ? (
        <MediaPreviewCard title="Audio" tone="violet" onClear={() => onClear("audio")}>
          <AudioPlayer url={media.audio} title={title} />
        </MediaPreviewCard>
      ) : null}

      {media.pdf ? (
        <MediaPreviewCard title="PDF" tone="teal" onClear={() => onClear("pdf")}>
          <a
            href={media.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[148px] flex-col items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white text-center text-stone-700 hover:bg-stone-50"
          >
            <FileText className="h-10 w-10 text-teal-700" />
            <div className="grid gap-1">
              <span className="text-sm font-semibold text-stone-900">PDF-Vorschau öffnen</span>
              <span className="text-sm text-stone-500">Das Dokument wird in einem neuen Tab gezeigt.</span>
            </div>
          </a>
        </MediaPreviewCard>
      ) : null}
    </div>
  );
}

function MediaPreviewCard({
  title,
  tone,
  onClear,
  children,
}: {
  title: string;
  tone: "blue" | "orange" | "violet" | "teal";
  onClear: () => void;
  children: ReactNode;
}) {
  const toneClassName =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "orange"
        ? "bg-orange-50 text-orange-700"
        : tone === "violet"
          ? "bg-violet-50 text-violet-700"
          : "bg-teal-50 text-teal-700";

  return (
    <section className="grid gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClassName}`}>{title}</span>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
          onClick={onClear}
          aria-label={`${title} entfernen`}
          title={`${title} entfernen`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {children}
    </section>
  );
}
