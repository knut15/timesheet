import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SessionBoot } from "@/components/SessionBoot";

// 본문 글꼴 = Pretendard (2026-09-25 사용자 지시). npm pretendard 의 가변 폰트를 앱이 직접 제공한다 — 외부 CDN 없음
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "타임시트",
  description: "파트타임 출퇴근 기록과 급여 계산",
};

// viewport-fit=cover: 하단 내비가 env(safe-area-inset-bottom) 으로 홈 바를 피하게 한다 (없으면 env() 가 0). 확대는 막지 않는다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionBoot />
        {children}
      </body>
    </html>
  );
}
