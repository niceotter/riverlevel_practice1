// app/layout.tsx
import { Analytics } from "@vercel/analytics/next"

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '사이트 제목',
  description: '실시간 침수 현황 지도',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
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
      </body>
    </html>
  );
}
