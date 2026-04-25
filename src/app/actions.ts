"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearAdminSession,
  changeAdminPassword,
  createAdminSession,
  credentialsMatch,
  isAdminAuthenticated,
} from "@/lib/auth";
import { restoreTimelineBackup, writeSafetyBackup } from "@/lib/backup";
import { deleteEvent, getTimelineEventById, upsertEvent } from "@/lib/db";
import { setTimelineOwnerName } from "@/lib/settings";
import { saveUpload } from "@/lib/uploads";

const mediaUrlSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((value) => {
    if (!value) return true;
    return value.startsWith("/") || z.string().url().safeParse(value).success;
  }, "Bitte eine gültige URL oder einen lokalen Pfad verwenden.");

const eventSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  event_date: z.string().min(1, "Bitte ein Datum eintragen."),
  title: z.string().min(2, "Bitte einen Titel eintragen.").max(160),
  description: z.string().min(10, "Bitte eine aussagekräftige Beschreibung eintragen."),
  image_url: mediaUrlSchema,
  video_url: mediaUrlSchema,
  pdf_url: mediaUrlSchema,
});

const settingsSchema = z.object({
  timeline_owner_name: z.string().trim().min(2, "Bitte einen Namen eintragen.").max(100),
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
  const uploadedVideo = await saveUpload(formData.get("video_file") as File | null, "videos");
  const uploadedPdf = await saveUpload(formData.get("pdf_file") as File | null, "pdfs");

  const parsed = eventSchema.safeParse({
    id: cleanOptionalText(formData.get("id")) ?? undefined,
    slug: cleanOptionalText(formData.get("slug")) ?? undefined,
    event_date: String(formData.get("event_date") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_url: uploadedImage ?? cleanOptionalText(formData.get("image_url")) ?? "",
    video_url: uploadedVideo ?? cleanOptionalText(formData.get("video_url")) ?? "",
    pdf_url: uploadedPdf ?? cleanOptionalText(formData.get("pdf_url")) ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.at(0)?.message ?? "Bitte prüfe deine Eingaben.",
    };
  }

  upsertEvent({
    id: parsed.data.id,
    slug: parsed.data.slug || null,
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

export async function updateAdminPassword(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  await requireAdmin();

  const currentPassword = String(formData.get("current_password") ?? "");
  const nextPassword = String(formData.get("next_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (nextPassword.length < 12) {
    return { ok: false, message: "Das neue Passwort muss mindestens 12 Zeichen lang sein." };
  }

  if (nextPassword !== confirmPassword) {
    return { ok: false, message: "Die neuen Passwörter stimmen nicht überein." };
  }

  const result = changeAdminPassword(currentPassword, nextPassword);
  if (!result.ok) return result;

  await clearAdminSession();
  redirect("/admin/login");
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

export async function duplicateTimelineEvent(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const event = getTimelineEventById(id);
  if (!event) {
    throw new Error("Ereignis nicht gefunden.");
  }

  upsertEvent({
    event_date: event.event_date,
    title: `${event.title} Kopie`,
    description: event.description,
    image_url: event.image_url,
    video_url: event.video_url,
    pdf_url: event.pdf_url,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateTimelineSettings(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    timeline_owner_name: String(formData.get("timeline_owner_name") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.at(0)?.message ?? "Bitte prüfe die Eingabe." };
  }

  setTimelineOwnerName(parsed.data.timeline_owner_name);
  revalidatePath("/");
  revalidatePath("/admin/einstellungen");

  return { ok: true, message: "Einstellungen gespeichert." };
}

export async function restoreTimelineBackupAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  await requireAdmin();

  if (formData.get("confirm_restore") !== "yes") {
    return { ok: false, message: "Bitte bestätige den Restore zuerst." };
  }

  const file = formData.get("backup_file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Bitte eine JSON-Backup-Datei auswählen." };
  }

  try {
    const safetyBackupPath = await writeSafetyBackup();
    const result = await restoreTimelineBackup(await file.text());
    revalidatePath("/");
    revalidatePath("/admin");

    return {
      ok: true,
      message: `Backup wiederhergestellt: ${result.eventCount} Ereignisse, ${result.fileCount} lokale Dateien. Sicherheitsbackup: ${safetyBackupPath}`,
    };
  } catch {
    return { ok: false, message: "Dieses Backup konnte nicht gelesen oder wiederhergestellt werden." };
  }
}

export async function signOut() {
  await clearAdminSession();
  redirect("/admin/login");
}
