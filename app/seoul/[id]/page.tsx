'use client';
// app/seoul/[id]/page.tsx

import { useParams } from 'next/navigation';
import WaterLevelHeroSeoul from '@/components/WaterLevelHeroSeoul';

// 수위계 별 CCTV 외부 링크 (사다리꼴 버전에서 그대로 이식)
const EXTERNAL_LINKS: Record<string, string> = {
  '101': 'http://kko.to/oSQknqGwvL',
  '103': 'http://kko.to/2sjB8l91K9',
  '1401': 'http://kko.to/VoFK32aX8C',
  '403': 'http://kko.to/wBWqrHBKHM',
  '901': 'http://kko.to/_GP-2rog2j',
};

export default function SeoulStationPage() {
  const params = useParams();
  const id = params?.id as string;

  return <WaterLevelHeroSeoul id={id} externalLink={EXTERNAL_LINKS[id]} />;
}



{/*

// 사다리꼴 버전(WaterAnimationSeoul.tsx)과 동일하게 /api/seoul을 60초마다 폴링해서 최신값을 받아온다.
// Supabase는 이 페이지에서 쓰지 않음 (히스토리 그래프 페이지에서만 필요).

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WaterLevelHero from '@/components/WaterLevelHero';

interface SeoulStation {
  WATG_CD: string;
  WATG_NM: string;
  RVR_NM: string;
  DTRSM_DATA_CLCT_TM: string;
  RLTM_RVR_WATL_CNT: number;
  PLAN_FLDE: number;
  RBH: number;
  CNTRL_WATL: number;
}

// 수위계 별 CCTV 외부 링크 (사다리꼴 버전에서 그대로 이식)
// TODO: 항목이 늘어나면 별도 파일(config/externalLinks.ts)로 분리 고려
const EXTERNAL_LINKS: Record<string, string> = {
  '101': 'http://kko.to/oSQknqGwvL',
  '103': 'http://kko.to/2sjB8l91K9',
  '1401': 'http://kko.to/VoFK32aX8C',
  '403': 'http://kko.to/wBWqrHBKHM',
  '901': 'http://kko.to/_GP-2rog2j',
};

export default function SeoulStationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [station, setStation] = useState<SeoulStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    fetch('/api/seoul')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const rows: SeoulStation[] = data?.ListRiverStageService?.row ?? [];
        const found = rows.find((r) => r.WATG_CD === id);
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

  const externalLink = EXTERNAL_LINKS[id];
  // CNTRL_WATL(경고수위)이 RBH(바닥)보다 큰 경우에만 유효한 경고수위로 취급
  // (사다리꼴 버전의 showWarn 로직과 동일)
  const showWarn = station.CNTRL_WATL > station.RBH;

  return (
    <WaterLevelHero
      siteName={`${station.RVR_NM.trim()} ${station.WATG_NM}`}
      measuredAt={station.DTRSM_DATA_CLCT_TM}
      currentLevel={station.RLTM_RVR_WATL_CNT}
      warnLevel={showWarn ? station.CNTRL_WATL : null}
      dangerLevel={station.PLAN_FLDE}
      floorLevel={station.RBH}
      source="정보 출처 : 서울특별시 물순환안전국"
      photoImageUrl={`/images/${id}.jpg`}
      cctvUrl={externalLink}
      onBack={() => router.push('/')}
      onRefresh={load}
    />
  );
}


import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import WaterAnimationSeoul from '@/components/WaterAnimationSeoul';

function getTimeTheme() {
  const hour = new Date().getHours();
  if (hour >= 0  && hour < 5)  return { bgHeader: '#0a0e1a', bgDeep: '#1a2540' };
  if (hour >= 5  && hour < 9)  return { bgHeader: '#FFFE91', bgDeep: '#63adf8' };
  if (hour >= 9  && hour < 17) return { bgHeader: '#ffffff', bgDeep: '#63adf8' };
  if (hour >= 17 && hour < 20) return { bgHeader: '#FE9380', bgDeep: '#63adf8' };
  return { bgHeader: '#382A2F', bgDeep: '#1a2540' };
}


const bgHeader = '#FFFFFF';
const bgDeep = '#63adf8';

// 수위계 별 외부 링크
const EXTERNAL_LINKS: Record<string, string> = {
  '101': 'http://kko.to/oSQknqGwvL',  // 탄천 여수대교
  '102': '#',
  '103': 'http://kko.to/2sjB8l91K9',  // 탄천 탄천2교
  '1401': 'http://kko.to/VoFK32aX8C',  // 불광천 증산교
  '1501': '#',
  '2001': '#',
  '2002': '#',
  '2003': '#',
  '2201': '#',
  '2301': '#',
  '2303': '#',
  '2502': '#',
  '301': '#',
  '302': '#',
  '303': '#',
  '401': '#',
  '402': '#',
  '403': 'http://kko.to/wBWqrHBKHM',  // 중랑천 월계1교
  '801': '#',
  '901': 'http://kko.to/_GP-2rog2j',  // 중랑천 성동교
  '902': '#',
};

export default function SeoulStationPage() {
  const params = useParams();
  const id = params?.id as string;
//  const [theme, setTheme] = useState(getTimeTheme());

//  useEffect(() => {
//    const interval = setInterval(() => setTheme(getTimeTheme()), 60000);
//    return () => clearInterval(interval);
//  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '20vh 80vh',
      gridTemplateColumns: '20% 80%',
      height: '100vh',
      width: '100vw',
    }}>
      <Header />
      <Sidebar />
      <WaterAnimationSeoul
        id={id}
        bgDeep={bgDeep}//{theme.bgDeep}
        bgHeader={bgHeader}//{theme.bgHeader}
        externalLink={EXTERNAL_LINKS[id] ?? '#'}
      />
    </div>
  );
}

*/}