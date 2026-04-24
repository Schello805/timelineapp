import { unstable_noStore as noStore } from "next/cache";
import { demoEvents } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { TimelineEvent } from "@/lib/types";
export { formatEventDate, getVideoEmbedUrl, getYear } from "@/lib/timeline-format";

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  noStore();

  if (!isSupabaseConfigured) {
    return demoEvents;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Failed to fetch timeline events", error);
    return demoEvents;
  }

  return data ?? [];
}
