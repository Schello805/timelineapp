import { isAdminAuthenticated } from "@/lib/auth";
import { createTimelineBackup } from "@/lib/backup";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const backup = await createTimelineBackup();
  const date = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "content-disposition": `attachment; filename="media-timeline-backup-${date}.json"`,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
