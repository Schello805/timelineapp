import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { uploadRoot } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string[] }> };

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params;
  const relativePath = slug.join("/");
  const resolvedPath = path.resolve(uploadRoot, "audios", relativePath);
  const audioRoot = path.resolve(uploadRoot, "audios");

  if (!resolvedPath.startsWith(`${audioRoot}${path.sep}`)) {
    return new Response("Ungültiger Pfad.", { status: 400 });
  }

  try {
    const stat = await fs.promises.stat(resolvedPath);
    const range = request.headers.get("range");
    const mimeType = getAudioMimeType(resolvedPath);

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = Number(match?.[1] || 0);
      const end = Number(match?.[2] || stat.size - 1);

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stat.size) {
        return new Response("Ungültiger Range-Header.", { status: 416 });
      }

      const stream = fs.createReadStream(resolvedPath, { start, end });
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const stream = fs.createReadStream(resolvedPath);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(stat.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Datei nicht gefunden.", { status: 404 });
  }
}

function getAudioMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".wav") return "audio/wav";
  if (extension === ".ogg") return "audio/ogg";
  if (extension === ".m4a") return "audio/mp4";
  if (extension === ".aac") return "audio/aac";
  return "application/octet-stream";
}
