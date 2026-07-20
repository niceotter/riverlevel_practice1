'use client';
// components/WaterLevelHeroSeoul.tsx
//
// 사다리꼴 버전 WaterAnimationSeoul.tsx의 데이터 fetch/팝업 로직은 그대로 두고,
// 화면 디자인만 새 버전(사이드바/사다리꼴 없이, 바닥=0m 보정된 세로 눈금자 +
// 수위에 따라 위치가 바뀌는 물)으로 교체한 자체완결형 컴포넌트.
// /api/seoul을 60초마다 폴링. Supabase 사용 안 함.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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

interface Props {
  id: string; // WATG_CD
  externalLink?: string; // 없으면 "CCTV 링크없음" 팝업
}

const TOP_PADDING = 14;
const BOTTOM_PADDING = 6;
const WATER_TOP_COLOR = '#63adf8';//'#6fb4f0'; // Header 물결 패턴과 맞춘 색

export default function WaterLevelHeroSeoul({ id, externalLink }: Props) {
  const router = useRouter();

  const [station, setStation] = useState<SeoulStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showNoLink, setShowNoLink] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const alertShown = useRef({ warn: false, danger: false });

  const load = () => {
    fetch('/api/seoul')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const rows: SeoulStation[] = data?.ListRiverStageService?.row ?? [];
        const found = rows.find((r) => r.WATG_CD === id);
        if (found) {
          setStation(found);

          // 경고/위험 알림 팝업 (바닥 보정된 값 기준, 사다리꼴 버전 로직 이식)
          const current = found.RLTM_RVR_WATL_CNT - found.RBH;
          const danger = found.PLAN_FLDE - found.RBH;
          const showWarn = found.CNTRL_WATL > found.RBH;
          const warn = showWarn ? found.CNTRL_WATL - found.RBH : null;

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

  // ── 바닥(RBH) 기준 보정: 모든 값에서 RBH를 빼서 바닥=0m로 통일 ──────
  const floorLevel = station.RBH;
  const calibratedCurrent = station.RLTM_RVR_WATL_CNT - floorLevel;
  const calibratedDanger = station.PLAN_FLDE - floorLevel;
  const showWarn = station.CNTRL_WATL > station.RBH;
  const calibratedWarn = showWarn ? station.CNTRL_WATL - floorLevel : null;

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
    { key: 'current', label: `현재 수위 ${calibratedCurrent.toFixed(1)}m`, value: calibratedCurrent, color: '#1e00ff', right: 70, bottom: 10 },
    { key: 'floor', label: `바닥 0.0m (${floorLevel.toFixed(1)}m)`, value: 0, color: '#000000', right: 26, bottom: -14 },
  ];

  return (
    <div className="water-hero-viewport" style={{ position: 'relative', width: '100%', overflow: 'hidden', background: 'var(--bg-sky)' }}>
{/*    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg-sky)' }}>
      왼쪽 상단: 타이틀 + 정보 + 버튼 */}
      <div style={{ position: 'absolute', top: '6vh', left: '5vw', zIndex: 10, maxWidth: 480 }}>
        <h3 style={{ fontSize: 'clamp(15px, 4vw, 20px)', fontWeight: 600, lineHeight: 1.25, color: '#000000', margin: '0 0 28px 0' }}>
          <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            🔙 메인으로 돌아가기
          </a>
        </h3>

        <p style={{ 
          fontSize: 'clamp(20px, 2.4vw, 26px)',
          fontWeight: 700, 
          margin: '0 0 6px 0' 
        }}>
          서울 {station.RVR_NM.trim()} {station.WATG_NM}
        </p>

        <p style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          margin: '0 0 8px 0' 
        }}>
          {station.DTRSM_DATA_CLCT_TM}
        </p>

        <p style={{ fontSize: 13, color: '#6b6b6b', fontWeight: 600, margin: '0 0 12px 0' }}>데이터 제공 : 서울특별시 물순환안전국</p>

        <div style={{ display: 'flex', gap: 10, margin: '10px 0 18px 0' }}>
          <button
            type="button"
            onClick={() => setShowPhoto(true)}
            style={{ minWidth: 120, borderRadius: 10, border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: '14px 16px', backgroundColor: '#555' }}
          >
            <span style={{ fontWeight: 700 }}>📷 수위계 사진</span>
            <span style={{ display: 'block', marginTop: 6, color: '#d8d8d8', fontSize: 12 }}>수위계 사진 확보에 노력 중입니다.</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, margin: '10px 0 18px 0' }}>
          <button
            type="button"
            onClick={() => (externalLink ? window.open(externalLink, '_blank') : setShowNoLink(true))}
            style={{ 
              minWidth: 120, 
              borderRadius: 10, 
              border: 'none', 
              color: '#fff', 
              fontSize: 14, 
              lineHeight: 1.4, 
              cursor: 'pointer', 
              textAlign: 'left', 
              padding: '14px 16px', 
              backgroundColor: '#555' 
            }}
          >
            <span style={{ fontWeight: 700 }}>
              📹 CCTV 링크
            </span>
            <span style={{ 
              display: 'block', 
              marginTop: 6, 
              color: '#d8d8d8', 
              fontSize: 12 
            }}>
              <>CCTV가 없거나<br/>다른 곳을 바라보고 있을 수 있습니다</>
            </span>
          </button>
        </div>

      </div>

      <div style={{ position: 'absolute', left: '5vw', bottom: 'calc(5vh + env(safe-area-inset-bottom, 0px))', zIndex: 10, display: 'flex', gap: 10 }}>
{/*      <div style={{ position: 'absolute', left: '5vw', bottom: '5vh', zIndex: 10, display: 'flex', gap: 10 }}></div>
      왼쪽 하단: 목록으로 / 새로고침 */}
        <button
          type="button"
          onClick={load}
          style={{
            background: '#fff',
            border: '1.5px solid #d8d8d8',
            borderRadius: 999,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer'
          }}>
          ↻ 새로고침
        </button>
      </div>

      {/* 오른쪽 세로 눈금자 */}
      <div style={{
        position: 'absolute', 
        right: '6vw', 
        top: 0, 
        height: '100%', 
        width: 220, 
        zIndex: 10 
      }}>
        <div style={{ 
          position: 'absolute', 
          right: 0, 
          top: 0, 
          bottom: 0, 
          width: 2, 
          background: '#cfcfcf'
         }} />
        {ticks.map((t) => {
          const top = levelToTopPercent(t.value);
          const isCurrent = t.key === 'current';
          return (
            <div key={t.key} style={{ 
              position: 'absolute', 
              right: -2, 
              top: `${top}%`, 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end', 
              transform: 'translateY(-50%)' 
            }}>
              <span style={{ 
                position: 'absolute', 
                right: t.right, 
                bottom: t.bottom,
                whiteSpace: 'pre-line', 
                fontWeight: 800, 
                fontSize: isCurrent ? 18 : t.key === 'floor' ? 15 : 18, 
                color: t.color 
              }}>
                {t.label}
              </span>
              <span style={{ 
                width: isCurrent ? 26 : 18, 
                height: isCurrent ? 3 : 2, 
                background: t.color 
              }} />
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
              src={`/images/${id}.jpg`}
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
