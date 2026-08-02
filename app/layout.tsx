import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bias-Aware 360° Review System",
  description:
    "Evidence-cited performance reviews with automatic bias detection and human-in-the-loop approval.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">{children}</body>
    </html>
  );
}
