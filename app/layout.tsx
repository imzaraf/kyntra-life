import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  // Icons, favicon, apple-icon and the OG/Twitter images come from the file conventions in /app.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { siteName: "Kyntra Life", type: "website" },
  twitter: { card: "summary_large_image" },
  title: { default: "Kyntra Life — Your life, collected.", template: "%s · Kyntra Life" },
  description:
    "Kin what belongs to you. Track it. A luxurious personal Life OS: diary, planner, reminders and library.",
  applicationName: "Kyntra Life",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kyntra Life", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#171a17" },
  ],
  width: "device-width",
  interactiveWidget: "resizes-content",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
