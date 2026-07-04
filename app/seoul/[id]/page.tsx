'use client';
// app/seoul/[id]/page.tsx
// 서울 하천 수위 상세 페이지
// 예: /seoul/1401 → 증산교

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// ── 서울 API 데이터 타입 ─────────────────────────────
interface SeoulStation {
  WATG_CD: string;
  WATG_NM: string;
  RVR_NM: string;
  GU_OFC_NM: string;
  DTRSM_DATA_CLCT_TM: string;
  RLTM_RVR_WATL_CNT: number; // 현재수위
  EBM_HGT: number;            // 제방고 (애니메이션 최대값)
  PLAN_FLDE: number;          // 계획홍수위 (위험수위)
  RBH: number;                // 하상고 (바닥)
  CNTRL_WATL: number;         // 통제수위 (경고수위)
}

// ── 시간대별 색상 ────────────────────────────────────
function getTimeTheme() {
  const hour = new Date().getHours();
  if (hour >= 0  && hour < 5)  return { bgHeader: '#0a0e1a', bgDeep: '#1a2540' };
  if (hour >= 5  && hour < 9)  return { bgHeader: '#FFFE91', bgDeep: '#63adf8' };
  if (hour >= 9  && hour < 17) return { bgHeader: '#ffffff', bgDeep: '#63adf8' };
  if (hour >= 17 && hour < 20) return { bgHeader: '#FE9380', bgDeep: '#63adf8' };
  return { bgHeader: '#382A2F', bgDeep: '#1a2540' };
}

// ── 수위 → 애니메이션 Y위치 변환 ────────────────────
// 하상고(바닥) ~ 제방고(꼭대기) 범위를 0~100%로 매핑
function levelToPercent(level: number, rbh: number, ebmHgt: number) {
  const range = ebmHgt - rbh;
  const pct = (level - rbh) / range * 100;
  return Math.min(Math.max(pct, 0), 100);
}

export default function SeoulStationPage() {
  const params = useParams();
  const id = params?.id as string;

  const [station, setStation]   = useState<SeoulStation | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(false);
  const [theme,   setTheme]     = useState(getTimeTheme());
  const [showPhoto, setShowPhoto] = useState(false);
  const [alertMsg,  setAlertMsg]  = useState<string | null>(null);
  const alertShown = useRef({ warn: false, danger: false });

  // 1분마다 시간 테마 업데이트
  useEffect(() => {
    const interval = setInterval(() => setTheme(getTimeTheme()), 60000);
    return () => clearInterval(interval);
  }, []);

  // API 호출 (60초마다 갱신)
  useEffect(() => {
    const load = () => {
      fetch('/api/seoul')
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => {
          const rows: SeoulStation[] = data?.ListRiverStageService?.row ?? [];
          const found = rows.find(r => r.WATG_CD === id);
          if (found) {
            setStation(found);

            // 경고/위험 팝업 (한 번만)
            if (found.RLTM_RVR_WATL_CNT >= found.PLAN_FLDE && !alertShown.current.danger) {
              alertShown.current.danger = true;
              setAlertMsg(`⚠️ 위험수위 초과! 현재 ${found.RLTM_RVR_WATL_CNT}m`);
            } else if (found.RLTM_RVR_WATL_CNT >= found.CNTRL_WATL && !alertShown.current.warn) {
              alertShown.current.warn = true;
              setAlertMsg(`⚠️ 경고수위 초과! 현재 ${found.RLTM_RVR_WATL_CNT}m`);
            }
          }
          setLoading(false);
        })
        .catch(() => { setError(true); setLoading(false); });
    };

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [id]);

  const { bgHeader, bgDeep } = theme;

  // 수위 퍼센트 계산
  const currentPct = station
    ? levelToPercent(station.RLTM_RVR_WATL_CNT, station.RBH, station.EBM_HGT)
    : 0;
  const warnPct = station
    ? levelToPercent(station.CNTRL_WATL, station.RBH, station.EBM_HGT)
    : 0;
  const dangerPct = station
    ? levelToPercent(station.PLAN_FLDE, station.RBH, station.EBM_HGT)
    : 0;

  // 물 높이 = 현재수위 퍼센트
  const waterHeight = `${currentPct}%`;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: bgHeader,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      transition: 'background 1s ease',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── 헤더 ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '1rem 1.5rem',
        borderBottom: `4px solid ${bgDeep}`,
        flexShrink: 0,
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.85rem', color: '#555', textDecoration: 'none',
          marginRight: '1.5rem',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          지도로 돌아가기
        </Link>

        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111' }}>
            {station?.RVR_NM?.trim()} {station?.WATG_NM ?? id}
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.1rem' }}>
            {station?.GU_OFC_NM} · 최근 관측: {station?.DTRSM_DATA_CLCT_TM}
          </p>
        </div>

        {/* 우측 버튼 2개 */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {/* 수위계 사진 버튼 */}
          <button
            onClick={() => setShowPhoto(true)}
            style={{
              padding: '0.5rem 0.9rem', fontSize: '0.8rem',
              background: bgDeep, color: '#fff',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}
          >
            📷 수위계
          </button>
          {/* 외부링크 버튼 — 링크는 나중에 교체 */}
          <a
            href="#"
            target="_blank"
            style={{
              padding: '0.5rem 0.9rem', fontSize: '0.8rem',
              background: '#555', color: '#fff',
              borderRadius: '6px', textDecoration: 'none',
              display: 'flex', alignItems: 'center',
            }}
          >
            🔗 관련 링크
          </a>
        </div>
      </div>

      {/* ── 본문: 애니메이션 ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
      }}>

        {loading && (
          <p style={{ color: '#888', fontSize: '1rem' }}>데이터 불러오는 중…</p>
        )}
        {error && (
          <p style={{ color: '#ef4444', fontSize: '1rem' }}>데이터를 불러올 수 없습니다.</p>
        )}

        {station && (
          <div style={{ width: '100%', maxWidth: '700px', position: 'relative' }}>

            {/* 수위 라벨 (왼쪽) */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '120px', display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end', paddingBottom: '0',
              pointerEvents: 'none',
            }}>
              {/* 위험수위 라벨 */}
              <div style={{
                position: 'absolute',
                bottom: `${dangerPct}%`,
                fontSize: '0.78rem', color: '#ef4444', whiteSpace: 'nowrap',
              }}>
                위험수위 ({station.PLAN_FLDE})m
              </div>
              {/* 경고수위 라벨 */}
              <div style={{
                position: 'absolute',
                bottom: `${warnPct}%`,
                fontSize: '0.78rem', color: '#f59e0b', whiteSpace: 'nowrap',
              }}>
                경고수위 ({station.CNTRL_WATL})m
              </div>
              {/* 현재수위 라벨 */}
              <div style={{
                position: 'absolute',
                bottom: `${currentPct}%`,
                fontSize: '0.78rem', color: bgDeep, whiteSpace: 'nowrap',
                fontWeight: 700,
              }}>
                현재수위 ({station.RLTM_RVR_WATL_CNT})m
              </div>
            </div>

            {/* 하천 단면 애니메이션 */}
            <div style={{ marginLeft: '130px', position: 'relative' }}>
              <svg
                viewBox="0 0 600 400"
                style={{ width: '100%', height: 'auto', overflow: 'visible' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 제방 (사다리꼴 외곽선) */}
                <polyline
                  points="60,20 140,380 460,380 540,20"
                  fill="none" stroke="#333" strokeWidth="3"
                />

                {/* 위험수위 선 (빨강) */}
                <line
                  x1="60" y1={400 - dangerPct * 3.6}
                  x2="540" y2={400 - dangerPct * 3.6}
                  stroke="#ef4444" strokeWidth="2"
                />

                {/* 경고수위 선 (노랑) */}
                <line
                  x1="60" y1={400 - warnPct * 3.6}
                  x2="540" y2={400 - warnPct * 3.6}
                  stroke="#f59e0b" strokeWidth="2"
                />

                {/* 물 영역 */}
                <clipPath id="trapezoid-clip">
                  <polygon points="140,380 460,380 540,20 60,20" />
                </clipPath>

                <rect
                  x="0" y={400 - currentPct * 3.6}
                  width="600" height={currentPct * 3.6 + 20}
                  fill={bgDeep}
                  clipPath="url(#trapezoid-clip)"
                  style={{ transition: 'y 1s ease, height 1s ease' }}
                />

                {/* 물결 애니메이션 */}
                <g clipPath="url(#trapezoid-clip)">
                  <path
                    d={`M0,${400 - currentPct * 3.6}
                        Q75,${400 - currentPct * 3.6 - 8} 150,${400 - currentPct * 3.6}
                        Q225,${400 - currentPct * 3.6 + 8} 300,${400 - currentPct * 3.6}
                        Q375,${400 - currentPct * 3.6 - 8} 450,${400 - currentPct * 3.6}
                        Q525,${400 - currentPct * 3.6 + 8} 600,${400 - currentPct * 3.6}
                        L600,420 L0,420 Z`}
                    fill={bgDeep}
                    opacity="0.8"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from="-150,0" to="0,0"
                      dur="3s" repeatCount="indefinite"
                    />
                  </path>
                </g>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* ── 경고/위험 팝업 ── */}
      {alertMsg && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}
          onClick={() => setAlertMsg(null)}
        >
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '2rem 2.5rem', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxWidth: '360px',
          }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444', marginBottom: '1rem' }}>
              {alertMsg}
            </p>
            <button
              onClick={() => setAlertMsg(null)}
              style={{
                padding: '0.5rem 1.5rem', background: '#ef4444',
                color: '#fff', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* ── 수위계 사진 팝업 ── */}
      {showPhoto && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}
          onClick={() => setShowPhoto(false)}
        >
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '1rem', maxWidth: '90vw', maxHeight: '80vh',
            overflow: 'hidden',
          }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={`/images/${id}.jpg`}
              alt={`${id} 수위계`}
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = '';
                (e.currentTarget as HTMLImageElement).alt = '사진 없음';
              }}
            />
            <button
              onClick={() => setShowPhoto(false)}
              style={{
                marginTop: '0.75rem', width: '100%',
                padding: '0.5rem', background: '#555',
                color: '#fff', border: 'none', borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
