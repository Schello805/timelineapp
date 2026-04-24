import { TimelineClient } from "@/components/timeline-client";
import { getTimelineEvents } from "@/lib/timeline";

export default async function Home() {
  const events = await getTimelineEvents();
  return <TimelineClient events={events} />;
}
