import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ودّي — Group Games",
  description: "less boring, more playing",
  manifest: "/manifest.json",
  themeColor: "#f5c842",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ودّي",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="ltr">
      <body>{children}</body>
    </html>
  );
}