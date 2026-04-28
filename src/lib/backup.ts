import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { listAnnualMetrics, listTimelineEvents, replaceAnnualMetrics, replaceTimelineEvents } from "@/lib/db";
import { listPublicSettings, setTimelineOwnerName } from "@/lib/settings";
import type { AnnualMetric, TimelineEvent } from "@/lib/types";

const uploadRoot = path.join(process.cwd(), "public", "uploads");
const backupRoot = path.join(process.cwd(), "data", "backups");
const backupVersion = 1;

const eventSchema = z.object({
  id: z.string().min(1),
  slug: z.string().nullable().optional(),
  event_date: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  importance: z.enum(["standard", "important", "milestone"]).optional(),
  image_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
  pdf_url: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const annualMetricSchema = z.object({
  id: z.string().min(1),
  year: z.string().min(4),
  label: z.string().min(1),
  value: z.number(),
  unit: z.string().nullable().optional(),
  comparison_label: z.string().nullable().optional(),
  comparison_value: z.number().nullable().optional(),
  comparison_unit: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  display_order: z.number().int().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const backupSchema = z.object({
  app: z.literal("media-timeline"),
  version: z.number().int().min(1),
  exported_at: z.string(),
  settings: z
    .object({
      timeline_owner_name: z.string().optional(),
    })
    .optional(),
  events: z.array(eventSchema),
  annual_metrics: z.array(annualMetricSchema).optional(),
  files: z
    .array(
      z.object({
        path: z.string().startsWith("/uploads/"),
        mime: z.string().optional(),
        data: z.string().min(1),
      }),
    )
    .optional(),
});

export type TimelineBackup = z.infer<typeof backupSchema>;

export async function createTimelineBackup(): Promise<TimelineBackup> {
  const events = listTimelineEvents();
  const annualMetrics = listAnnualMetrics();
  const files = await collectLocalFiles(events);

  return {
    app: "media-timeline",
    version: backupVersion,
    exported_at: new Date().toISOString(),
    settings: listPublicSettings(),
    events,
    annual_metrics: annualMetrics,
    files,
  };
}

export async function writeSafetyBackup(reason = "before-restore") {
  const backup = await createTimelineBackup();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `media-timeline-${reason}-${timestamp}.json`;
  const filePath = path.join(backupRoot, fileName);

  await fs.mkdir(backupRoot, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(backup, null, 2));

  return filePath;
}

export async function restoreTimelineBackup(rawJson: string) {
  const parsedJson = JSON.parse(rawJson) as unknown;
  const backup = backupSchema.parse(parsedJson);

  await restoreLocalFiles(backup.files ?? []);
  replaceTimelineEvents(backup.events.map(normalizeEvent));
  replaceAnnualMetrics((backup.annual_metrics ?? []).map(normalizeAnnualMetric));
  if (backup.settings?.timeline_owner_name) {
    setTimelineOwnerName(backup.settings.timeline_owner_name);
  }

  return { eventCount: backup.events.length, fileCount: backup.files?.length ?? 0 };
}

function normalizeEvent(event: z.infer<typeof eventSchema>): TimelineEvent {
  return {
    id: event.id,
    slug: event.slug ?? "",
    event_date: event.event_date,
    title: event.title,
    description: event.description,
    importance: event.importance ?? "standard",
    image_url: event.image_url ?? null,
    video_url: event.video_url ?? null,
    audio_url: event.audio_url ?? null,
    pdf_url: event.pdf_url ?? null,
    created_at: event.created_at,
    updated_at: event.updated_at,
  };
}

function normalizeAnnualMetric(metric: z.infer<typeof annualMetricSchema>): AnnualMetric {
  return {
    id: metric.id,
    year: metric.year,
    label: metric.label,
    value: metric.value,
    unit: metric.unit ?? null,
    comparison_label: metric.comparison_label ?? null,
    comparison_value: metric.comparison_value ?? null,
    comparison_unit: metric.comparison_unit ?? null,
    description: metric.description ?? null,
    display_order: metric.display_order ?? 0,
    created_at: metric.created_at,
    updated_at: metric.updated_at,
  };
}

async function collectLocalFiles(events: TimelineEvent[]) {
  const paths = new Set<string>();

  for (const event of events) {
    for (const url of [event.image_url, event.video_url, event.audio_url, event.pdf_url]) {
      if (url?.startsWith("/uploads/")) paths.add(url);
    }
  }

  const files: TimelineBackup["files"] = [];

  for (const publicPath of paths) {
    const filePath = resolveUploadPath(publicPath);
    try {
      const data = await fs.readFile(filePath);
      files.push({
        path: publicPath,
        mime: guessMime(publicPath),
        data: data.toString("base64"),
      });
    } catch {
      // A missing upload should not block a database backup.
    }
  }

  return files;
}

async function restoreLocalFiles(files: NonNullable<TimelineBackup["files"]>) {
  for (const file of files) {
    const outputPath = resolveUploadPath(file.path);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(file.data, "base64"));
  }
}

function resolveUploadPath(publicPath: string) {
  const relativePath = publicPath.replace(/^\/uploads\//, "");
  const resolved = path.resolve(uploadRoot, relativePath);
  const root = path.resolve(uploadRoot);

  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Ungültiger Upload-Pfad im Backup.");
  }

  return resolved;
}

function guessMime(publicPath: string) {
  const extension = publicPath.split(".").pop()?.toLowerCase();
  if (extension === "webp") return "image/webp";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "gif") return "image/gif";
  if (extension === "pdf") return "application/pdf";
  if (extension === "mp4") return "video/mp4";
  if (extension === "webm") return "video/webm";
  if (extension === "mov") return "video/quicktime";
  if (extension === "mp3") return "audio/mpeg";
  if (extension === "wav") return "audio/wav";
  if (extension === "ogg") return "audio/ogg";
  if (extension === "m4a") return "audio/mp4";
  return "application/octet-stream";
}
