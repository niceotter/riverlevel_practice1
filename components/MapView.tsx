'use client';
// components/MapView.tsx
//
// VWorld 지도 초기화 + 핀(마커) 관리 + FloatWindow 연동
//
// ┌──────────────────────────────────────────────────┐
// │  VWorld API 키 연결 방법                          │
// │  app/layout.tsx 의 주석 처리된 <script> 태그의   │
// │  YOUR_VWORLD_API_KEY 를 실제 키로 바꾸고          │
// │  주석을 해제하세요.                               │
// └──────────────────────────────────────────────────┘

import { useEffect, useRef, useState, useCallback } from 'react';
import { FloodItem } from '@/types/flood';
import FloatWindow from './FloatWindow';

// VWorld 전역 타입 선언 (실제 API 확인 후 필요시 수정)
declare global {
  interface Window {
    vw?: any;
    onVWorldReady?: () => void;
  }
}

// 지도 초기 중심 좌표 (부산)
const MAP_CENTER = { lat: 35.1796, lng: 129.0756 };
const MAP_ZOOM   = 12;

export default function MapView() {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef  = useRef<Record<string, any>>({});

  const [floatItem,  setFloatItem]  = useState<FloodItem | null>(null);
  const [floatPos,   setFloatPos]   = useState({ x: 0, y: 0 });
  const [areaWidth,  setAreaWidth]  = useState(0);
  const [mapReady,   setMapReady]   = useState(false);

  // ── 지도 초기화 ─────────────────────────────────
  {/*
  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (typeof window.vw === 'undefined') return;

    const vw = window.vw;

    mapInstance.current = new vw.Map('vworld-map', {
      basemap: 'midnight',
      center:  new vw.Coords(MAP_CENTER.lng, MAP_CENTER.lat),
      zoom:    MAP_ZOOM,
    });

    setMapReady(true);
    console.log('[MapView] VWorld 지도 초기화 완료');
  }, []);
  */}
  const initMap = useCallback(() => {
  if (!mapRef.current || mapInstance.current) return;
  if (typeof window.vw === 'undefined') return;

  const vw = window.vw;

  // VWorld 2.0 초기화 방식
  vw.ol3.MapOptions = {
    basemapType: vw.ol3.BasemapType.GRAPHIC,
    controlDensity: vw.ol3.DensityType.EMPTY,
    interactionDensity: vw.ol3.DensityType.BASIC,
    controlsAutoArrange: true,
    homePosition: vw.ol3.CameraPosition,
    initPosition: vw.ol3.CameraPosition,
  };

  mapInstance.current = new vw.ol3.Map('vworld-map');

  setMapReady(true);
  console.log('[MapView] VWorld 지도 초기화 완료');
  }, []);





  useEffect(() => {
    // VWorld 스크립트가 이미 로드된 경우
    if (typeof window.vw !== 'undefined') {
      initMap();
      return;
    }
    // 스크립트 로드 완료 콜백
    window.onVWorldReady = initMap;
  }, [initMap]);




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
  useEffect(() => {
    const handler = (e: Event) => {
      const item = (e as CustomEvent<FloodItem>).detail;
      if (!mapInstance.current || !item.lat || !item.lng) return;
      const vw = window.vw;
      mapInstance.current.setCenter(
        new vw.Coords(parseFloat(item.lng), parseFloat(item.lat))
      );
      mapInstance.current.setZoom(15);
    };
    window.addEventListener('siteSelect', handler);
    return () => window.removeEventListener('siteSelect', handler);
  }, []);



  
  // ── 마커 생성 (flood 데이터 로드 후 외부에서 호출 가능하도록 노출) ──
  // Sidebar → CustomEvent → 여기서 수신
  useEffect(() => {
    const handler = (e: Event) => {
      const items = (e as CustomEvent<FloodItem[]>).detail;
      renderMarkers(items);
    };
    window.addEventListener('floodDataLoaded', handler);
    return () => window.removeEventListener('floodDataLoaded', handler);
  }, [mapReady]);

  const renderMarkers = useCallback((items: FloodItem[]) => {
    if (!mapInstance.current || typeof window.vw === 'undefined') return;
    const vw = window.vw;
    const mapArea = mapRef.current;
    if (!mapArea) return;

    // 기존 마커 제거
    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    markersRef.current = {};

    items.forEach(item => {
      if (!item.lat || !item.lng) return;

      /*
       * ── VWorld 마커 생성 ──────────────────────────────────────
       * VWorld API 문서를 확인 후 아래 주석을 실제 코드로 교체하세요.
       *
       * const marker = new vw.Marker({
       *   map:      mapInstance.current,
       *   position: new vw.Coords(parseFloat(item.lng), parseFloat(item.lat)),
       *   icon: {
       *     url:  '/pin.svg',          // public/ 폴더에 핀 이미지 추가
       *     size: [32, 40],
       *   },
       * });
       *
       * marker.addListener('mouseover', (e: any) => {
       *   const rect = mapArea.getBoundingClientRect();
       *   setFloatItem(item);
       *   setFloatPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
       * });
       *
       * marker.addListener('mouseout', () => setFloatItem(null));
       *
       * markersRef.current[item.siteCode] = marker;
       * ─────────────────────────────────────────────────────────
       */
    });
  }, [mapReady]);

  return (
    <main
      ref={mapRef}
      style={{
        gridColumn: '2',
        gridRow:    '2',
        position:   'relative',
        background: '#111827',
        overflow:   'hidden',
      }}
    >
      {/* VWorld 지도 컨테이너 */}
      <div id="vworld-map" style={{ width: '100%', height: '100%' }} />

      {/* VWorld API 미연결 플레이스홀더 */}
      {!mapReady && (
        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '1rem',
          color:          'var(--text-muted)',
          pointerEvents:  'none',
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.25 }}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          <p style={{ fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.45 }}>
            layout.tsx 의 VWorld 스크립트 태그를 활성화하세요
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
