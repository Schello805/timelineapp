import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { saveUploadBuffer } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, message: "Nicht autorisiert." }, { status: 401 });
  }

  const fileNameHeader = request.headers.get("x-file-name")?.trim();
  const fileName = fileNameHeader ? decodeURIComponent(fileNameHeader) : "";
  if (!fileName) {
    return NextResponse.json({ ok: false, message: "Dateiname fehlt." }, { status: 400 });
  }

  const mimeType = request.headers.get("content-type")?.trim() || "";
  const arrayBuffer = await request.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    return NextResponse.json({ ok: false, message: "Leerer Upload." }, { status: 400 });
  }

  try {
    const result = await saveUploadBuffer(fileName, mimeType, Buffer.from(arrayBuffer));
    const mediaType =
      result.folder === "images"
        ? "image"
        : result.folder === "videos"
          ? "video"
          : result.folder === "audios"
            ? "audio"
            : "pdf";

    return NextResponse.json({
      ok: true,
      mediaType,
      path: result.path,
      message: "Datei vollständig hochgeladen.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Dateityp nicht unterstützt. Bitte Bild, Video, Audio oder PDF hochladen." },
      { status: 400 },
    );
  }
}
