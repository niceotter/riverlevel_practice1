'use client';
// components/Sidebar.tsx

import { useEffect, useState } from 'react';
import { FloodItem, FloodApiResponse, getStatusLevel } from '@/types/flood';

// 사이드바에서 선택한 관측소를 MapView와 공유하는 간단한 이벤트
// (전역 상태 라이브러리 없이 CustomEvent로 처리)
function emitSiteSelect(item: FloodItem) {
  window.dispatchEvent(new CustomEvent('siteSelect', { detail: item }));
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


// ── 서울 관측소 정적 데이터 ───────────────────────────
const SEOUL_STATIONS = [
  { watgCd: '1401', rvrNm: '불광천', watgNm: '증산교' },
  { watgCd: '1501', rvrNm: '홍제천', watgNm: '성산2교' },
];

// ── 서브메뉴 컴포넌트 ────────────────────────────────
function MenuItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="menu-item">
      <button className="menu-trigger">
        {label}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" className="chevron">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <div className="submenu">{children}</div>

      <style>{`
        .menu-item { position: relative; }

        .menu-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: background var(--transition), color var(--transition);
        }
        .menu-item:hover > .menu-trigger {
          background: var(--bg-hover);
          color: var(--accent);
        }

        .chevron {
          flex-shrink: 0;
          opacity: 0.45;
          transition: transform var(--transition), opacity var(--transition);
        }
        .menu-item:hover > .menu-trigger .chevron {
          transform: rotate(90deg);
          opacity: 1;
        }

        .submenu {
          max-height: 0;
          overflow: hidden;
          background: rgba(0,0,0,0.18);
          border-left: 2px solid transparent;
          opacity: 0;
          transition:
            max-height 300ms cubic-bezier(0.4,0,0.2,1),
            opacity 240ms ease,
            border-color var(--transition);
        }
        .menu-item:hover > .submenu {
          max-height: 600px;
          opacity: 1;
          border-left-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function SubItem({
  children,
  badge,
  badgeLevel = 'normal',
  onClick,
  href,
}: {
  children: React.ReactNode;
  badge?: string;
  badgeLevel?: 'normal' | 'warn' | 'danger';
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <span style={{
        width: '4px', height: '4px', borderRadius: '50%',
        background: 'var(--accent)', opacity: 0.4, flexShrink: 0,
      }} />
      <span style={{ flex: 1 }}>{children}</span>
      {badge && (
        <span style={{
          fontSize: '0.65rem', padding: '0.1rem 0.45rem',
          borderRadius: '20px',
          background: STATUS_BG[badgeLevel],
          color: STATUS_COLOR[badgeLevel],
          flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
    </>
  );

  const baseStyle = {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    padding: '0.58rem 1.5rem 0.58rem 2rem',
    fontSize: '0.82rem', color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'color var(--transition), background var(--transition)',
    textDecoration: 'none',
  };

  if (href) {
    return (
      <a
        href={href}
        style={baseStyle as React.CSSProperties}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
          (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent-dim)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)';
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{ ...baseStyle, cursor: onClick ? 'pointer' : 'default' } as React.CSSProperties}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
        (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-dim)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)';
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      {inner}
    </div>
  );
}

// ── Sidebar 본체 ─────────────────────────────────────
export default function Sidebar() {
  const [floodItems, setFloodItems] = useState<FloodItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);

  useEffect(() => {
    fetch('/api/flood')
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<FloodApiResponse>;
      })
      .then(data => {
        const items = data?.response?.body?.items?.item ?? [];
        setFloodItems(Array.isArray(items) ? items : [items]);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <nav style={{
      gridColumn: '1',
      gridRow:    '2',
      background: 'var(--bg-deep)',
      borderRight: '1px solid var(--border)',
      overflowY:  'auto',
      overflowX:  'hidden',
      padding:    '1.5rem 0',
      zIndex:     50,
    }}>

      {/* ── 지도로 돌아가기 버튼 ── */}
      <a
        href="https://www.riverlevel-info.kr"
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '0.5rem',
          padding:        '0.75rem 1.5rem',
          fontSize:       '0.85rem',
          fontWeight:     600,
          color:          'var(--text-body)',// 'var(--accent)',
          textDecoration: 'none',
          transition:     'background var(--transition)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-backtomap)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <>지도로<br />돌아가기</>
      </a>

      <Divider />

      {/* ── 지역 분류 ── */}
      <div style={{ marginBottom: '0.25rem' }}>
        <SectionLabel>지역 분류</SectionLabel>

        {/* 서울 */}
        <MenuItem label="서울">
          {SEOUL_STATIONS.map(s => (
            <SubItem
              key={s.watgCd}
              href={`/seoul/${s.watgCd}`}
            >
              {s.rvrNm.trim()} {s.watgNm}
            </SubItem>
          ))}
        </MenuItem>

        {/* 부산 */}
        <MenuItem label="부산">
          {loading && <SubItem>불러오는 중…</SubItem>}
          {error && (
            <SubItem>
              <span style={{ color: 'var(--status-danger)' }}>불러오기 실패</span>
            </SubItem>
          )}
          {!loading && !error && floodItems.map(item => {
            const level = getStatusLevel(item);
            return (
              <SubItem
                key={item.siteCode}
                badge={item.sttusNm}
                badgeLevel={level}
                onClick={() => emitSiteSelect(item)}
              >
                {item.siteName}
              </SubItem>
            );
          })}
        </MenuItem>
      </div>

    </nav>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'block',
      padding: '0.2rem 1.5rem 0.5rem',
      fontSize: '0.63rem',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
    }}>
      {children}
    </span>
  );
}

function Divider() {
  return (
    <div style={{
      height:     '1px',
      background: 'var(--border)',
      margin:     '0.75rem 1.5rem',
    }} />
  );
}


{/*
// ── 정적 메뉴 데이터 ──────────────────────────────────
const STATIC_MENUS = [
  {
    label: '서울',
    items: ['서울 · 경기', '인천 · 강원', '충청 · 대전', '전라 · 광주', '경상 · 부산', '제주'],
  },
  {
    label: '부산',
    items: ['카테고리 A', '카테고리 B', '카테고리 C'],
  },
];

// ── 서브메뉴 컴포넌트 ────────────────────────────────
function MenuItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="menu-item">
      <button className="menu-trigger">
        {label}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" className="chevron">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <div className="submenu">{children}</div>

      <style>{`
        .menu-item { position: relative; }

        .menu-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: background var(--transition), color var(--transition);
        }
        .menu-item:hover > .menu-trigger {
          background: var(--bg-hover);
          color: var(--accent);
        }

        .chevron {
          flex-shrink: 0;
          opacity: 0.45;
          transition: transform var(--transition), opacity var(--transition);
        }
        .menu-item:hover > .menu-trigger .chevron {
          transform: rotate(90deg);
          opacity: 1;
        }

        .submenu {
          max-height: 0;
          overflow: hidden;
          background: rgba(0,0,0,0.18);
          border-left: 2px solid transparent;
          opacity: 0;
          transition:
            max-height 300ms cubic-bezier(0.4,0,0.2,1),
            opacity 240ms ease,
            border-color var(--transition);
        }
        .menu-item:hover > .submenu {
          max-height: 600px;
          opacity: 1;
          border-left-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function SubItem({
  children,
  badge,
  badgeLevel = 'normal',
  onClick,
}: {
  children: React.ReactNode;
  badge?: string;
  badgeLevel?: 'normal' | 'warn' | 'danger';
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '0.55rem',
        padding:    '0.58rem 1.5rem 0.58rem 2rem',
        fontSize:   '0.82rem',
        color:      'var(--text-muted)',
        cursor:     onClick ? 'pointer' : 'default',
        transition: 'color var(--transition), background var(--transition)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
        (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-dim)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)';
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >

//      점

      <span style={{
        width: '4px', height: '4px', borderRadius: '50%',
        background: 'var(--accent)', opacity: 0.4, flexShrink: 0,
      }} />

      <span style={{ flex: 1 }}>{children}</span>

      {badge && (
        <span style={{
          fontSize:     '0.65rem',
          padding:      '0.1rem 0.45rem',
          borderRadius: '20px',
          background:   STATUS_BG[badgeLevel],
          color:        STATUS_COLOR[badgeLevel],
          flexShrink:   0,
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Sidebar 본체 ─────────────────────────────────────
export default function Sidebar() {
  const [floodItems, setFloodItems] = useState<FloodItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);

  useEffect(() => {
    fetch('/api/flood')
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<FloodApiResponse>;
      })
      .then(data => {
        const items = data?.response?.body?.items?.item ?? [];
        setFloodItems(Array.isArray(items) ? items : [items]);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <nav style={{
      gridColumn:   '1',
      gridRow:      '2',
      background:   'var(--bg-deep)',
      borderRight:  '1px solid var(--border)',
      overflowY:    'auto',
      overflowX:    'hidden',
      padding:      '1.5rem 0',
      zIndex:       50,
    }}>

//      ── 정적 메뉴 ── 
      <div style={{ marginBottom: '0.25rem' }}>
        <SectionLabel>지역 분류</SectionLabel>
        {STATIC_MENUS.map(m => (
          <MenuItem key={m.label} label={m.label}>
            {m.items.map(i => <SubItem key={i}>{i}</SubItem>)}
          </MenuItem>
        ))}
      </div>

      <Divider />

//            ── 침수 관측소 (동적) ──
      <div>
        <SectionLabel>침수 관측소</SectionLabel>
        <MenuItem label="관측소 목록">
          {loading && (
            <SubItem>불러오는 중…</SubItem>
          )}
          {error && (
            <SubItem>
              <span style={{ color: 'var(--status-danger)' }}>불러오기 실패</span>
            </SubItem>
          )}
          {!loading && !error && floodItems.map(item => {
            const level = getStatusLevel(item);
            return (
              <SubItem
                key={item.siteCode}
                badge={item.sttusNm}
                badgeLevel={level}
                onClick={() => emitSiteSelect(item)}
              >
                {item.siteName}
              </SubItem>
            );
          })}
        </MenuItem>
      </div>

      <Divider />

//      ── 설정 ──
      <div>
        <SectionLabel>설정</SectionLabel>
        <MenuItem label="표시 옵션">
          <SubItem>지도 스타일</SubItem>
          <SubItem>언어 설정</SubItem>
        </MenuItem>
      </div>
    </nav>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display:       'block',
      padding:       '0.2rem 1.5rem 0.5rem',
      fontSize:      '0.63rem',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color:         'var(--text-muted)',
    }}>
      {children}
    </span>
  );
}

function Divider() {
  return (
    <div style={{
      height:     '1px',
      background: 'var(--border)',
      margin:     '0.75rem 1.5rem',
    }} />
  );
}
*/}