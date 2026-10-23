import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECHO — Replay your code. Understand the bug.",
  description: "Don't just fix the mistake. Understand the moment it was made.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="h-full bg-background text-text-primary font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
