// app/layout.tsx
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import Script from "next/script";
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

import { SidebarProvider } from '@/components/SidebarContext';

// const pretendard = localFont({
//   src: '../public/PretendardVariable.woff2',
//   variable: '--font-pretendard',
//   weight: '45 920', // variable font의 가변 굵기 범위
//   display: 'swap',
// });

export const metadata: Metadata = {
  title: '실시간 하천 수위 현황',
//  themeColor: "#ffffff"
//  description: '실시간 침수 현황 지도',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      {/* className={pretendard.variable} */}
      <head>
      </head>

      <body>
        <SidebarProvider>
          {children}
        </SidebarProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}