import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createUploadFileName, uploadRoot } from "@/lib/uploads";

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

  if (!request.body) {
    return NextResponse.json({ ok: false, message: "Leerer Upload." }, { status: 400 });
  }

  const extension = fileName.split(".").pop()?.toLowerCase() || "bin";
  const outputName = createUploadFileName(fileName, extension);
  const directory = path.join(uploadRoot, "videos");
  const outputPath = path.join(directory, outputName);

  await fs.promises.mkdir(directory, { recursive: true });
  await pipeline(Readable.fromWeb(request.body as never), fs.createWriteStream(outputPath));

  return NextResponse.json({
    ok: true,
    path: `/uploads/videos/${outputName}`,
    message: "Video vollständig hochgeladen.",
  });
}
