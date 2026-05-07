"use client";

import { useEffect, useRef, useState } from "react";

type RevisionResponse = {
  revision?: string;
};

export function AdminDeployGuard({ revision }: { revision: string }) {
  const [refreshing, setRefreshing] = useState(false);
  const reloadTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkRevision() {
      if (cancelled || refreshing) return;

      try {
        const response = await fetch("/api/revision", {
          cache: "no-store",
          signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) return;

        const payload = (await response.json()) as RevisionResponse;
        if (cancelled || !payload.revision || payload.revision === revision) return;

        setRefreshing(true);
        reloadTimer.current = window.setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch {
        // Ignore transient network issues inside the browser.
      }
    }

    const intervalId = window.setInterval(checkRevision, 45000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkRevision();
      }
    };

    window.addEventListener("focus", checkRevision);
    document.addEventListener("visibilitychange", onVisibilityChange);
    void checkRevision();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkRevision);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (reloadTimer.current !== null) {
        window.clearTimeout(reloadTimer.current);
      }
    };
  }, [refreshing, revision]);

  if (!refreshing) return null;

  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow-sm">
      Neue Version erkannt. Der Adminbereich wird kurz aktualisiert, damit keine veralteten Formulare aktiv bleiben.
    </div>
  );
}
