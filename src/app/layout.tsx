import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nova Suite | Unified Mission Control",
  description: "Galaxy-Scale Data Transformation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="deep-space">
        <div className="galaxy-bg"></div>
        <div className="star-layer stars-1"></div>
        <div className="star-layer stars-2"></div>
        <div className="star-layer stars-3"></div>
        {children}
      </body>
    </html>
  );
}
