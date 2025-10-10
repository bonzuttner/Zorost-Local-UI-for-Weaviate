import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Zorost Local UI for Weaviate - Zorost Intelligence",
  description: "Advanced Weaviate Vector Database Manager with Chat Interface - Developed by Zorost Intelligence",
  keywords: ["weaviate", "vector database", "ai", "machine learning", "rag", "semantic search", "zorost intelligence"],
  authors: [{ name: "Zorost Intelligence", url: "https://zorost.com" }],
  creator: "Zorost Intelligence",
  publisher: "Zorost Intelligence",
  metadataBase: new URL('https://zorost.com'),
  openGraph: {
    title: "Zorost Local UI for Weaviate - Zorost Intelligence",
    description: "Advanced Weaviate Vector Database Manager with Chat Interface",
    url: "https://zorost.com",
    siteName: "Zorost Intelligence",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zorost Local UI for Weaviate - Zorost Intelligence",
    description: "Advanced Weaviate Vector Database Manager with Chat Interface",
    creator: "@zorost",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

