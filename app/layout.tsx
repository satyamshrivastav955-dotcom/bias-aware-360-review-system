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
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
