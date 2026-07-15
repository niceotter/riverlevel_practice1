'use client';
// components/WaterLevelHeroBusan.tsx
//
// 사다리꼴 버전 WaterAnimationBusan.tsx의 데이터 fetch/팝업 로직은 그대로 두고
// 화면 디자인만 새 버전으로 교체.
// ⚠️ 부산은 서울과 다르게:
//   - id prop은 siteCode에서 "00-" 접두사를 뺀 값 (예: "200-0005") →
//     API에서 찾을 땐 `00-${id}`로 복원해서 매칭
//   - 바닥 높이는 고정 0이 아니라 alertLevel1(둔치) 값 (이번 예시 데이터가
//     우연히 0.0이었을 뿐, 다른 지점은 0이 아닐 수 있음)
//   - 경고수위 유효 여부는 alertLevel3 > alertLevel1로 판단
//   - 수위계 사진 경로는 /images/busan-{id}.jpg (서울과 접두사 다름)

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BusanStation {
  siteCode: string;
  siteName: string;
  waterLevel: string;
  obsrTime: string;
  alertLevel1: string; // 바닥 (둔치)
  alertLevel3: string; // 경계 = 경고수위
  alertLevel4: string; // 위험수위
}

interface Props {
  id: string; // siteCode에서 "00-" 뺀 값 (예: 200-0005)
  externalLink?: string;
}

const TOP_PADDING = 14;
const BOTTOM_PADDING = 6;
const WATER_TOP_COLOR = '#6fb4f0';

export default function WaterLevelHeroBusan({ id, externalLink }: Props) {
  const router = useRouter();

  const [station, setStation] = useState<BusanStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showNoLink, setShowNoLink] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const alertShown = useRef({ warn: false, danger: false });

  const load = () => {
    fetch('/api/busan')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const items: BusanStation[] = data?.response?.body?.items?.item ?? [];
        // "00-" + id 로 원래 siteCode 복원해서 찾기 (사다리꼴 버전과 동일)
        const found = items.find((i) => i.siteCode === `00-${id}`);
        if (found) {
          setStation(found);

          const floor = 0;
          const current = parseFloat(found.waterLevel) - floor;
          const danger = parseFloat(found.alertLevel4) - floor;
          const showWarn = parseFloat(found.alertLevel3) > parseFloat(found.alertLevel1);
          const warn = showWarn ? parseFloat(found.alertLevel3) - floor : null;

          if (current >= danger && !alertShown.current.danger) {
            alertShown.current.danger = true;
            setAlertMsg(`⚠️ 위험수위 초과! 현재 ${current.toFixed(2)}m`);
          } else if (warn !== null && current >= warn && !alertShown.current.warn) {
            alertShown.current.warn = true;
            setAlertMsg(`⚠️ 경고수위 초과! 현재 ${current.toFixed(2)}m`);
          }
        }
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

  // ── 바닥(alertLevel1) 기준 보정 ──────────────────────────────
  const floorLevel = 0;
  const rawCurrent = parseFloat(station.waterLevel);
  const rawDanger = parseFloat(station.alertLevel4);
  const rawWarn = parseFloat(station.alertLevel3);

  const calibratedCurrent = rawCurrent - floorLevel;
  const calibratedDanger = rawDanger - floorLevel;
  const showWarn = rawWarn > floorLevel;
  const calibratedWarn = showWarn ? rawWarn - floorLevel : null;

  const scaleMin = 0;
  const scaleMax = calibratedDanger * 1.18;

  const levelToTopPercent = (value: number) => {
    const clamped = Math.min(Math.max(value, scaleMin), scaleMax);
    const ratio = (clamped - scaleMin) / (scaleMax - scaleMin);
    const usable = 100 - TOP_PADDING - BOTTOM_PADDING;
    return TOP_PADDING + (1 - ratio) * usable;
  };

  const waterTopPercent = levelToTopPercent(calibratedCurrent);

  const ticks = [
    { key: 'danger', label: `위험 수위 ${calibratedDanger.toFixed(1)}m`, value: calibratedDanger, color: '#e02424', right: 26, bottom: -6 },
    ...(calibratedWarn !== null
      ? [{ key: 'warn', label: `경고 수위 ${calibratedWarn.toFixed(1)}m`, value: calibratedWarn, color: '#f5820a', right: 26, bottom: -6 }]
      : []),
    { key: 'current', label: `현재 수위 ${calibratedCurrent.toFixed(1)}m`, value: calibratedCurrent, color: '#1e00ff', right: 150, bottom: 10 },
    { key: 'floor', label: '바닥 0.0m', value: 0, color: '#1a1a1a', right: 26, bottom: -14 },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      {/* 왼쪽 상단: 타이틀 + 정보 + 버튼 */}
      <div style={{ position: 'absolute', top: '6vh', left: '5vw', zIndex: 10, maxWidth: 480 }}>
        <h3 style={{ fontSize: 'clamp(15px, 4vw, 20px)', fontWeight: 600, lineHeight: 1.25, color: '#000000', margin: '0 0 28px 0' }}>
          <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            🔙 메인으로 돌아가기
          </a>
        </h3>

        <p style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', fontWeight: 700, margin: '0 0 6px 0' }}>{station.siteName}</p>
        <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 22px 0' }}>{station.obsrTime}</p>

        <p style={{ fontSize: 13, color: '#6b6b6b', fontWeight: 600 }}>데이터 제공 : 부산광역시</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setShowPhoto(true)}
            style={{ minWidth: 140, borderRadius: 10, border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: '14px 16px', backgroundColor: '#555' }}
          >
            <span style={{ fontWeight: 700 }}>📷 수위계 모습</span>
          </button>

          <button
            type="button"
            onClick={() => (externalLink ? window.open(externalLink, '_blank') : setShowNoLink(true))}
            style={{ minWidth: 140, borderRadius: 10, border: 'none', color: '#fff', fontSize: 14, lineHeight: 1.4, cursor: 'pointer', textAlign: 'left', padding: '14px 16px', backgroundColor: '#555' }}
          >
            <span style={{ fontWeight: 700 }}>📹 CCTV 링크</span>
            <span style={{ display: 'block', marginTop: 6, color: '#d8d8d8', fontSize: 12 }}>다른 곳을 바라보고 있을 수 있습니다</span>
          </button>
        </div>

      </div>

      {/* 왼쪽 하단: 목록으로 / 새로고침 */}
      <div style={{ position: 'absolute', left: '5vw', bottom: '5vh', zIndex: 10, display: 'flex', gap: 10 }}>
        <button type="button" onClick={load} style={{ background: '#fff', border: '1.5px solid #d8d8d8', borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          ↻ 새로고침
        </button>
      </div>

      {/* 오른쪽 세로 눈금자 */}
      <div style={{ position: 'absolute', right: '6vw', top: 0, height: '100%', width: 220, zIndex: 10 }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: '#cfcfcf' }} />
        {ticks.map((t) => {
          const top = levelToTopPercent(t.value);
          const isCurrent = t.key === 'current';
          return (
            <div key={t.key} style={{ position: 'absolute', right: -2, top: `${top}%`, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', transform: 'translateY(-50%)' }}>
              <span style={{
                position: 'absolute',
                right: t.right,
                bottom: t.bottom,
                whiteSpace: 'nowrap', 
                fontWeight: 800,
                fontSize: isCurrent ? 20 : t.key === 'floor' ? 15 : 18,
                color: t.color
              }}>
                {t.label}
              </span>
              <span style={{ width: isCurrent ? 26 : 18, height: isCurrent ? 3 : 2, background: t.color }} />
            </div>
          );
        })}
      </div>

      {/* 물 */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0, 
        bottom: 0, 
        top: `${waterTopPercent}%`, 
        background: 'linear-gradient(180deg, var(--bg-water) 0%, #2f7fd6 100%)',
        zIndex: 1, 
        transition: 'top 0.6s ease-out' }} />

      {/* 물결 라인 - Header와 동일한 패턴 */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: `calc(${waterTopPercent}% - 10px)`, height: '10px', zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpath d='M0 10 Q9 9 10 0 Q11 9 20 10' stroke='${encodeURIComponent(WATER_TOP_COLOR)}' fill='${encodeURIComponent(WATER_TOP_COLOR)}' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-x', transition: 'top 0.6s ease-out',
        }}
      />

      {/* 경고/위험 알림 팝업 */}
      {alertMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setAlertMsg(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem 2.5rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: 360 }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginBottom: '1rem' }}>{alertMsg}</p>
            <button onClick={() => setAlertMsg(null)} style={{ padding: '0.5rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' }}>확인</button>
          </div>
        </div>
      )}

      {/* 수위계 사진 팝업 */}
      {showPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPhoto(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1rem', maxWidth: '90vw', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={`/images/busan-${id}.jpg`}
              alt={`${id} 수위계`}
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).alt = '사진 없음'; }}
            />
            <button onClick={() => setShowPhoto(false)} style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}

      {/* CCTV 링크없음 팝업 */}
      {showNoLink && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowNoLink(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: '90vw', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem' }}>본 수위계는 연결된 CCTV가 없습니다.</p>
            <button onClick={() => setShowNoLink(false)} style={{ padding: '0.5rem 1.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
