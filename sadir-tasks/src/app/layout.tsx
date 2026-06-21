import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سدير مهام | منصة إدارة المشاريع والمهام",
  description: "منصة داخلية لإدارة وإصدار وتتبع المهام والمشاريع",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
