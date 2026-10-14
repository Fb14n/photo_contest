import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhotoContest – Fotowettbewerb-Plattform",
  description: "Erstelle, verwalte und juriere Fotowettbewerbe lokal und sicher.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 antialiased selection:bg-sky-500 selection:text-white">
        <Suspense fallback={<header className="h-16 border-b border-neutral-800 bg-neutral-950/80" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-900 bg-neutral-950/80 py-8 text-center text-xs text-neutral-400">
          <div className="mx-auto max-w-7xl px-4">
            <p>PhotoContest Plattform • Selbstgehostet & Lokale SQLite-Datenbank</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
