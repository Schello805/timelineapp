"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";

export function QrCodeButton({ url, title }: { url: string; title: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  async function showQrCode() {
    setQrUrl(await QRCode.toDataURL(url, { margin: 1, width: 320 }));
  }

  return (
    <div className="relative">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
        onClick={showQrCode}
        type="button"
      >
        <QrCode className="h-4 w-4" />
        QR
      </button>
      {qrUrl ? (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-stone-200 bg-white p-4 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mx-auto h-48 w-48" src={qrUrl} alt={`QR-Code für ${title}`} />
          <p className="mt-3 break-all text-xs leading-5 text-stone-600">{url}</p>
          <div className="mt-3 flex gap-2">
            <a
              className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-stone-950 px-3 text-xs font-semibold text-white"
              href={qrUrl}
              download={`${title.replace(/[^a-zA-Z0-9-]+/g, "-")}-qr.png`}
            >
              Herunterladen
            </a>
            <button
              className="h-9 rounded-md border border-stone-300 px-3 text-xs font-semibold text-stone-800"
              onClick={() => setQrUrl(null)}
              type="button"
            >
              Schließen
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
