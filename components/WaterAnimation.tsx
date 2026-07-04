'use client';
// components/WaterAnimation.tsx
// 하천 수위 애니메이션 컴포넌트

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

interface SeoulStation {
  WATG_CD: string;
  WATG_NM: string;
  RVR_NM: string;
  GU_OFC_NM: string;
  DTRSM_DATA_CLCT_TM: string;
  RLTM_RVR_WATL_CNT: number;
  EBM_HGT: number;
  PLAN_FLDE: number;
  RBH: number;
  CNTRL_WATL: number;
}

function levelToPercent(level: number, rbh: number, ebmHgt: number) {
  const range = ebmHgt - rbh;
  const pct = (level - rbh) / range * 100;
  return Math.min(Math.max(pct, 0), 100);
}

interface Props {
  id: string;
  bgDeep: string;
  bgHeader: string;
}

export default function WaterAnimation({ id, bgDeep, bgHeader }: Props) {
  const [station,   setStation]   = useState<SeoulStation | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [alertMsg,  setAlertMsg]  = useState<string | null>(null);
  const alertShown = useRef({ warn: false, danger: false });

  useEffect(() => {
    const load = () => {
      fetch('/api/seoul')
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => {
          const rows: SeoulStation[] = data?.ListRiverStageService?.row ?? [];
          const found = rows.find(r => r.WATG_CD === id);
          if (found) {
            setStation(found);
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

  const currentPct = station ? levelToPercent(station.RLTM_RVR_WATL_CNT, station.RBH, station.EBM_HGT) : 0;
  const warnPct    = station ? levelToPercent(station.CNTRL_WATL,         station.RBH, station.EBM_HGT) : 0;
  const dangerPct  = station ? levelToPercent(station.PLAN_FLDE,           station.RBH, station.EBM_HGT) : 0;

  const waterY = 400 - currentPct * 3.6;
  const warnY  = 400 - warnPct   * 3.6;
  const dangerY = 400 - dangerPct * 3.6;

  return (
    <main style={{
      gridColumn: '2',
      gridRow:    '2',
      position:   'relative',
      background: bgHeader,
      overflow:   'hidden',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem 2rem',
      transition: 'background 1s ease',
    }}>

      {/* 우측 상단 버튼 2개 */}
      <div style={{
        position: 'absolute', top: '1rem', right: '1rem',
        display: 'flex', gap: '0.5rem', zIndex: 10,
      }}>
        <button
          onClick={() => setShowPhoto(true)}
          style={{
            padding: '0.45rem 0.85rem', fontSize: '0.78rem',
            background: bgDeep, color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
          }}
        >
          📷 수위계
        </button>
        <a
          href="#"
          target="_blank"
          style={{
            padding: '0.45rem 0.85rem', fontSize: '0.78rem',
            background: '#555', color: '#fff',
            borderRadius: '6px', textDecoration: 'none',
            display: 'flex', alignItems: 'center',
          }}
        >
          🔗 관련 링크
        </a>
      </div>

      {/* 관측소 이름 + 관측 시각 */}
      {station && (
        <div style={{
          position: 'absolute', top: '1rem', left: '1rem',
          fontSize: '0.8rem', color: '#555',
        }}>
          <strong>{station.RVR_NM.trim()} {station.WATG_NM}</strong>
          <span style={{ marginLeft: '0.5rem', color: '#999' }}>
            {station.DTRSM_DATA_CLCT_TM}
          </span>
        </div>
      )}

      {loading && <p style={{ color: '#888' }}>데이터 불러오는 중…</p>}
      {error   && <p style={{ color: '#ef4444' }}>데이터를 불러올 수 없습니다.</p>}

      {station && (
        <div style={{ width: '100%', maxWidth: '720px', position: 'relative' }}>

          {/* 수위 라벨 (왼쪽) */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: '130px', pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              bottom: `calc(${dangerPct}% - 0.5rem)`,
              fontSize: '0.75rem', color: '#ef4444', whiteSpace: 'nowrap',
            }}>
              위험수위 ({station.PLAN_FLDE})m
            </div>
            <div style={{
              position: 'absolute',
              bottom: `calc(${warnPct}% - 0.5rem)`,
              fontSize: '0.75rem', color: '#f59e0b', whiteSpace: 'nowrap',
            }}>
              경고수위 ({station.CNTRL_WATL})m
            </div>
            <div style={{
              position: 'absolute',
              bottom: `calc(${currentPct}% - 0.5rem)`,
              fontSize: '0.75rem', color: bgDeep, whiteSpace: 'nowrap',
              fontWeight: 700,
            }}>
              현재수위 ({station.RLTM_RVR_WATL_CNT})m
            </div>
          </div>

          {/* SVG 애니메이션 */}
          <div style={{ marginLeft: '140px' }}>
            <svg
              viewBox="0 0 600 400"
              style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* clipPath: 사다리꼴 안쪽만 표시 */}
              <defs>
                <clipPath id={`trap-${id}`}>
                  <polygon points="60,0 540,0 460,380 140,380" />
                </clipPath>
              </defs>

              {/* 물 배경 */}
              <rect
                x="0" y={waterY}
                width="600" height={400 - waterY + 20}
                fill={bgDeep}
                clipPath={`url(#trap-${id})`}
              />

              {/* 물결 레이어 1 */}
              <g clipPath={`url(#trap-${id})`}>
                <path
                  d={`M-150,${waterY} Q-75,${waterY - 8} 0,${waterY} Q75,${waterY + 8} 150,${waterY} Q225,${waterY - 8} 300,${waterY} Q375,${waterY + 8} 450,${waterY} Q525,${waterY - 8} 600,${waterY} Q675,${waterY + 8} 750,${waterY} L750,420 L-150,420 Z`}
                  fill={bgDeep}
                  opacity="0.85"
                >
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    from="0,0" to="150,0"
                    dur="3s" repeatCount="indefinite"
                  />
                </path>
              </g>

              {/* 물결 레이어 2 (반대방향, 약간 다른 속도) */}
              <g clipPath={`url(#trap-${id})`}>
                <path
                  d={`M-150,${waterY + 3} Q-75,${waterY - 5} 0,${waterY + 3} Q75,${waterY + 11} 150,${waterY + 3} Q225,${waterY - 5} 300,${waterY + 3} Q375,${waterY + 11} 450,${waterY + 3} Q525,${waterY - 5} 600,${waterY + 3} Q675,${waterY + 11} 750,${waterY + 3} L750,420 L-150,420 Z`}
                  fill={bgDeep}
                  opacity="0.5"
                >
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    from="150,0" to="0,0"
                    dur="4s" repeatCount="indefinite"
                  />
                </path>
              </g>

              {/* 위험수위 선 */}
              <line
                x1="60" y1={dangerY} x2="540" y2={dangerY}
                stroke="#ef4444" strokeWidth="2"
                clipPath={`url(#trap-${id})`}
              />
              {/* 위험수위 선 (제방 밖까지) */}
              <line
                x1="60" y1={dangerY} x2="540" y2={dangerY}
                stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3"
                opacity="0.4"
              />

              {/* 경고수위 선 */}
              <line
                x1="60" y1={warnY} x2="540" y2={warnY}
                stroke="#f59e0b" strokeWidth="2"
                clipPath={`url(#trap-${id})`}
              />
              <line
                x1="60" y1={warnY} x2="540" y2={warnY}
                stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3"
                opacity="0.4"
              />

              {/* 제방 외곽선 */}
              <polyline
                points="60,0 140,380 460,380 540,0"
                fill="none" stroke="#333" strokeWidth="3"
              />
            </svg>
          </div>
        </div>
      )}

      {/* 경고/위험 팝업 */}
      {alertMsg && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setAlertMsg(null)}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '2rem 2.5rem', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: '360px',
          }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginBottom: '1rem' }}>
              {alertMsg}
            </p>
            <button onClick={() => setAlertMsg(null)} style={{
              padding: '0.5rem 1.5rem', background: '#ef4444',
              color: '#fff', border: 'none', borderRadius: '6px',
              cursor: 'pointer', fontSize: '0.9rem',
            }}>
              확인
            </button>
          </div>
        </div>
      )}

      {/* 수위계 사진 팝업 */}
      {showPhoto && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowPhoto(false)}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '1rem', maxWidth: '90vw', maxHeight: '80vh',
          }} onClick={e => e.stopPropagation()}>
            <img
              src={`/images/${id}.jpg`}
              alt={`${id} 수위계`}
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
              onError={e => { (e.currentTarget as HTMLImageElement).alt = '사진 없음'; }}
            />
            <button onClick={() => setShowPhoto(false)} style={{
              marginTop: '0.75rem', width: '100%',
              padding: '0.5rem', background: '#555',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
