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
    <>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
        onClick={showQrCode}
        type="button"
      >
        <QrCode className="h-4 w-4" />
        QR
      </button>
      {qrUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4"
          onClick={() => setQrUrl(null)}
        >
          <div
            className="max-h-[calc(100svh-2rem)] w-full max-w-sm overflow-y-auto rounded-lg border border-stone-200 bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-teal-700">QR-Code</p>
                <h2 className="mt-1 text-lg font-semibold leading-6 text-stone-950">{title}</h2>
              </div>
              <button
                className="h-9 rounded-md border border-stone-300 px-3 text-xs font-semibold text-stone-800"
                onClick={() => setQrUrl(null)}
                type="button"
              >
                Schließen
              </button>
            </div>
            <div className="mt-5 rounded-lg bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mx-auto h-64 w-64 max-w-full" src={qrUrl} alt={`QR-Code für ${title}`} />
            </div>
            <p className="mt-3 break-all rounded-md bg-stone-50 p-3 text-xs leading-5 text-stone-600">{url}</p>
            <a
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
              href={qrUrl}
              download={`${title.replace(/[^a-zA-Z0-9-]+/g, "-")}-qr.png`}
            >
              Herunterladen
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
