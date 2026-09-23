import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

/*
 * Root layout: font + provider toàn app (TanStack Query, phiên đăng nhập, toast).
 * Hai route group bên dưới tự dựng khung riêng: (auth) là màn trống cho đăng
 * nhập, (dashboard) là khung sidebar + header.
 */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Bot Craw Data",
    template: "%s | Bot Craw Data",
  },
  description:
    "Công cụ nội bộ quét Google Maps thu thập lead doanh nghiệp: tên công ty, vị trí, số điện thoại, website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnam.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
