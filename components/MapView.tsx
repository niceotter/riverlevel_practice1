'use client';
// components/MapView.tsx

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window { kakao: any; }
}

const MARKERS = [
  { id: '101',  region: 'seoul', lat: 37.422093, lng: 127.117576, title: '탄천 여수대교' },
  { id: '102',  region: 'seoul', lat: 37.468873, lng: 127.122695, title: '탄천 대곡교' },
  { id: '103',  region: 'seoul', lat: 37.502442, lng: 127.071609, title: '탄천 탄천2교' },
  { id: '1401', region: 'seoul', lat: 37.576384, lng: 126.902668, title: '불광천 증산교' },
  { id: '1501', region: 'seoul', lat: 37.565590, lng: 126.911468, title: '홍제천 성산2교' },
  { id: '2001', region: 'seoul', lat: 37.499342, lng: 126.870129, title: '안양천 고척교' },
  { id: '2002', region: 'seoul', lat: 37.510590, lng: 126.891129, title: '도림천 도림교' },
  { id: '2003', region: 'seoul', lat: 37.474382, lng: 126.845366, title: '목감천 광화교' },
  { id: '2201', region: 'seoul', lat: 37.438683, lng: 126.900006, title: '안양천 기아대교' },
  { id: '2301', region: 'seoul', lat: 37.487552, lng: 126.913354, title: '도림천 신대방역' },
  { id: '2303', region: 'seoul', lat: 37.473849, lng: 126.933797, title: '도림천 양산교' },
  { id: '2502', region: 'seoul', lat: 37.515530, lng: 127.067782, title: '탄천 봉은교' },
  { id: '301',  region: 'seoul', lat: 37.661418, lng: 127.048815, title: '방학천 모래말옆' },
  { id: '302',  region: 'seoul', lat: 37.678949, lng: 127.050930, title: '중랑천 노원교' },
  { id: '303',  region: 'seoul', lat: 37.647929, lng: 127.022414, title: '우이천 계성교' },
  { id: '401',  region: 'seoul', lat: 37.617957, lng: 127.057091, title: '우이천 장월교' },
  { id: '402',  region: 'seoul', lat: 37.733274, lng: 127.053999, title: '중랑천 신의교' },
  { id: '403',  region: 'seoul', lat: 37.632790, lng: 127.063223, title: '중랑천 월계1교' },
  { id: '801',  region: 'seoul', lat: 37.578166, lng: 127.034456, title: '정릉천 용두교' },
  { id: '901',  region: 'seoul', lat: 37.552871, lng: 127.043917, title: '중랑천 성동교' },
  { id: '902',  region: 'seoul', lat: 37.568649, lng: 127.046776, title: '청계천 마장2교' },

  { id: '200-0005',  region: 'busan', lat: 35.289917, lng: 129.255917, title: '동백천' },
  { id: '200-0006',  region: 'busan', lat: 35.319848, lng: 129.115564, title: '임기천' },
];

export default function MapView() {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const initMap = () => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(36.500805, 127.942966),
      level: 13,
    });
    mapInstance.current = map;
    setMapReady(true);

    MARKERS.forEach(m => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(m.lat, m.lng),
        title: m.title,
      });

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding:8px 12px;font-size:13px;font-family:sans-serif;min-width:140px;">
            <strong>${m.title}</strong><br/>
            <a href="/${m.region}/${m.id}" target="_top"
              style="color:#1a6fc4;font-size:12px;text-decoration:none;">
              ▶ 상세 수위 보기
            </a>
          </div>
        `,
      });

      window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
      window.kakao.maps.event.addListener(marker, 'mouseout',  () => infowindow.close());

      window.kakao.maps.event.addListener(marker, 'click', () => {
        window.location.href = `/${m.region}/${m.id}`;
      });
    });
  };

  // 사이드바 수위계 클릭 → 지도 이동
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!mapInstance.current || !detail.lat || !detail.lng) return;
      mapInstance.current.setCenter(
        new window.kakao.maps.LatLng(parseFloat(detail.lat), parseFloat(detail.lng))
      );
      mapInstance.current.setLevel(5);
    };
    window.addEventListener('siteSelect', handler);
    return () => window.removeEventListener('siteSelect', handler);
  }, []);

  return (
    <main style={{
      gridColumn: '2', gridRow: '2',
      position: 'relative', overflow: 'hidden',
    }}>

      <Script
        src="//dapi.kakao.com/v2/maps/sdk.js?appkey=b1de14803829c260bc393fb3ffc81713&autoload=false"
        strategy="afterInteractive"
        onLoad={() => {
          window.kakao.maps.load(initMap);
          }}
      />

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {!mapReady && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#e8f0fe', gap: '1rem',
          color: '#555', pointerEvents: 'none',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
               stroke="#aaa" strokeWidth="1.2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>지도 로딩 중…</p>
        </div>
      )}
    </main>
  );
}
