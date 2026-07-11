'use client';
// app/seoul/[id]/page.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
// import Sidebar from '@/components/Sidebar';
import WaterAnimationSeoul from '@/components/WaterAnimationSeoul';

{/*
function getTimeTheme() {
  const hour = new Date().getHours();
  if (hour >= 0  && hour < 5)  return { bgHeader: '#0a0e1a', bgDeep: '#1a2540' };
  if (hour >= 5  && hour < 9)  return { bgHeader: '#FFFE91', bgDeep: '#63adf8' };
  if (hour >= 9  && hour < 17) return { bgHeader: '#ffffff', bgDeep: '#63adf8' };
  if (hour >= 17 && hour < 20) return { bgHeader: '#FE9380', bgDeep: '#63adf8' };
  return { bgHeader: '#382A2F', bgDeep: '#1a2540' };
}
*/}

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
      gridTemplateColumns: '100%',
      height: '100vh',
      width: '100vw',
    }}>
      <Header />
      <WaterAnimationSeoul
        id={id}
        bgDeep={bgDeep}//{theme.bgDeep}
        bgHeader={bgHeader}//{theme.bgHeader}
        externalLink={EXTERNAL_LINKS[id] ?? '#'}
      />
    </div>
  );
}
