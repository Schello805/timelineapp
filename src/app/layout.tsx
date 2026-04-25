import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { siteConfig } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.name,
  description: siteConfig.description,
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/logo-timeline.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#f6f3ee] text-stone-950">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
