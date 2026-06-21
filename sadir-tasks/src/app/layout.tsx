import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "سدير مهام | منصة إدارة المشاريع والمهام",
  description: "منصة داخلية لإدارة وإصدار وتتبع المهام والمشاريع",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Providers session={session}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
