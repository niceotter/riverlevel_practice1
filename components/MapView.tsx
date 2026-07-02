'use client';
// components/MapView.tsx

import { useEffect, useRef, useState } from 'react';
import { FloodItem } from '@/types/flood';
import FloatWindow from './FloatWindow';

declare global {
  interface Window { vw?: any; }
}

export default function MapView() {
  const mapRef     = useRef<HTMLDivElement>(null);
  const scriptRef  = useRef<boolean>(false); // 중복 삽입 방지

  const [floatItem, setFloatItem] = useState<FloodItem | null>(null);
  const [floatPos,  setFloatPos]  = useState({ x: 0, y: 0 });
  const [areaWidth, setAreaWidth] = useState(0);
  const [mapReady,  setMapReady]  = useState(false);

  // ── VWorld 지도 초기화 ───────────────────────────
  // 기존 index.html 방식과 동일하게:
  // <div id="vworld-map"> 안에 <script src="/js/vworld-map.js"> 삽입
  useEffect(() => {
    const container = document.getElementById('vworld-map');
    if (!container || scriptRef.current) return;
    scriptRef.current = true;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src  = '/js/vworld-map.js';  // public/js/vworld-map.js
    script.onload = () => {
      setMapReady(true);
      console.log('[MapView] VWorld 지도 초기화 완료');
    };
    script.onerror = () => {
      console.error('[MapView] vworld-map.js 로드 실패');
    };

    container.appendChild(script);
  }, []);

  // ── 영역 너비 추적 (FloatWindow 경계 계산용) ────
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAreaWidth(el.offsetWidth));
    ro.observe(el);
    setAreaWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // ── 사이드바 관측소 클릭 → 지도 이동 ───────────
  // vworld-map.js 에서 vmap 변수를 window.vmap 으로 노출해야 동작합니다.
  // vworld-map.js 에서: let vmap = ... → window.vmap = new vw.ol3.Map(...)
  useEffect(() => {
    const handler = (e: Event) => {
      const item = (e as CustomEvent<FloodItem>).detail;
      const vmap = (window as any).vmap;
      if (!vmap || !item.lat || !item.lng) return;
      // EPSG:3857 변환 (경위도 → 미터)
      const x = parseFloat(item.lng) * 20037508.34 / 180;
      const lat = parseFloat(item.lat);
      const y = Math.log(Math.tan((90 + lat) * Math.PI / 360))
                / (Math.PI / 180) * 20037508.34 / 180;
      vmap.getView().setCenter([x, y]);
      vmap.getView().setZoom(15);
    };
    window.addEventListener('siteSelect', handler);
    return () => window.removeEventListener('siteSelect', handler);
  }, []);

  // ── 마커 생성 ────────────────────────────────────
  // flood 데이터 로드 후 Sidebar에서 floodDataLoaded 이벤트 발생 시 수신
  useEffect(() => {
    const handler = (e: Event) => {
      const items = (e as CustomEvent<FloodItem[]>).detail;
      const vmap  = (window as any).vmap;
      const vw    = window.vw;
      if (!vmap || !vw) return;

      const markerLayer = new vw.ol3.layer.Marker(vmap);

      items.forEach(item => {
        if (!item.lat || !item.lng) return;

        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lng);
        const x = lng * 20037508.34 / 180;
        const y = Math.log(Math.tan((90 + lat) * Math.PI / 360))
                  / (Math.PI / 180) * 20037508.34 / 180;

        vw.ol3.markerOption = {
          x,
          y,
          epsg: 'EPSG:3857',
          title: item.siteName,
          contents: `현재 수위: ${item.fludLevel}m`,
          iconUrl: '/pin.svg',  // public/pin.svg 추가 필요
          text: {
            offsetX: -20,
            offsetY: 12,
            font: '13px sans-serif',
            fill:   { color: '#000' },
            stroke: { color: '#fff', width: 3 },
            text: item.siteName,
          },
        };
        markerLayer.addMarker(vw.ol3.markerOption);
      });

      vmap.addLayer(markerLayer);
    };

    window.addEventListener('floodDataLoaded', handler);
    return () => window.removeEventListener('floodDataLoaded', handler);
  }, [mapReady]);

  return (
    <main
      ref={mapRef}
      style={{
        gridColumn: '2',
        gridRow:    '2',
        paddingTop: '10px',
        position:   'relative',
        background: '#111827',
        overflow:   'hidden',
      }}
    >
      {/* VWorld 지도 컨테이너 — script가 이 div 안에 삽입됩니다 */}
      <div id="vworld-map" style={{ width: '100%', height: '100%' }} />

      {/* 로딩 플레이스홀더 */}
      {!mapReady && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1rem', color: 'var(--text-muted)', pointerEvents: 'none',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.25 }}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          <p style={{ fontSize: '0.8rem', letterSpacing: '0.08em',
                      textTransform: 'uppercase', opacity: 0.45 }}>
            지도 로딩 중…
          </p>
        </div>
      )}

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
