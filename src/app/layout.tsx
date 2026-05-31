import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.APP_URL ??
  "http://localhost:3000";
const siteDescription =
  "A moderated Geometry Dash community leaderboard for approved nerfed demon completions.";
const themeScript = `
(function () {
  try {
    var key = "ndl-theme";
    var theme = localStorage.getItem(key) || "light";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var useDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", useDark);
  } catch (_) {}
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NDL - Nerfed Demonlist",
    template: "%s | NDL",
  },
  description: siteDescription,
  applicationName: "NDL",
  openGraph: {
    title: "NDL - Nerfed Demonlist",
    description: siteDescription,
    url: "/",
    siteName: "NDL",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "NDL - Nerfed Demonlist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NDL - Nerfed Demonlist",
    description: siteDescription,
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
