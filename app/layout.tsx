import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SwRegister from "./sw-register";

const plexKR = IBM_Plex_Sans_KR({
  variable: "--font-plex-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "카페 무무무 인벤토리 매니저",
  description: "카페 무무무 재고 관리 · 발주 PWA",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "무무무 재고" },
};

export const viewport: Viewport = {
  themeColor: "#6f4e37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${plexKR.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* 하단 네비 높이만큼 콘텐츠 하단 여백 확보. 폭은 각 페이지가 제어(재고관리는 풀폭 2분할) */}
        <main className="pb-20">{children}</main>
        <BottomNav />
        <SwRegister />
      </body>
    </html>
  );
}
