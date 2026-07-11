'use client';
// components/Sidebar.tsx
import { useState } from 'react';

// ── 서울 수위계 정적 데이터 ───────────────────────────
const SEOUL_STATIONS = [
  { watgCd: '2301', rvrNm: '도림천', watgNm: '신대방역' },
  { watgCd: '2303', rvrNm: '도림천', watgNm: '양산교' },
  { watgCd: '2002', rvrNm: '도림천', watgNm: '도림교' },
  { watgCd: '2003', rvrNm: '목감천', watgNm: '광화교' },
  { watgCd: '301',  rvrNm: '방학천', watgNm: '모래말옆' },
  { watgCd: '1401', rvrNm: '불광천', watgNm: '증산교' },
  { watgCd: '2001', rvrNm: '안양천', watgNm: '고척교' },
  { watgCd: '2201', rvrNm: '안양천', watgNm: '기아대교' },
  { watgCd: '303',  rvrNm: '우이천', watgNm: '계성교' },
  { watgCd: '401',  rvrNm: '우이천', watgNm: '장월교' },
  { watgCd: '801',  rvrNm: '정릉천', watgNm: '용두교' },
  { watgCd: '302',  rvrNm: '중랑천', watgNm: '노원교' },
  { watgCd: '402',  rvrNm: '중랑천', watgNm: '신의교' },
  { watgCd: '403',  rvrNm: '중랑천', watgNm: '월계1교' },
  { watgCd: '901',  rvrNm: '중랑천', watgNm: '성동교' },
  { watgCd: '101',  rvrNm: '탄천',  watgNm: '여수대교' },
  { watgCd: '102',  rvrNm: '탄천',  watgNm: '대곡교' },
  { watgCd: '103',  rvrNm: '탄천',  watgNm: '탄천2교' },
  { watgCd: '2502', rvrNm: '탄천',  watgNm: '봉은교' },
  { watgCd: '902',  rvrNm: '청계천', watgNm: '마장2교' },
  { watgCd: '1501', rvrNm: '홍제천', watgNm: '성산2교' },
];

// ── 부산 수위계 정적 데이터 ───────────────────────────
const BUSAN_STATIONS = [
//  { siteId: '200-0001', siteName: '동천교' },
//  { siteId: '200-0002', siteName: '범5호교' },
//  { siteId: '200-0003', siteName: '화명교' },
//  { siteId: '200-0004', siteName: '학장교' },
  { siteId: '200-0005', siteName: '동백천' },
  { siteId: '200-0006', siteName: '임기천' },
//  { siteId: '200-0007', siteName: '용소천' },
//  { siteId: '200-0008', siteName: '효암천' },
//  { siteId: '200-0009', siteName: '고래골천' },
//  { siteId: '200-0010', siteName: '이곡천' },
//  { siteId: '200-0011', siteName: '대천교' },
//  { siteId: '200-0012', siteName: '삼락22호교' },
//  { siteId: '200-0013', siteName: '청천교' },
//  { siteId: '200-0014', siteName: '용상교' },
//  { siteId: '210-0001', siteName: '장전동역' },
//  { siteId: '210-0002', siteName: '연안교' },
//  { siteId: '210-0003', siteName: '원동교' },
//  { siteId: '210-0004', siteName: '온천천 하류' },
//  { siteId: '210-0007', siteName: '중앙여고' },
//  { siteId: '210-0008', siteName: '온천장역 북측' },
];

// ── 1차 메뉴 컴포넌트 ────────────────────────────────
// function MenuItem({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div className="menu-item">
//       <button className="menu-trigger">
//         {label}
//         <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
//              stroke="currentColor" strokeWidth="2.5" className="chevron">
//           <polyline points="9 18 15 12 9 6" />
//         </svg>
//       </button>
//       <div className="submenu">{children}</div>

function MenuItem({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`menu-item ${open ? 'menu-open' : ''}`}>
      <button className="menu-trigger" onClick={() => setOpen(value => !value)} aria-expanded={open}>
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
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 0.75rem 1.5rem;
          background: none; border: none;
          color: var(--text-primary); font-size: 0.9rem; font-weight: 500;
          cursor: pointer; text-align: left;
          transition: background var(--transition), color var(--transition);
        }
        .menu-item:hover > .menu-trigger {
          background: var(--bg-hover); color: var(--accent);
        }
        .chevron {
          flex-shrink: 0; opacity: 0.45;
          transition: transform var(--transition), opacity var(--transition);
        }
        .menu-item:hover > .menu-trigger .chevron {
          transform: rotate(90deg); opacity: 1;
        }
        .submenu {
          max-height: 0; overflow: hidden;
          background: rgba(0,0,0,0.18); border-left: 2px solid transparent; opacity: 0;
          transition: max-height 300ms cubic-bezier(0.4,0,0.2,1), opacity 240ms ease, border-color var(--transition);
        }
        .menu-item:hover > .submenu {
          max-height: 900px; opacity: 1; border-left-color: var(--accent); overflow-y: auto;
        }

        @media (max-width: 760px) {
          .menu-item:hover > .submenu { max-height: 0; opacity: 0; overflow: hidden; }
          .menu-item.menu-open > .submenu { max-height: 900px; opacity: 1; border-left-color: var(--accent); overflow-y: auto; }
          .menu-item.menu-open > .menu-trigger .chevron { transform: rotate(90deg); opacity: 1; }
        }

      `}</style>
    </div>
  );
}

// ── 2차 메뉴 항목 ────────────────────────────────────
function SubItem({ children, href }: { children: React.ReactNode; href?: string }) {
  const baseStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    padding: '0.58rem 1.5rem 0.58rem 2rem',
    fontSize: '0.82rem', color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'color var(--transition), background var(--transition)',
    textDecoration: 'none',
  };

  const dot = (
    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', opacity: 0.4, flexShrink: 0 }} />
  );

  if (href) {
    return (
      <a
        href={href}
        target="_top"
        style={baseStyle}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent-dim)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
      >
        {dot}
        <span style={{ flex: 1 }}>{children}</span>
      </a>
    );
  }

  return (
    <div style={baseStyle}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-dim)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      {dot}
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

// ── Sidebar 본체 ─────────────────────────────────────
// export default function Sidebar() {

export default function Sidebar({
  mobileOpen = false,
  onClose
}: {
  mobileOpen?: boolean;
  onClose?: () => void
}) {
  return (
    <>
    {mobileOpen && (
      <button
        className="sidebar-backdrop"
        onClick={onClose}
        aria-label="메뉴 닫기"
      />
    )}
    <nav
      className={`site-sidebar ${mobileOpen ? 'is-open' : ''}`}
      onClick={event => {
        if ((event.target as HTMLElement).closest('a')) {
          onClose?.();
        }
      }}
    style={{
      gridColumn: '1', gridRow: '2',
      background: 'var(--bg-deep)',
      borderRight: '1px solid var(--border)',
      overflowY: 'auto', overflowX: 'hidden',
      padding: '1.5rem 0', zIndex: 50,
    }}>
      <button
        className="sidebar-close"
        onClick={onClose}
        aria-label="메뉴 닫기"
      >
        ×
      </button>


      {/* ── 지도로 돌아가기 ──
      <a
        href="https://www.riverlevel-info.kr"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-backtomap)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <>지도로<br />돌아가기</>
      </a>
      <Divider />
      */}

      {/* ── 지역 분류 ── */}
      <div style={{ marginBottom: '0.25rem' }}>
        <SectionLabel>지역 분류</SectionLabel>

        <MenuItem label="서울">
          {SEOUL_STATIONS.map(s => (
            <SubItem key={s.watgCd} href={`/seoul/${s.watgCd}`}>
              {s.rvrNm} {s.watgNm}
            </SubItem>
          ))}
        </MenuItem>

        <MenuItem label="부산">
          {BUSAN_STATIONS.map(s => (
            <SubItem key={s.siteId} href={`/busan/${s.siteId}`}>
              {s.siteName}
            </SubItem>
          ))}
        </MenuItem>
      </div>

      <Divider />

      {/* ── 링크 ── */}
      <a
        href="https://www.riverlevel-info.kr/history"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-backtomap)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <>과거 자료<br />확인하기</>
      </a>

      <a
        href="https://radar.kma.go.kr/radar/main.do?cgiId=HSR"
        target="_blank"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-backtomap)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <>비구름<br />확인하기</>
      </a>

      <a
        href="https://www.weather.go.kr/w/index.do"
        target="_blank"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-backtomap)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <>기상예보<br />확인하기</>
      </a>

      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSculavkKLqlbaxQeB7iM5horoVSCi0amN-1h4vmRT38mxG_Yw/viewform?usp=publish-editor"
        target="_blank" title="새 창에서 구글폼 열기"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-backtomap)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
          버그 및 개선사항 제보
      </a>
      
      <a
        href="https://qr.kakaopay.com/Ej8ONNgYW"
        target="_blank"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-backtomap)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
          <>유지보수 기여<br />- 카카오페이 송금</>
      </a>

    </nav>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'block', padding: '0.2rem 1.5rem 0.5rem', fontSize: '0.63rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 1.5rem' }} />;
}
