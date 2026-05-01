import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio — AI Production Platform",
  description: "AI-powered animated series production platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
