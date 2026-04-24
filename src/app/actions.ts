"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearAdminSession,
  createAdminSession,
  credentialsMatch,
  isAdminAuthenticated,
} from "@/lib/auth";
import { deleteEvent, upsertEvent } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";

const eventSchema = z.object({
  id: z.string().optional(),
  event_date: z.string().min(1, "Bitte ein Datum eintragen."),
  title: z.string().min(2, "Bitte einen Titel eintragen.").max(160),
  description: z.string().min(10, "Bitte eine aussagekraeftige Beschreibung eintragen."),
  image_url: z.string().url().optional().or(z.literal("")),
  video_url: z.string().url().optional().or(z.literal("")),
  pdf_url: z.string().url().optional().or(z.literal("")),
});

function cleanOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function signIn(_previousState: { ok: boolean; message: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!credentialsMatch(email, password)) {
    return { ok: false, message: "E-Mail oder Passwort ist falsch." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function upsertTimelineEvent(formData: FormData) {
  await requireAdmin();

  const uploadedImage = await saveUpload(formData.get("image_file") as File | null, "images");
  const uploadedPdf = await saveUpload(formData.get("pdf_file") as File | null, "pdfs");

  const parsed = eventSchema.safeParse({
    id: cleanOptionalText(formData.get("id")) ?? undefined,
    event_date: String(formData.get("event_date") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_url: uploadedImage ?? cleanOptionalText(formData.get("image_url")) ?? "",
    video_url: cleanOptionalText(formData.get("video_url")) ?? "",
    pdf_url: uploadedPdf ?? cleanOptionalText(formData.get("pdf_url")) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.at(0)?.message ?? "Bitte pruefe deine Eingaben.",
    };
  }

  upsertEvent({
    id: parsed.data.id,
    event_date: parsed.data.event_date,
    title: parsed.data.title,
    description: parsed.data.description,
    image_url: parsed.data.image_url || null,
    video_url: parsed.data.video_url || null,
    pdf_url: parsed.data.pdf_url || null,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Ereignis gespeichert." };
}

export async function deleteTimelineEvent(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("Keine Ereignis-ID gefunden.");
  }

  deleteEvent(id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function signOut() {
  await clearAdminSession();
  redirect("/admin/login");
}
