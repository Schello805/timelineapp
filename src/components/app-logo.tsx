import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/env";

export function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="inline-flex items-center gap-3" href="/" aria-label={`${siteConfig.name} Startseite`}>
      <Image
        src="/logo-timeline.png"
        alt=""
        width={compact ? 40 : 56}
        height={compact ? 40 : 56}
        className="rounded-lg shadow-sm"
        priority={!compact}
      />
      <span className={compact ? "text-sm font-semibold text-stone-900" : "text-xl font-semibold text-stone-950"}>
        {siteConfig.name}
      </span>
    </Link>
  );
}
