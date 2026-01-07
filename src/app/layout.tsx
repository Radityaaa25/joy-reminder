import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; // Import Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Joy Reminder",
  description: "Aplikasi Pengingat Pajak",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        {/* Pasang Toaster disini agar alert muncul */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}