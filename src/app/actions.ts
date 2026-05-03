"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createAdminSession,
  getCurrentAdminUser,
  clearAdminSession,
  changeAdminPassword,
  verifyAdminCredentials,
} from "@/lib/auth";
import { restoreTimelineBackup, writeSafetyBackup } from "@/lib/backup";
import {
  createAdminUser,
  deleteAdminUser,
  deleteAnnualMetric,
  deleteEvent,
  getAnnualMetricById,
  getTimelineEventById,
  upsertAnnualMetric,
  upsertEvent,
} from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
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
  importance: z.enum(["standard", "important", "milestone"]),
  image_url: mediaUrlSchema,
  video_url: mediaUrlSchema,
  audio_url: mediaUrlSchema,
  pdf_url: mediaUrlSchema,
  gallery_urls: z.string().optional().or(z.literal("")),
});

const settingsSchema = z.object({
  timeline_owner_name: z.string().trim().min(2, "Bitte einen Namen eintragen.").max(100),
});

const adminUserSchema = z.object({
  email: z.email("Bitte eine gültige E-Mail-Adresse eintragen.").trim().max(190),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
});

const annualMetricSchema = z.object({
  id: z.string().optional(),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Bitte ein Jahr im Format JJJJ eintragen."),
  label: z.string().trim().min(2, "Bitte eine Bezeichnung eintragen.").max(120),
  value: z.coerce.number().finite("Bitte einen gültigen Hauptwert eintragen."),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  comparison_label: z.string().trim().max(120).optional().or(z.literal("")),
  comparison_value: z
    .union([z.literal(""), z.coerce.number().finite("Bitte einen gültigen Vergleichswert eintragen.")])
    .optional(),
  comparison_unit: z.string().trim().max(40).optional().or(z.literal("")),
  description: z.string().trim().max(280).optional().or(z.literal("")),
  display_order: z.coerce.number().int().min(0).max(999).default(0),
});

function cleanOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

async function requireAdmin() {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function signIn(_previousState: { ok: boolean; message: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = verifyAdminCredentials(email, password);
  if (!user) {
    return { ok: false, message: "E-Mail oder Passwort ist falsch." };
  }

  await createAdminSession(user.id);
  redirect("/admin");
}

export async function upsertTimelineEvent(formData: FormData) {
  await requireAdmin();

  const uploadedImage = await saveUpload(formData.get("image_file") as File | null, "images");
  const uploadedVideo = await saveUpload(formData.get("video_file") as File | null, "videos");
  const uploadedAudio = await saveUpload(formData.get("audio_file") as File | null, "audios");
  const uploadedPdf = await saveUpload(formData.get("pdf_file") as File | null, "pdfs");

  const parsed = eventSchema.safeParse({
    id: cleanOptionalText(formData.get("id")) ?? undefined,
    slug: cleanOptionalText(formData.get("slug")) ?? undefined,
    event_date: String(formData.get("event_date") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    importance: String(formData.get("importance") ?? "standard"),
    image_url:
      cleanOptionalText(formData.get("image_uploaded_path")) ??
      uploadedImage ??
      cleanOptionalText(formData.get("image_url")) ??
      "",
    video_url:
      cleanOptionalText(formData.get("video_uploaded_path")) ??
      uploadedVideo ??
      cleanOptionalText(formData.get("video_url")) ??
      "",
    audio_url:
      cleanOptionalText(formData.get("audio_uploaded_path")) ??
      uploadedAudio ??
      cleanOptionalText(formData.get("audio_url")) ??
      "",
    pdf_url:
      cleanOptionalText(formData.get("pdf_uploaded_path")) ??
      uploadedPdf ??
      cleanOptionalText(formData.get("pdf_url")) ??
      "",
    gallery_urls: String(formData.get("gallery_urls") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.at(0)?.message ?? "Bitte prüfe deine Eingaben.",
    };
  }

  const newId = upsertEvent({
    id: parsed.data.id,
    slug: parsed.data.slug || null,
    event_date: parsed.data.event_date,
    title: parsed.data.title,
    description: parsed.data.description,
    importance: parsed.data.importance,
    image_url: parsed.data.image_url || null,
    video_url: parsed.data.video_url || null,
    audio_url: parsed.data.audio_url || null,
    pdf_url: parsed.data.pdf_url || null,
    gallery_urls: parsed.data.gallery_urls || null,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  
  if (!parsed.data.id) {
    redirect("/admin");
  }

  return { ok: true, message: "Ereignis gespeichert." };
}

export async function quickUpdateTimelineEvent(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const event = getTimelineEventById(id);
  if (!event) {
    return { ok: false, message: "Ereignis nicht gefunden." };
  }

  const parsed = z
    .object({
      event_date: z.string().min(1, "Bitte ein Datum eintragen."),
      title: z.string().min(2, "Bitte einen Titel eintragen.").max(160),
      importance: z.enum(["standard", "important", "milestone"]),
    })
    .safeParse({
      event_date: String(formData.get("event_date") ?? ""),
      title: String(formData.get("title") ?? ""),
      importance: String(formData.get("importance") ?? "standard"),
    });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.at(0)?.message ?? "Bitte prüfe die Eingaben." };
  }

  upsertEvent({
    id: event.id,
    slug: event.slug,
    event_date: parsed.data.event_date,
    title: parsed.data.title,
    description: event.description,
    importance: parsed.data.importance,
    image_url: event.image_url,
    video_url: event.video_url,
    audio_url: event.audio_url,
    pdf_url: event.pdf_url,
    gallery_urls: event.gallery_urls,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Schnellbearbeitung gespeichert." };
}

export async function updateAdminPassword(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  const admin = await requireAdmin();

  const currentPassword = String(formData.get("current_password") ?? "");
  const nextPassword = String(formData.get("next_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (nextPassword.length < 8) {
    return { ok: false, message: "Das neue Passwort muss mindestens 8 Zeichen lang sein." };
  }

  if (nextPassword !== confirmPassword) {
    return { ok: false, message: "Die neuen Passwörter stimmen nicht überein." };
  }

  const result = changeAdminPassword(admin.id, currentPassword, nextPassword);
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
    importance: event.importance,
    image_url: event.image_url,
    video_url: event.video_url,
    audio_url: event.audio_url,
    pdf_url: event.pdf_url,
    gallery_urls: event.gallery_urls,
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function upsertAnnualMetricAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  await requireAdmin();

  const parsed = annualMetricSchema.safeParse({
    id: cleanOptionalText(formData.get("id")) ?? undefined,
    year: String(formData.get("year") ?? ""),
    label: String(formData.get("label") ?? ""),
    value: formData.get("value"),
    unit: String(formData.get("unit") ?? ""),
    comparison_label: String(formData.get("comparison_label") ?? ""),
    comparison_value: formData.get("comparison_value"),
    comparison_unit: String(formData.get("comparison_unit") ?? ""),
    description: String(formData.get("description") ?? ""),
    display_order: formData.get("display_order"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.at(0)?.message ?? "Bitte prüfe die Eingaben." };
  }

  const data = parsed.data;
  const hasComparisonLabel = Boolean(data.comparison_label);
  const hasComparisonValue = data.comparison_value !== "" && data.comparison_value !== undefined;

  if (hasComparisonLabel !== hasComparisonValue) {
    return { ok: false, message: "Vergleichsbezeichnung und Vergleichswert bitte gemeinsam ausfüllen." };
  }

  upsertAnnualMetric({
    id: data.id,
    year: data.year,
    label: data.label,
    value: data.value,
    unit: data.unit || null,
    comparison_label: data.comparison_label || null,
    comparison_value: hasComparisonValue ? Number(data.comparison_value) : null,
    comparison_unit: data.comparison_unit || null,
    description: data.description || null,
    display_order: data.display_order,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Jahreskennzahl gespeichert." };
}

export async function deleteAnnualMetricAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("Keine Kennzahlen-ID gefunden.");
  }

  deleteAnnualMetric(id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function duplicateAnnualMetricAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const metric = getAnnualMetricById(id);
  if (!metric) {
    throw new Error("Kennzahl nicht gefunden.");
  }

  const newId = upsertAnnualMetric({
    year: metric.year,
    label: `${metric.label} Kopie`,
    value: metric.value,
    unit: metric.unit,
    comparison_label: metric.comparison_label,
    comparison_value: metric.comparison_value,
    comparison_unit: metric.comparison_unit,
    description: metric.description,
    display_order: metric.display_order,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin/kennzahlen/${newId}`);
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

export async function createAdminUserAction(
  _previousState: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  await requireAdmin();

  const parsed = adminUserSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.at(0)?.message ?? "Bitte prüfe die Eingaben." };
  }

  try {
    createAdminUser({
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
    });
  } catch {
    return { ok: false, message: "Diese E-Mail-Adresse ist bereits als Admin vorhanden." };
  }

  revalidatePath("/admin/einstellungen");
  return { ok: true, message: "Admin-Benutzer angelegt." };
}

export async function deleteAdminUserAction(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  if (!userId) {
    throw new Error("Keine Benutzer-ID gefunden.");
  }

  deleteAdminUser(userId);
  revalidatePath("/admin/einstellungen");
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
