import { getSetting, setSetting } from "@/lib/db";
import { siteConfig } from "@/lib/env";

const timelineOwnerNameKey = "timeline_owner_name";

export function getTimelineOwnerName() {
  return getSetting(timelineOwnerNameKey)?.value || siteConfig.name;
}

export function setTimelineOwnerName(value: string) {
  setSetting(timelineOwnerNameKey, value.trim());
}

export function listPublicSettings() {
  return {
    timeline_owner_name: getTimelineOwnerName(),
  };
}

