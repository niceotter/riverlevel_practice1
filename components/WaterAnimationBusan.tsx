'use client';
// components/WaterAnimationBusan.tsx

import { useEffect, useState, useRef } from 'react';

interface BusanStation {
  siteCode: string;
  siteName: string;
  waterLevel: string;
  dayLevelMax: string;
  obsrTime: string;
  alertLevel1: string;   // 바닥 (둔치)
  alertLevel1Nm: string;
  alertLevel2: string;   // 주의
  alertLevel2Nm: string;
  alertLevel3: string;   // 경계 (경고)
  alertLevel3Nm: string;
  alertLevel4: string;   // 위험 (꼭대기)
  alertLevel4Nm: string;
  sttus: string;
  sttusNm: string;
}

function levelToPercent(level: number, bottom: number, top: number) {
  const range = top - bottom;
  if (range <= 0) return 0;
  const pct = (level - bottom) / range * 100;
  return Math.min(Math.max(pct, 0), 100);
}

interface Props {
  id: string;        // siteCode에서 앞 '00-' 제거한 값 (예: 200-0005)
  bgDeep: string;
  bgHeader: string;
  externalLink?: string;
}

export default function WaterAnimationBusan({ id, bgDeep, bgHeader, externalLink = '#' }: Props) {
  const [station,   setStation]   = useState<BusanStation | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showNoLink, setShowNoLink] = useState(false);
  const [alertMsg,  setAlertMsg]  = useState<string | null>(null);
  const alertShown = useRef({ warn: false, danger: false });

  useEffect(() => {
    const load = () => {
      fetch('/api/busan')
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => {
          const items: BusanStation[] = data?.response?.body?.items?.item ?? [];
          // '00-' + id 로 원래 siteCode 복원해서 찾기
          const found = items.find(i => i.siteCode === `00-${id}`);
          if (found) {
            setStation(found);
            const current = parseFloat(found.waterLevel);
            const warn    = parseFloat(found.alertLevel3);
            const danger  = parseFloat(found.alertLevel4);
            if (current >= danger && !alertShown.current.danger) {
              alertShown.current.danger = true;
              setAlertMsg(`⚠️ 위험수위 초과! 현재 ${found.waterLevel}m`);
            } else if (current >= warn && !alertShown.current.warn) {
              alertShown.current.warn = true;
              setAlertMsg(`⚠️ 경고수위 초과! 현재 ${found.waterLevel}m`);
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

  const bottom  = station ? parseFloat(station.alertLevel1) : 0;
  const top     = station ? parseFloat(station.alertLevel4) : 1;
  const current = station ? parseFloat(station.waterLevel)  : 0;
  const warn    = station ? parseFloat(station.alertLevel3) : 0;
  const danger  = station ? parseFloat(station.alertLevel4) : 0;

  const currentPct = levelToPercent(current, bottom, top);
  const warnPct    = levelToPercent(warn,    bottom, top);
  const dangerPct  = levelToPercent(danger,  bottom, top);

  // alertLevel2(주의)가 0보다 크면 표시
  const showWarn = station ? parseFloat(station.alertLevel3) > parseFloat(station.alertLevel1) : false;

  const SVG_TOP    = 20;
  const SVG_BOTTOM = 380;
  const SVG_RANGE  = SVG_BOTTOM - SVG_TOP;

  const waterY  = SVG_BOTTOM - currentPct / 100 * SVG_RANGE;
  const warnY   = SVG_BOTTOM - warnPct   / 100 * SVG_RANGE;
  const dangerY = SVG_BOTTOM - dangerPct / 100 * SVG_RANGE;

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
      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
        <button onClick={() => setShowPhoto(true)} style={{
          padding: '0.45rem 0.85rem', fontSize: '0.78rem',
          background: '#555', color: '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer',
          display: 'flex', alignItems: 'left',
        }}>
          📷 수위계 모습
        </button>
        {/*
        <button
          onClick={() => externalLink === '#' ? setShowNoLink(true) : window.open(externalLink, '_blank')}
          style={{
            padding: '0.45rem 0.85rem', fontSize: '0.78rem',
            background: '#555', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          🔗 관련 링크
        </button>
        
        <a href={externalLink} target="_blank" style={{
          padding: '0.45rem 0.85rem', fontSize: '0.78rem',
          background: '#555', color: '#fff',
          borderRadius: '6px', textDecoration: 'none',
          display: 'flex', alignItems: 'center',
        }}>
          🔗 관련 링크
        </a>
        */}
      </div>

      {/* 수위계 이름 + 계측 시각 +++ 출처 */}
      {station && (
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '0.8rem', color: '#555' }}>
          <strong>{station.siteName}</strong>
          <span style={{ marginLeft: '0.5rem', color: '#999' }}>{station.obsrTime}</span>
        </div>
      )}

      {loading && <p style={{ color: '#888' }}>데이터 불러오는 중…</p>}
      {error   && <p style={{ color: '#ef4444' }}>데이터를 불러올 수 없습니다.</p>}

      {station && (
        <div style={{ width: '100%', maxWidth: '720px', position: 'relative' }}>

          {/* 수위 라벨 (왼쪽) */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '130px', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', bottom: `calc(${dangerPct}% - 0.5rem)`, fontSize: '0.75rem', color: '#ef4444', whiteSpace: 'nowrap' }}>
              위험수위 ({station.alertLevel4})m
            </div>
            {showWarn && (
              <div style={{ position: 'absolute', bottom: `calc(${warnPct}% - 0.5rem)`, fontSize: '0.75rem', color: '#f59e0b', whiteSpace: 'nowrap' }}>
                경고수위 ({station.alertLevel3})m
              </div>
            )}
            <div style={{ position: 'absolute', bottom: `calc(${currentPct}% - 0.5rem)`, fontSize: '0.75rem', color: bgDeep, whiteSpace: 'nowrap', fontWeight: 700 }}>
              현재수위 ({station.waterLevel})m
            </div>
          </div>

          {/* SVG 하천 단면 */}
          <div style={{ marginLeft: '140px', position: 'relative' }}>
            <svg viewBox="0 0 600 400" style={{ width: '100%', height: 'auto', overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id={`trap-busan-${id}`}>
                  <polygon points="60,20 540,20 460,380 140,380" />
                </clipPath>
              </defs>

              {/* 물 배경 */}
              <rect x="0" y={waterY} width="600" height={SVG_BOTTOM - waterY}
                fill={bgDeep} clipPath={`url(#trap-busan-${id})`} />

              {/* 물결 */}
              <foreignObject x="0" y={waterY - 10} width="600" height="10" clipPath={`url(#trap-busan-${id})`}>
                <div style={{
                  width: '100%', height: '10px',
                  backgroundImage: wavePattern,
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: '20px 10px',
                }} />
              </foreignObject>

              {/* 위험수위 선 */}
              <line x1="60" y1={dangerY} x2="540" y2={dangerY} stroke="#ef4444" strokeWidth="2" />
              <line x1="60" y1={dangerY} x2="540" y2={dangerY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" clipPath={`url(#trap-busan-${id})`} />

              {/* 경고수위 선 */}
              {showWarn && (<>
                <line x1="60" y1={warnY} x2="540" y2={warnY} stroke="#f59e0b" strokeWidth="2" />
                <line x1="60" y1={warnY} x2="540" y2={warnY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" clipPath={`url(#trap-busan-${id})`} />
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
              src={`/images/busan-${id}.jpg`}
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
      {/*
      {showNoLink && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowNoLink(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', maxWidth: '90vw', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem' }}>현재 연결된 링크가 없습니다.</p>
            <button onClick={() => setShowNoLink(false)} style={{ padding: '0.5rem 1.5rem', background: '#555', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>
      )}
      */}


    </main>
  );
}
