'use client';
// components/FloatWindow.tsx

import { FloodItem, getStatusLevel } from '@/types/flood';

interface Props {
  item: FloodItem | null;
  x: number;
  y: number;
  areaWidth: number;
}

const STATUS_COLOR = {
  normal: 'var(--status-ok)',
  warn:   'var(--status-warn)',
  danger: 'var(--status-danger)',
};

const STATUS_BG = {
  normal: 'rgba(62,207,142,0.12)',
  warn:   'rgba(245,158,11,0.12)',
  danger: 'rgba(239,68,68,0.12)',
};

export default function FloatWindow({ item, x, y, areaWidth }: Props) {
  const visible = item !== null;
  const status  = item ? getStatusLevel(item) : 'normal';
  const color   = STATUS_COLOR[status];
  const bg      = STATUS_BG[status];

  const W = 250;
  let left = x - W / 2;
  let top  = y - 170;          // 핀 위쪽
  if (left < 8)              left = 8;
  if (left + W > areaWidth - 8) left = areaWidth - W - 8;
  if (top  < 8)              top  = y + 48;  // 공간 부족 시 아래

  return (
    <div style={{
      position:   'absolute',
      left:       `${left}px`,
      top:        `${top}px`,
      width:      `${W}px`,
      zIndex:     200,
      pointerEvents: 'none',
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
      visibility: visible ? 'visible' : 'hidden',
      transition: 'opacity 200ms ease, transform 200ms ease',
    }}>
      <div style={{
        background:   'var(--bg-panel)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow:    'var(--shadow-float)',
        overflow:     'hidden',
      }}>
        {/* 상단 골드 라인 */}
        <div style={{
          height:     '2px',
          background: 'linear-gradient(90deg, var(--accent), transparent)',
        }} />

        {/* 헤더 */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.65rem',
          padding:    '0.8rem 1rem 0.65rem',
        }}>
          {/* 상태 점 */}
          <div style={{
            width:        '10px',
            height:       '10px',
            borderRadius: '50%',
            flexShrink:   0,
            background:   color,
            boxShadow:    `0 0 6px ${color}`,
            animation:    'dotPulse 2s ease-in-out infinite',
          }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item?.siteName ?? '—'}
            </div>
            <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {item?.obsrTime ?? '—'}
            </div>
          </div>

          {/* 상태 배지 */}
          <div style={{
            fontSize:     '0.68rem',
            padding:      '0.2rem 0.55rem',
            borderRadius: '20px',
            background:   bg,
            color,
            whiteSpace:   'nowrap',
            flexShrink:   0,
          }}>
            {item?.sttusNm ?? '—'}
          </div>
        </div>

        {/* 본문 */}
        <div style={{
          padding:      '0.6rem 1rem 0.8rem',
          borderTop:    '1px solid var(--border)',
          margin:       '0 0.5rem',
          display:      'flex',
          flexDirection:'column',
          gap:          '0.45rem',
        }}>
          {[
            { label: '현재 수위', value: item ? `${parseFloat(item.fludLevel).toFixed(2)} m` : '—', style: {} },
            { label: '경계 수위', value: item ? `${item.alertLevel3} m` : '—', style: { color: 'var(--status-warn)' } },
            { label: '위험 수위', value: item ? `${item.alertLevel4} m` : '—', style: { color: 'var(--status-danger)' } },
          ].map(({ label, value, style }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', ...style }}>{value}</span>
            </div>
          ))}
        </div>

        {/* 꼬리 삼각형 */}
        <div style={{
          position:  'absolute',
          bottom:    '-7px',
          left:      '50%',
          transform: 'translateX(-50%)',
          width:     '14px',
          height:    '7px',
          overflow:  'hidden',
        }}>
          <div style={{
            position:  'absolute',
            top:       '-7px',
            left:      '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width:     '14px',
            height:    '14px',
            background:'var(--bg-panel)',
            border:    '1px solid var(--border)',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
