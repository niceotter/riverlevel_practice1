// app/layout.tsx
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import Script from "next/script";
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '실시간 하천 수위 현황',
//  themeColor: "#ffffff"
//  description: '실시간 침수 현황 지도',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
      </head>
      <body>
        {children}
        <Script
          src="https://map.vworld.kr/js/vworldMapInit.js.do?version=2.0&apiKey=DA227030-273E-37F4-A3DD-73D741FD3A5B&domain=riverlevel-info.kr"
          strategy="beforeInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}