import fs from "node:fs/promises";
import path from "node:path";

const uploadRoot = path.join(process.cwd(), "public", "uploads");

export async function saveUpload(file: File | null, folder: "images" | "pdfs") {
  if (!file || file.size === 0) return null;

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const name = `${crypto.randomUUID()}-${safeName}`;
  const dir = path.join(uploadRoot, folder);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);

  return `/uploads/${folder}/${name}`;
}
