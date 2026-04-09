import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Try ’n Buy | Try Before You Buy Running Shoes",
  description:
    "A Next.js MVP for trial-based running shoe rentals with checkout, deposits, and admin operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
