import type { Metadata } from "next";
import { Syne } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const syne = Syne({ subsets: ["latin"] });

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
      <body className={syne.className}>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
