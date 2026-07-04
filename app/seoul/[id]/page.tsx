'use client';
// app/seoul/[id]/page.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import WaterAnimation from '@/components/WaterAnimation';

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
const bgDeep = '#ffffff';//'#63adf8';

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
      <WaterAnimation
        id={id}
        bgDeep={bgDeep}//{theme.bgDeep}
        bgHeader={bgHeader}//{theme.bgHeader}
      />
    </div>
  );
}
