import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: "BrewLite · Đặt cà phê không tiền mặt",
    template: "%s · BrewLite",
  },
  description:
    "BrewLite giúp bạn đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          {/* Header đọc usePathname() nên cần Suspense với các route động (/menu/[id]...) */}
          <Suspense fallback={<div className="h-[73px] border-b border-line bg-white" />}>
            <Header />
          </Suspense>
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
