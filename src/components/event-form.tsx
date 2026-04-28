"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, UploadCloud, Video } from "lucide-react";
import { upsertTimelineEvent } from "@/app/actions";
import type { TimelineEvent } from "@/lib/types";

type State = { ok: boolean; message: string } | null;
type UploadState = {
  progress: number;
  pending: boolean;
  path: string;
  message: string;
  error: string;
};

export function EventForm({ event }: { event?: TimelineEvent }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_previousState, formData) => upsertTimelineEvent(formData),
    null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUpload, setVideoUpload] = useState<UploadState>({
    progress: 0,
    pending: false,
    path: "",
    message: "",
    error: "",
  });
  const previewSrc = imagePreview ?? event?.image_url ?? null;

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      {event?.id ? <input type="hidden" name="id" defaultValue={event.id} /> : null}
      <input type="hidden" name="video_uploaded_path" value={videoUpload.path} readOnly />

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

      <UrlUploadField
        name="image_url"
        fileName="image_file"
        label="Bild"
        defaultValue={event?.image_url ?? ""}
        accept="image/*"
        onFilePreview={setImagePreview}
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
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50">
          {videoUpload.pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {videoUpload.pending ? "Video wird hochgeladen..." : "Video lokal hochladen"}
          <input
            name="video_file"
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;

              const request = new XMLHttpRequest();
              request.open("POST", "/api/uploads/video");
              request.setRequestHeader("x-file-name", encodeURIComponent(file.name));

              setVideoUpload({
                progress: 0,
                pending: true,
                path: "",
                message: "",
                error: "",
              });

              request.upload.onprogress = (progressEvent) => {
                if (!progressEvent.lengthComputable) return;
                setVideoUpload((current) => ({
                  ...current,
                  progress: Math.round((progressEvent.loaded / progressEvent.total) * 100),
                }));
              };

              request.onerror = () => {
                setVideoUpload({
                  progress: 0,
                  pending: false,
                  path: "",
                  message: "",
                  error: "Der Upload ist fehlgeschlagen. Bitte Verbindung und Dateigröße prüfen.",
                });
              };

              request.onload = () => {
                try {
                  const response = JSON.parse(request.responseText) as {
                    ok?: boolean;
                    path?: string;
                    message?: string;
                  };

                  if (request.status >= 200 && request.status < 300 && response.ok && response.path) {
                    setVideoUpload({
                      progress: 100,
                      pending: false,
                      path: response.path,
                      message:
                        response.message ||
                        "Video vollständig hochgeladen. Falls es später nicht abspielt, liegt das meist am Format oder Codec. MP4 mit H.264/AAC ist am kompatibelsten.",
                      error: "",
                    });
                    return;
                  }
                } catch {}

                setVideoUpload({
                  progress: 0,
                  pending: false,
                  path: "",
                  message: "",
                  error: "Das Video konnte nicht verarbeitet werden.",
                });
              };

              request.send(file);
            }}
          />
        </label>
        {videoUpload.pending ? (
          <div className="grid gap-2 rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-teal-700 transition-[width] duration-150"
                style={{ width: `${videoUpload.progress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-stone-700">{videoUpload.progress}% hochgeladen</p>
          </div>
        ) : null}
        {videoUpload.message ? (
          <p className="text-sm leading-6 text-teal-700">{videoUpload.message}</p>
        ) : null}
        {videoUpload.error ? <p className="text-sm leading-6 text-red-700">{videoUpload.error}</p> : null}
        {(videoUpload.path || event?.video_url) && !videoUpload.pending ? (
          <div className="inline-flex items-center gap-2 text-sm text-stone-600">
            <Video className="h-4 w-4 text-teal-700" />
            Aktuelles Video: {videoUpload.path || event?.video_url}
          </div>
        ) : null}
      </div>

      <UrlUploadField
        name="pdf_url"
        fileName="pdf_file"
        label="PDF"
        defaultValue={event?.pdf_url ?? ""}
        accept="application/pdf"
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
  fileName,
  label,
  defaultValue,
  accept,
  onFilePreview,
}: {
  name: string;
  fileName: string;
  label: string;
  defaultValue: string;
  accept: string;
  onFilePreview?: (url: string | null) => void;
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
      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50">
        <UploadCloud className="h-4 w-4" />
        Datei lokal hochladen
        <input
          name={fileName}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (!file || !onFilePreview) return;
            onFilePreview(URL.createObjectURL(file));
          }}
        />
      </label>
    </div>
  );
}
