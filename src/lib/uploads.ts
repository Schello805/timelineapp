import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const uploadRoot = path.join(process.cwd(), "public", "uploads");

export function sanitizeUploadBase(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "upload";
}

export function createUploadFileName(fileName: string, extension: string) {
  return `${crypto.randomUUID()}-${sanitizeUploadBase(fileName)}.${extension}`;
}

export function detectUploadKind(fileName: string, mimeType: string) {
  const lowerMime = mimeType.toLowerCase();
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (lowerMime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return "images" as const;
  }
  if (lowerMime.startsWith("video/") || ["mp4", "webm", "mov", "m4v", "ogg"].includes(extension)) {
    return "videos" as const;
  }
  if (lowerMime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac"].includes(extension)) {
    return "audios" as const;
  }
  if (lowerMime === "application/pdf" || extension === "pdf") {
    return "pdfs" as const;
  }

  return null;
}

export async function saveUploadBuffer(fileName: string, mimeType: string, bytes: Buffer) {
  const folder = detectUploadKind(fileName, mimeType);
  if (!folder) {
    throw new Error("unsupported-file-type");
  }

  const isImage = folder === "images";
  const extension = isImage ? "webp" : fileName.split(".").pop() || "bin";
  const name = createUploadFileName(fileName, extension);
  const dir = path.join(uploadRoot, folder);
  const output = isImage
    ? await sharp(bytes)
        .rotate()
        .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
    : bytes;

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), output);

  return { folder, path: `/uploads/${folder}/${name}` };
}

export async function saveUpload(file: File | null, folder: "images" | "videos" | "audios" | "pdfs") {
  if (!file || file.size === 0) return null;

  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await saveUploadBuffer(file.name, folder === "images" ? file.type : "", bytes).catch(async (error) => {
    if (folder === "images") throw error;
    const extension = file.name.split(".").pop() || "bin";
    const name = createUploadFileName(file.name, extension);
    const dir = path.join(uploadRoot, folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), bytes);
    return { folder, path: `/uploads/${folder}/${name}` };
  });

  return result.path;
}
