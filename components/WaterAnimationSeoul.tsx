'use client';
// components/WaterAnimation.tsx

import { useEffect, useState, useRef } from 'react';

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
  externalLink?: string;  
}

//export default function WaterAnimation({ id, bgDeep, bgHeader }: Props) {
export default function WaterAnimation({ id, bgDeep, bgHeader, externalLink = '#' }: Props) {
  const [station,   setStation]   = useState<SeoulStation | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showNoLink, setShowNoLink] = useState(false);
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
            } else if (found.CNTRL_WATL > found.RBH && found.RLTM_RVR_WATL_CNT >= found.CNTRL_WATL && !alertShown.current.warn) {
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
  const showWarn   = station ? station.CNTRL_WATL > station.RBH : false;

  // SVG 좌표: RBH=아래(380), EBM_HGT=위(20), 범위=360
  const SVG_TOP    = 20;
  const SVG_BOTTOM = 380;
  const SVG_RANGE  = SVG_BOTTOM - SVG_TOP;

  const waterY  = SVG_BOTTOM - currentPct / 100 * SVG_RANGE;
  const warnY   = SVG_BOTTOM - warnPct   / 100 * SVG_RANGE;
  const dangerY = SVG_BOTTOM - dangerPct / 100 * SVG_RANGE;

  // 헤더와 동일한 물결 패턴
  const wavePattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpath d='M0 10 Q9 9 10 0 Q11 9 20 10' stroke='${encodeURIComponent(bgDeep)}' fill='${encodeURIComponent(bgDeep)}' stroke-width='2'/%3E%3C/svg%3E")`;

  return (
    <main style={{
      gridColumn: '2', gridRow: '2',
      position: 'relative', background: bgHeader,
      overflow: 'hidden', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '1rem 2rem', transition: 'background 1s ease',
    }}>

      {/* 우측 상단 버튼 2개 */}
      <div style={{ position: 'absolute', top: '4rem', left: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
        <button onClick={() => setShowPhoto(true)} style={{
          padding: '0.45rem 0.85rem', fontSize: '0.78rem',
          background: '#555', color: '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer',
          display: 'flex', alignItems: 'left',
        }}>
          📷 수위계 모습
        </button>
        <button
          onClick={() => externalLink === '#' ? setShowNoLink(true) : window.open(externalLink, '_blank')}
          style={{
            padding: '0.45rem 0.85rem', fontSize: '0.78rem',
            background: '#555', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            display: 'flex', alignItems: 'left',
          }}
        >
          <>📹 CCTV 링크<br />다른 곳을 바라보고<br />있을 수 있습니다</>
        </button>
        {/*
        <a href={externalLink} target="_blank" style={{
          padding: '0.45rem 0.85rem', fontSize: '0.78rem',
          background: '#555', color: '#fff',
          borderRadius: '6px', textDecoration: 'none',
          display: 'flex', alignItems: 'center',
        }}>
          🔗 CCTV 링크 - 비가 오지 않을때는 다른 곳을 바라보고 있을 수 있습니다
        </a>
        */}


      </div>

      {/* 수위계 이름 + 계측 시각 +++ 출처 */}
      {station && (
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '0.8rem', color: '#555' }}>
          <strong>{station.RVR_NM.trim()} {station.WATG_NM}</strong>
          <span style={{ marginLeft: '0.5rem', color: '#999' }}>{station.DTRSM_DATA_CLCT_TM}</span>
        </div>
      )}

      {loading && <p style={{ color: '#888' }}>데이터 불러오는 중…</p>}
      {error   && <p style={{ color: '#ef4444' }}>데이터를 불러올 수 없습니다.</p>}

      {station && (
        <div style={{ width: '100%', maxWidth: '720px', position: 'relative' }}>

          {/* 수위 라벨 (왼쪽) */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '130px', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', bottom: `calc(${dangerPct}% - 0.5rem)`, fontSize: '0.75rem', color: '#ef4444', whiteSpace: 'nowrap' }}>
              위험수위 ({station.PLAN_FLDE})m
            </div>
            {showWarn && (
              <div style={{ position: 'absolute', bottom: `calc(${warnPct}% - 0.5rem)`, fontSize: '0.75rem', color: '#f59e0b', whiteSpace: 'nowrap' }}>
                경고수위 ({station.CNTRL_WATL})m
              </div>
            )}
            <div style={{ position: 'absolute', bottom: `calc(${currentPct}% - 0.5rem)`, fontSize: '0.75rem', color: bgDeep, whiteSpace: 'nowrap', fontWeight: 700 }}>
              현재수위 ({station.RLTM_RVR_WATL_CNT})m
            </div>
          </div>

          {/* SVG 하천 단면 */}
          <div style={{ marginLeft: '140px', position: 'relative' }}>
            <svg
              viewBox="0 0 600 400"
              style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id={`trap-${id}`}>
                  {/* 사다리꼴: 위(EBM_HGT)=y20, 아래(RBH)=y380 */}
                  <polygon points="60,20 540,20 460,380 140,380" />
                </clipPath>
              </defs>

              {/* 물 배경 (RBH~현재수위) */}
              <rect
                x="0" y={waterY}
                width="600" height={SVG_BOTTOM - waterY}
                fill={bgDeep}
                clipPath={`url(#trap-${id})`}
              />

              {/* 물결 (헤더 패턴, 현재수위 위에 repeat-x) */}
              <foreignObject x="0" y={waterY - 10} width="600" height="10" clipPath={`url(#trap-${id})`}>
                <div
                  style={{
                    width: '100%', height: '10px',
                    backgroundImage: wavePattern,
                    backgroundRepeat: 'repeat-x',
                    backgroundSize: '20px 10px',
                  }}
                />
              </foreignObject>

              {/* 위험수위 선 */}
              <line x1="60" y1={dangerY} x2="540" y2={dangerY} stroke="#ef4444" strokeWidth="2" />
              <line x1="60" y1={dangerY} x2="540" y2={dangerY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" clipPath={`url(#trap-${id})`} />

              {/* 경고수위 선 */}
              {showWarn && (<>
                <line x1="60" y1={warnY} x2="540" y2={warnY} stroke="#f59e0b" strokeWidth="2" />
                <line x1="60" y1={warnY} x2="540" y2={warnY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" clipPath={`url(#trap-${id})`} />
              </>)}

              {/* 제방 외곽선 */}
              <polyline points="60,20 140,380 460,380 540,20" fill="none" stroke="#333" strokeWidth="3" />
            </svg>
          </div>
        </div>
      )}

      {/* 경고/위험 팝업 */}
      {alertMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setAlertMsg(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem 2.5rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: '360px' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginBottom: '1rem' }}>{alertMsg}</p>
            <button onClick={() => setAlertMsg(null)} style={{ padding: '0.5rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
              확인
            </button>
          </div>
        </div>
      )}

      {/* 수위계 사진 팝업 */}
      {showPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowPhoto(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem', maxWidth: '90vw', maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}>
            <img
              src={`/images/${id}.jpg`}
              alt={`${id} 수위계`}
              style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
              onError={e => { (e.currentTarget as HTMLImageElement).alt = '사진 없음'; }}
            />
            <button onClick={() => setShowPhoto(false)} style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 링크 없음 팝업 */}
      {showNoLink && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowNoLink(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', maxWidth: '90vw', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem' }}>본 수위계는 연결된 CCTV가 없습니다.</p>
            <button onClick={() => setShowNoLink(false)} style={{ padding: '0.5rem 1.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>

      )}
    </main>
  );
}