import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const uploadRoot = path.join(process.cwd(), "public", "uploads");

export async function saveUpload(file: File | null, folder: "images" | "pdfs") {
  if (!file || file.size === 0) return null;

  const bytes = Buffer.from(await file.arrayBuffer());
  const isImage = folder === "images" && file.type.startsWith("image/");
  const extension = isImage ? "webp" : file.name.split(".").pop() || "bin";
  const safeBase = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);
  const name = `${crypto.randomUUID()}-${safeBase}.${extension}`;
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
