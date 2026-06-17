// app/layout.tsx
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

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
        
        <script src="https://map.vworld.kr/js/vworldMapInit.js.do?version=2.0&apiKey=DA227030-273E-37F4-A3DD-73D741FD3A5B&domain=riverlevel-info.kr">
        </script>
        {/*
      
        
          ╔══════════════════════════════════════════════════╗
          ║  VWorld 지도 API 스크립트                         ║
          ║  YOUR_VWORLD_API_KEY 를 발급받은 키로 교체 후     ║
          ║  주석을 해제하세요                                ║
          ╚══════════════════════════════════════════════════╝
          <script
            src="https://map.vworld.kr/js/vworldMapInit.js.do?version=2.0&apiKey=YOUR_VWORLD_API_KEY"
          />
        */}
      </head>
      <body>
        {children}
        
        
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
