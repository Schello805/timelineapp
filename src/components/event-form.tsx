"use client";

import { useActionState, useState } from "react";
import { FileAudio, FileImage, FileText, LoaderCircle, UploadCloud, Video } from "lucide-react";
import { upsertTimelineEvent } from "@/app/actions";
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

export function EventForm({ event }: { event?: TimelineEvent }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_previousState, formData) => upsertTimelineEvent(formData),
    null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedPaths, setUploadedPaths] = useState<UploadedMediaPaths>({
    image: "",
    video: "",
    audio: "",
    pdf: "",
  });
  const [mediaUpload, setMediaUpload] = useState<UploadProgressState>({
    progress: 0,
    pending: false,
    message: "",
    error: "",
  });
  const previewSrc = imagePreview ?? uploadedPaths.image ?? event?.image_url ?? null;

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      {event?.id ? <input type="hidden" name="id" defaultValue={event.id} /> : null}
      <input type="hidden" name="image_uploaded_path" value={uploadedPaths.image} readOnly />
      <input type="hidden" name="video_uploaded_path" value={uploadedPaths.video} readOnly />
      <input type="hidden" name="audio_uploaded_path" value={uploadedPaths.audio} readOnly />
      <input type="hidden" name="pdf_uploaded_path" value={uploadedPaths.pdf} readOnly />

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
          `Standard` bleibt kompakt, `Wichtig` erhält die erweiterte Monatsansicht und `Meilenstein` die volle Detaildarstellung.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Medien-Datei hochladen</h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Ein einziges Uploadfeld für Bild, Video, Audio oder PDF. Das System erkennt den Dateityp automatisch und ordnet ihn passend zu.
          </p>
        </div>
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50">
          {mediaUpload.pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {mediaUpload.pending ? "Datei wird hochgeladen..." : "Datei auswählen"}
          <input
            type="file"
            accept="image/*,video/*,audio/*,application/pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;

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
                    mediaType?: "image" | "video" | "audio" | "pdf";
                    path?: string;
                    message?: string;
                  };

                  if (request.status >= 200 && request.status < 300 && response.ok && response.path && response.mediaType) {
                    const mediaType = response.mediaType;
                    setUploadedPaths((current) => ({
                      ...current,
                      [mediaType]: response.path,
                    }));

                    if (mediaType === "image") {
                      setImagePreview(response.path);
                    }

                    const mediaTypeLabel =
                      mediaType === "image"
                        ? "Bild"
                        : mediaType === "video"
                          ? "Video"
                          : mediaType === "audio"
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
            }}
          />
        </label>
        {mediaUpload.pending ? (
          <div className="grid gap-2 rounded-md border border-stone-200 bg-white p-3">
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
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {(uploadedPaths.image || event?.image_url) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700">
              <FileImage className="h-3.5 w-3.5" />
              Bild zugeordnet
            </span>
          )}
          {(uploadedPaths.video || event?.video_url) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-orange-700">
              <Video className="h-3.5 w-3.5" />
              Video zugeordnet
            </span>
          )}
          {(uploadedPaths.audio || event?.audio_url) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-violet-700">
              <FileAudio className="h-3.5 w-3.5" />
              Audio zugeordnet
            </span>
          )}
          {(uploadedPaths.pdf || event?.pdf_url) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-teal-700">
              <FileText className="h-3.5 w-3.5" />
              PDF zugeordnet
            </span>
          )}
        </div>
      </div>

      <UrlUploadField
        name="image_url"
        label="Bild"
        defaultValue={event?.image_url ?? ""}
      />

      {previewSrc ? (
        <div className="aspect-video overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
          {/* Admin previews may use arbitrary external URLs or local upload paths. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc} alt="Bildvorschau" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="video_url">
          Video-Link
        </label>
        <input
          id="video_url"
          name="video_url"
          type="text"
          placeholder="YouTube, Vimeo, MP4-URL oder lokaler Upload-Pfad"
          defaultValue={event?.video_url ?? ""}
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
        <p className="text-sm leading-6 text-stone-600">
          Empfohlen für lokale Uploads: MP4 mit H.264/AAC. Große Dateien sind möglich, laden aber je nach Verbindung und Proxy langsamer.
        </p>
        {(uploadedPaths.video || event?.video_url) ? (
          <div className="inline-flex items-center gap-2 text-sm text-stone-600">
            <Video className="h-4 w-4 text-teal-700" />
            Aktuelles Video: {uploadedPaths.video || event?.video_url}
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="audio_url">
          Audio-Link
        </label>
        <input
          id="audio_url"
          name="audio_url"
          type="text"
          placeholder="MP3-, WAV-, OGG-URL oder lokaler Upload-Pfad"
          defaultValue={event?.audio_url ?? ""}
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
        <p className="text-sm leading-6 text-stone-600">
          Empfohlen für breite Kompatibilität: MP3. Alternativ funktionieren meist auch WAV, OGG oder M4A.
        </p>
        {(uploadedPaths.audio || event?.audio_url) ? (
          <div className="inline-flex items-center gap-2 text-sm text-stone-600">
            <FileAudio className="h-4 w-4 text-violet-700" />
            Aktuelles Audio: {uploadedPaths.audio || event?.audio_url}
          </div>
        ) : null}
      </div>

      <UrlUploadField
        name="pdf_url"
        label="PDF"
        defaultValue={event?.pdf_url ?? ""}
      />

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

function UrlUploadField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
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
        placeholder="Optional: URL oder lokaler Upload-Pfad"
        defaultValue={defaultValue}
        className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
      />
      {name === "image_url" ? (
        <p className="text-sm leading-6 text-stone-600">
          Bilder wirken am besten im Querformat und mit klarer Hauptszene.
        </p>
      ) : null}
      {name === "pdf_url" ? (
        <p className="text-sm leading-6 text-stone-600">
          PDFs werden in der öffentlichen Timeline als direkter Dokument-Link geöffnet.
        </p>
      ) : null}
    </div>
  );
}
