import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ChainWeave AI - AI-Powered Cross-Chain NFTs",
  description: "Create unique AI-generated NFTs and mint them across multiple blockchain networks with ZetaChain's Universal Apps.",
  keywords: ["NFT", "AI", "ZetaChain", "Cross-chain", "Blockchain", "Digital Art"],
  authors: [{ name: "ChainWeave AI Team" }],
  creator: "ChainWeave AI",
  publisher: "ChainWeave AI",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "ChainWeave AI - AI-Powered Cross-Chain NFTs",
    description: "Create unique AI-generated NFTs and mint them across multiple blockchain networks",
    url: "https://chainweave-ai.com",
    siteName: "ChainWeave AI",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChainWeave AI - Cross-Chain NFT Platform',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainWeave AI - AI-Powered Cross-Chain NFTs",
    description: "Create unique AI-generated NFTs and mint them across multiple blockchain networks",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
