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

export async function saveUpload(file: File | null, folder: "images" | "videos" | "audios" | "pdfs") {
  if (!file || file.size === 0) return null;

  const bytes = Buffer.from(await file.arrayBuffer());
  const isImage = folder === "images" && file.type.startsWith("image/");
  const extension = isImage ? "webp" : file.name.split(".").pop() || "bin";
  const name = createUploadFileName(file.name, extension);
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

  return `/uploads/${folder}/${name}`;
}
