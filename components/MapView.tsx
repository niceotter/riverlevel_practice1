'use client';
// components/MapView.tsx

import { useEffect, useRef, useState } from 'react';
import { FloodItem } from '@/types/flood';
import FloatWindow from './FloatWindow';

export default function MapView() {
  const mapRef    = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [floatItem, setFloatItem] = useState<FloodItem | null>(null);
  const [floatPos,  setFloatPos]  = useState({ x: 0, y: 0 });
  const [areaWidth, setAreaWidth] = useState(0);

  // ── 영역 너비 추적 (FloatWindow 경계 계산용) ────
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAreaWidth(el.offsetWidth));
    ro.observe(el);
    setAreaWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // ── 사이드바 관측소 클릭 → iframe에 지도 이동 명령 ──
  useEffect(() => {
    const handler = (e: Event) => {
      const item = (e as CustomEvent<FloodItem>).detail;
      if (!item.lat || !item.lng) return;
      iframeRef.current?.contentWindow?.postMessage({
        type: 'moveToSite',
        lat:  parseFloat(item.lat),
        lng:  parseFloat(item.lng),
      }, '*');
    };
    window.addEventListener('siteSelect', handler);
    return () => window.removeEventListener('siteSelect', handler);
  }, []);

  return (
    <main
      ref={mapRef}
      style={{
        gridColumn: '2',
        gridRow:    '2',
        paddingTop: '0px',
        position:   'relative',
        background: '#63adf8',
        overflow:   'hidden',
      }}
    >
      <iframe
        ref={iframeRef}
        src="/map.html"
        style={{
          width:  '100%',
          height: '100%',
          border: 'none',
        }}
        title="VWorld 지도"
      />

      {/* Float Window */}
      <FloatWindow
        item={floatItem}
        x={floatPos.x}
        y={floatPos.y}
        areaWidth={areaWidth}
      />
    </main>
  );
}
