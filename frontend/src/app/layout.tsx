import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECHO — AI-Powered Educational Debugging Laboratory",
  description: "Don't just fix the mistake. Understand the moment it was made.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-canvas-50 text-zinc-900 antialiased overflow-x-hidden selection:bg-brand-100 selection:text-brand-700">
        {children}
      </body>
    </html>
  );
}
