import { NextResponse } from "next/server";
import { getAppRevision } from "@/lib/revision";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { revision: getAppRevision() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
