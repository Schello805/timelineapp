import { NextResponse } from "next/server";
import { listTimelineEvents } from "@/lib/db";

export function GET() {
  try {
    listTimelineEvents();
    return NextResponse.json({ ok: true, service: "media-timeline" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
