"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  id: z.string().optional(),
  event_date: z.string().min(1, "Bitte ein Datum eintragen."),
  title: z.string().min(2, "Bitte einen Titel eintragen.").max(160),
  description: z.string().min(10, "Bitte eine aussagekraeftige Beschreibung eintragen."),
  image_url: z.string().url().optional().or(z.literal("")),
  video_url: z.string().url().optional().or(z.literal("")),
  pdf_url: z.string().url().optional().or(z.literal("")),
});

function cleanOptionalUrl(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

async function requireAdmin() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase ist noch nicht konfiguriert.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return supabase;
}

export async function upsertTimelineEvent(formData: FormData) {
  const parsed = eventSchema.safeParse({
    id: cleanOptionalUrl(formData.get("id")) ?? undefined,
    event_date: String(formData.get("event_date") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_url: cleanOptionalUrl(formData.get("image_url")) ?? "",
    video_url: cleanOptionalUrl(formData.get("video_url")) ?? "",
    pdf_url: cleanOptionalUrl(formData.get("pdf_url")) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.at(0)?.message ?? "Bitte pruefe deine Eingaben.",
    };
  }

  const supabase = await requireAdmin();
  const payload = {
    event_date: parsed.data.event_date,
    title: parsed.data.title,
    description: parsed.data.description,
    image_url: parsed.data.image_url || null,
    video_url: parsed.data.video_url || null,
    pdf_url: parsed.data.pdf_url || null,
  };

  const query = parsed.data.id
    ? supabase.from("timeline_events").update(payload).eq("id", parsed.data.id)
    : supabase.from("timeline_events").insert(payload);

  const { error } = await query;

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Ereignis gespeichert." };
}

export async function deleteTimelineEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("Keine Ereignis-ID gefunden.");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.from("timeline_events").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
