import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ودّي — Group Games",
  description: "less boring, more playing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
