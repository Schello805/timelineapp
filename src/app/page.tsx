import { TimelineClient } from "@/components/timeline-client";
import { getTimelineOwnerName } from "@/lib/settings";
import { getTimelineEvents } from "@/lib/timeline";

export default async function Home() {
  const events = await getTimelineEvents();
  const ownerName = getTimelineOwnerName();

  return <TimelineClient events={events} ownerName={ownerName} />;
}
