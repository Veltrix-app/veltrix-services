import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { DocsShell } from "@/components/docs/docs-shell";
import { docsSiteDescription, docsSiteName, docsSiteUrl } from "@/lib/docs/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(docsSiteUrl),
  title: {
    default: docsSiteName,
    template: `%s | ${docsSiteName}`,
  },
  description: docsSiteDescription,
  openGraph: {
    title: docsSiteName,
    description: docsSiteDescription,
    url: docsSiteUrl,
    siteName: docsSiteName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: docsSiteName,
    description: docsSiteDescription,
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
