'use client';
// components/WaterAlertBadge.tsx
//
// 헤더 우측에 표시되는 "위험 수위 근접" 알림 배지.
// 현재 수위 >= (위험 수위 - 0.5m) 인 수위계 개수를 보여주고,
// 클릭하면 아래로 목록이 펼쳐진다.
// main('/')과 '/history' 페이지에서만 렌더링된다.

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface AlertItem {
  id: string;
  name: string;
  region: 'seoul' | 'busan';
  current: number;
  danger: number;
  diff: number; // current - danger (양수면 이미 위험 수위 초과)
  href: string;
}

const THRESHOLD_MARGIN = 0.5; // 위험 수위 - 0.5m

// 응답 구조가 정확히 어떻게 감싸져 있는지 몰라도 되도록,
// 특정 key를 가진 객체들의 배열을 재귀적으로 찾아준다.
// function findArrayWithKey(obj: unknown, key: string): Record<string, unknown>[] {
//   if (!obj || typeof obj !== 'object') return [];

//   if (Array.isArray(obj)) {
//     if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null && key in (obj[0] as object)) {
//       return obj as Record<string, unknown>[];
//     }
//     for (const item of obj) {
//       const found = findArrayWithKey(item, key);
//       if (found.length) return found;
//     }
//     return [];
//   }

//   for (const k in obj as Record<string, unknown>) {
//     const found = findArrayWithKey((obj as Record<string, unknown>)[k], key);
//     if (found.length) return found;
//   }
//   return [];
// }

function toNumber(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && !Number.isNaN(n) ? n : NaN;
}

// async function fetchSeoulAlerts(): Promise<AlertItem[]> {
//   const res = await fetch('/api/seoul', { cache: 'no-store' });
//   if (!res.ok) return [];
//   const data = await res.json();
//   const rows = findArrayWithKey(data, 'WATG_CD');

//   return rows
//     .map((row): AlertItem | null => {
//       const id = String(row.WATG_CD ?? '');
//       const name = String(row.WATG_NM ?? '').trim();
//       const current = toNumber(row.RLTM_RVR_WATL_CNT);
//       const danger = toNumber(row.CNTRL_WATL);
//       if (!id || Number.isNaN(current) || Number.isNaN(danger) || danger <= 0) return null;
//       return {
//         id,
//         name,
//         region: 'seoul',
//         current,
//         danger,
//         diff: current - danger,
//         href: `/seoul/${id}`,
//       };
//     })
//     .filter((v): v is AlertItem => v !== null);
// }

// async function fetchBusanAlerts(): Promise<AlertItem[]> {
//   const res = await fetch('/api/busan', { cache: 'no-store' });
//   if (!res.ok) return [];
//   const data = await res.json();
//   const rows = findArrayWithKey(data, 'siteCode');

//   return rows
//     .map((row): AlertItem | null => {
//       const siteCode = String(row.siteCode ?? '');
//       const id = siteCode.replace(/^00-/, '');
//       const name = String(row.siteName ?? '').trim();
//       const current = toNumber(row.waterLevel);
//       const danger = toNumber(row.alertLevel4); // 위험 수위
//       if (!id || Number.isNaN(current) || Number.isNaN(danger) || danger <= 0) return null;
//       return {
//         id,
//         name,
//         region: 'busan',
//         current,
//         danger,
//         diff: current - danger,
//         href: `/busan/${id}`,
//       };
//     })
//     .filter((v): v is AlertItem => v !== null);
// }
//
// findArrayWithKey 함수 전체 삭제

async function fetchSeoulAlerts(): Promise<AlertItem[]> {
  const res = await fetch('/api/seoul', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  const rows: Record<string, unknown>[] = data?.rows ?? [];

  return rows
    .map((row): AlertItem | null => {
      const id = String(row.site_code ?? '');
      const name = String(row.site_name ?? '').trim();
      const current = toNumber(row.water_level);
      const danger = toNumber(row.warn_level); // 기존 로직 유지: CNTRL_WATL(경고수위) 기준
      if (!id || Number.isNaN(current) || Number.isNaN(danger) || danger <= 0) return null;
      return {
        id,
        name,
        region: 'seoul',
        current,
        danger,
        diff: current - danger,
        href: `/seoul/${id}`,
      };
    })
    .filter((v): v is AlertItem => v !== null);
}

async function fetchBusanAlerts(): Promise<AlertItem[]> {
  const res = await fetch('/api/busan', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  const rows: Record<string, unknown>[] = data?.rows ?? [];

  return rows
    .map((row): AlertItem | null => {
      const siteCode = String(row.site_code ?? '');
      const id = String(row.site_code ?? '');
//      const id = siteCode.replace(/^00-/, '');
      const name = String(row.site_name ?? '').trim();
      const current = toNumber(row.water_level);
      const danger = toNumber(row.danger_level); // alertLevel4(위험수위) 기준
      if (!id || Number.isNaN(current) || Number.isNaN(danger) || danger <= 0) return null;
      return {
        id,
        name,
        region: 'busan',
        current,
        danger,
        diff: current - danger,
        href: `/busan/${id}`,
      };
    })
    .filter((v): v is AlertItem => v !== null);
}



export default function WaterAlertBadge() {
  const pathname = usePathname();
  const visible = pathname === '/' || pathname === '/history';

  const [items, setItems] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [seoul, busan] = await Promise.all([fetchSeoulAlerts(), fetchBusanAlerts()]);
      const merged = [...seoul, ...busan]
        .filter((it) => it.current >= it.danger - THRESHOLD_MARGIN)
        .sort((a, b) => b.diff - a.diff);
      setItems(merged);
    } catch (err) {
      console.error('[WaterAlertBadge] 수위 데이터 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [visible, load]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!visible) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: items.length > 0 ? '#f5893a' : '#e5e9ec',
          color: items.length > 0 ? '#2a1400' : '#4a5560',
          border: 'none',
          borderRadius: '999px',
          padding: '0.65rem 1.1rem',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
        }}
      >
        침수 위험 {items.length}곳
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          right: 0,
          minWidth: '240px',
          maxHeight: '320px',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 200,
        }}>
          {items.length === 0 && (
            <div style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: '#888' }}>
              <>현재 위험 수위에 근접한 곳이<br/>없습니다.</>
            </div>
          )}
          {items.map((it) => (
            <a
              key={`${it.region}-${it.id}`}
              href={it.href}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.7rem 1rem',
                textDecoration: 'none',
                color: '#222',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '0.9rem',
              }}
            >
              <span>
                {it.name}
                <span style={{ color: '#999', fontSize: '0.78rem', marginLeft: '0.35rem' }}>
                  {it.region === 'seoul' ? '서울' : '부산'}
                </span>
              </span>
              <span style={{
                fontWeight: 700,
                color: it.diff >= 0 ? '#d9350e' : '#c76a1f',
                flexShrink: 0,
              }}>
                {it.current.toFixed(2)}m
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}