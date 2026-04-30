"use client";

import { useEffect, useState } from "react";

type VersionStatus = {
  currentVersion: string;
  remoteVersion: string | null;
  updateAvailable: boolean;
};

export function RevisionStatus({ revision }: { revision: string }) {
  const [status, setStatus] = useState<VersionStatus>({
    currentVersion: revision,
    remoteVersion: null,
    updateAvailable: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadVersionStatus() {
      try {
        const response = await fetch("/api/version-status", { cache: "no-store" });
        if (!response.ok) return;

        const nextStatus = (await response.json()) as VersionStatus;
        if (!cancelled) {
          setStatus(nextStatus);
        }
      } catch {
        // Keep the local revision visible even if GitHub cannot be reached.
      }
    }

    loadVersionStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const tooltip = status.updateAvailable
    ? `Neue Version auf GitHub: ${status.remoteVersion}. Update auf dem Server mit:\ncd /opt/media-timeline\nsudo ./scripts/update.sh`
    : undefined;

  return (
    <span className="inline-flex items-center gap-2">
      <span>Rev. {revision}</span>
      {status.updateAvailable ? (
        <span className="group relative inline-flex items-center">
          <span
            className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200"
            aria-label={`Update verfügbar: ${status.remoteVersion}`}
            title={tooltip}
          >
            Update verfügbar
          </span>
          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-stone-950 px-3 py-2 text-[11px] font-medium leading-5 text-white shadow-lg group-hover:block">
            Neue Version auf GitHub: {status.remoteVersion}
            <br />
            Update mit:
            <br />
            <span className="font-mono">cd /opt/media-timeline</span>
            <br />
            <span className="font-mono">sudo ./scripts/update.sh</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
