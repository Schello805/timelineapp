import { NextResponse } from "next/server";
import { getAppRevision } from "@/lib/revision";

const GITHUB_PACKAGE_URL = "https://raw.githubusercontent.com/Schello805/timelineapp/main/package.json";

export async function GET() {
  const currentVersion = getAppRevision();

  try {
    const response = await fetch(GITHUB_PACKAGE_URL, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return NextResponse.json({
        currentVersion,
        remoteVersion: null,
        updateAvailable: false,
      });
    }

    const payload = (await response.json()) as { version?: string };
    const remoteVersion = payload.version ?? null;

    return NextResponse.json({
      currentVersion,
      remoteVersion,
      updateAvailable: remoteVersion ? compareVersions(remoteVersion, currentVersion) > 0 : false,
    });
  } catch {
    return NextResponse.json({
      currentVersion,
      remoteVersion: null,
      updateAvailable: false,
    });
  }
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = right.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}
