'use client';
// app/busan/[id]/page.tsx

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
// import Sidebar from '@/components/Sidebar';
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
      gridTemplateColumns: '100%',
      height: '100vh',
      width: '100vw',
    }}>
      <Header/>
      {/* <Sidebar /> */}
      <WaterAnimationBusan
        id={id}
        bgDeep={bgDeep}
        bgHeader={bgHeader}
        externalLink={EXTERNAL_LINKS[id] ?? '#'}
      />
    </div>
  );
}
