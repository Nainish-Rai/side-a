import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIDE A - Hi-Fi Music",
  description: "Hi-Fi music search and playback",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SIDE A",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        {/* Pre-establish TCP+TLS connections to external origins used at runtime.
            resources.tidal.com — album art images
            lyricsplus.prjktla.workers.dev — lyrics API */}
        <link rel="preconnect" href="https://resources.tidal.com" />
        <link
          rel="preconnect"
          href="https://lyricsplus.prjktla.workers.dev"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="antialiased"
        style={
          {
            "--font-geist-sans":
              'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            "--font-geist-mono":
              '"SFMono-Regular", "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace',
          } as React.CSSProperties
        }
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-foreground focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
