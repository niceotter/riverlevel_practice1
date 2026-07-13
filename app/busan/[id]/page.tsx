'use client';
// app/busan/[id]/page.tsx

import { useParams } from 'next/navigation';
import WaterLevelHeroBusan from '@/components/WaterLevelHeroBusan';

// 수위계 별 CCTV 외부 링크
// TODO: 부산 지점 링크 채워넣기
const EXTERNAL_LINKS: Record<string, string> = {};

export default function BusanStationPage() {
  const params = useParams();
  const id = params?.id as string; // siteCode에서 "00-" 뺀 값 (예: 200-0005)

  return <WaterLevelHeroBusan id={id} externalLink={EXTERNAL_LINKS[id]} />;
}


{/*
// /api/busan을 60초마다 폴링. 부산 API는 floor(바닥) 데이터가 없으므로
// floorLevel=0으로 고정 (WaterLevelHero의 보정식이 자동으로 no-op 처리).

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WaterLevelHero from '@/components/WaterLevelHero';

interface BusanStation {
  siteCode: string;
  siteName: string;
  waterLevel: string;
  obsrTime: string;
  alertLevel3: string; // 경계수위 = 경고수위
  alertLevel4: string; // 위험수위
}

// 수위계 별 CCTV 외부 링크
// TODO: 부산 지점 링크 채워넣기
const EXTERNAL_LINKS: Record<string, string> = {};

export default function BusanStationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [station, setStation] = useState<BusanStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    fetch('/api/busan')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const items: BusanStation[] = data?.response?.body?.items?.item ?? [];
        const found = items.find((s) => s.siteCode === id);
        if (found) setStation(found);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p style={{ padding: '2rem', color: '#888' }}>데이터 불러오는 중…</p>;
  if (error || !station) return <p style={{ padding: '2rem', color: '#ef4444' }}>데이터를 불러올 수 없습니다.</p>;

  const currentLevel = parseFloat(station.waterLevel);
  const dangerLevel = parseFloat(station.alertLevel4);
  const warn = parseFloat(station.alertLevel3);
  const showWarn = !isNaN(warn) && warn > 0;
  const externalLink = EXTERNAL_LINKS[id];

  return (
    <WaterLevelHero
      siteName={station.siteName}
      measuredAt={station.obsrTime}
      currentLevel={currentLevel}
      warnLevel={showWarn ? warn : null}
      dangerLevel={dangerLevel}
      floorLevel={0} // 부산은 바닥 데이터 없음
      source="정보 출처 : 부산광역시"
      photoImageUrl={`/images/${id}.jpg`}
      cctvUrl={externalLink}
      onBack={() => router.push('/')}
      onRefresh={load}
    />
  );
}

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
// imimport Sidebar from '@/components/Sidebar';
import WaterAnimationBusan from '@/components/WaterAnimationBusan';

const bgHeader = '#FFFFFF';
const bgDeep   = '#63adf8';

// 수위계 별 외부 링크
const EXTERNAL_LINKS: Record<string, string> = {
  '200-0005': '#',  // 동백천
  '200-0006': '#',  // 임기천
};

export default function BusanStationPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '20vh 80vh',
      gridTemplateColumns: '20% 80%',
      height: '100vh',
      width: '100vw',
    }}>
      <Header/>
      <Sidebar />
    id={id}
        bgDeep={bgDeep}
        bgHeader={bgHeader}
        externalLink={EXTERNAL_LINKS[id] ?? '#'}
      />
    </div>
  );
}

*/}