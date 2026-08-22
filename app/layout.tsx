import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwiftOrder",
  description: "QR code ordering MVP for restaurants"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
