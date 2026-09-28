import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeoTürkiye - Gerçek Harita ile Coğrafya Test ve Öğrenme Platformu",
  description: "KPSS, YKS ve coğrafya meraklıları için gerçek Türkiye haritası üzerinde göller, dağlar, akarsular ve körleme koordinat bulma test platformu.",
  icons: {
    icon: [
      { url: "/logo.png?v=2", type: "image/png" },
    ],
    shortcut: "/logo.png?v=2",
    apple: "/logo.png?v=2",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
