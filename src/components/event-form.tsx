"use client";

import { useActionState, useState } from "react";
import { UploadCloud } from "lucide-react";
import { upsertTimelineEvent } from "@/app/actions";
import type { TimelineEvent } from "@/lib/types";

type State = { ok: boolean; message: string } | null;

export function EventForm({ event }: { event?: TimelineEvent }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_previousState, formData) => upsertTimelineEvent(formData),
    null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const previewSrc = imagePreview ?? event?.image_url ?? null;

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      {event?.id ? <input type="hidden" name="id" defaultValue={event.id} /> : null}

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
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50">
          <UploadCloud className="h-4 w-4" />
          Video lokal hochladen
          <input name="video_file" type="file" accept="video/*" className="sr-only" />
        </label>
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
