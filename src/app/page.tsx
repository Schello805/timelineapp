import { TimelineClient } from "@/components/timeline-client";
import { getTimelineOwnerName } from "@/lib/settings";
import { getAnnualMetrics, getTimelineEvents } from "@/lib/timeline";

export default async function Home() {
  const events = await getTimelineEvents();
  const annualMetrics = await getAnnualMetrics();
  const ownerName = getTimelineOwnerName();

  return <TimelineClient events={events} annualMetrics={annualMetrics} ownerName={ownerName} />;
}
