import type { Metadata } from "next";
import { FeedbackWidget } from "@/app/components/feedback-widget";
import "./globals.css";

export const metadata: Metadata = {
  title: "Try ’n Buy | Try Before You Buy Running Shoes",
  description:
    "A Next.js MVP for trial-based running shoe rentals with checkout, deposits, and admin operations.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Try ’n Buy",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
