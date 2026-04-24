import { unstable_noStore as noStore } from "next/cache";
import { demoEvents } from "@/lib/demo-data";
import { listTimelineEvents } from "@/lib/db";
import type { TimelineEvent } from "@/lib/types";
export { formatEventDate, getVideoEmbedUrl, getYear } from "@/lib/timeline-format";

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  noStore();

  try {
    const events = listTimelineEvents();
    return events.length ? events : demoEvents;
  } catch (error) {
    console.error("Failed to fetch timeline events", error);
    return demoEvents;
  }
}
