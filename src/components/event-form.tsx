"use client";

import { useActionState, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { upsertTimelineEvent } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/browser";
import type { TimelineEvent } from "@/lib/types";

type State = { ok: boolean; message: string } | null;

export function EventForm({ event }: { event?: TimelineEvent }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_previousState, formData) => upsertTimelineEvent(formData),
    null,
  );
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  async function uploadFile(input: HTMLInputElement | null, field: "image_url" | "pdf_url") {
    const file = input?.files?.[0];
    if (!file || !isSupabaseConfigured) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${field}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("timeline-media").upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from("timeline-media").getPublicUrl(path);
      const target = document.querySelector<HTMLInputElement>(`input[name="${field}"]`);
      if (target) target.value = data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      {event?.id ? <input type="hidden" name="id" defaultValue={event.id} /> : null}

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="event_date">
          Datum oder Jahr
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
        label="Bild-URL"
        defaultValue={event?.image_url ?? ""}
        inputRef={imageRef}
        accept="image/*"
        disabled={!isSupabaseConfigured || uploading}
        onUpload={() => uploadFile(imageRef.current, "image_url")}
      />

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="video_url">
          Video-Link (YouTube, Vimeo oder MP4)
        </label>
        <input
          id="video_url"
          name="video_url"
          type="url"
          defaultValue={event?.video_url ?? ""}
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
      </div>

      <UrlUploadField
        name="pdf_url"
        label="PDF-URL"
        defaultValue={event?.pdf_url ?? ""}
        inputRef={pdfRef}
        accept="application/pdf"
        disabled={!isSupabaseConfigured || uploading}
        onUpload={() => uploadFile(pdfRef.current, "pdf_url")}
      />

      {state?.message ? (
        <p className={state.ok ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}

      <button
        className="h-12 rounded-md bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        disabled={pending || uploading}
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
  inputRef,
  accept,
  disabled,
  onUpload,
}: {
  name: string;
  label: string;
  defaultValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  disabled: boolean;
  onUpload: () => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-stone-800" htmlFor={name}>
        {label}
      </label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          id={name}
          name={name}
          type="url"
          defaultValue={defaultValue}
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50">
          <UploadCloud className="h-4 w-4" />
          Upload
          <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={onUpload} disabled={disabled} />
        </label>
      </div>
    </div>
  );
}
