'use client';
// components/Sidebar.tsx

import { useState } from 'react';
import { useSidebar } from './SidebarContext';

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
  { watgCd: '903',  rvrNm: '청계천', watgNm: '사근용답' },
  { watgCd: '1501', rvrNm: '홍제천', watgNm: '성산2교' },
];

// ── 부산 수위계 정적 데이터 ───────────────────────────
const BUSAN_STATIONS = [
  { siteId: '200-0001', siteName: '동천교' },
  { siteId: '200-0002', siteName: '범5호교' },
  { siteId: '200-0003', siteName: '화명교' },
  { siteId: '200-0004', siteName: '학장교' },
//  { siteId: '200-0005', siteName: '동백천' },
//  { siteId: '200-0006', siteName: '임기천' },
//  { siteId: '200-0007', siteName: '용소천' },
//  { siteId: '200-0008', siteName: '효암천' },
//  { siteId: '200-0009', siteName: '고래골천' },
//  { siteId: '200-0010', siteName: '이곡천' },
 { siteId: '200-0011', siteName: '대천교' },
// { siteId: '200-0012', siteName: '삼락22호교' },
 { siteId: '200-0013', siteName: '청천교' },
 { siteId: '200-0014', siteName: '용상교' },
 { siteId: '210-0001', siteName: '장전동역' },
 { siteId: '210-0002', siteName: '연안교' },
 { siteId: '210-0003', siteName: '원동교' },
 { siteId: '210-0004', siteName: '온천천 하류' },
 { siteId: '210-0007', siteName: '중앙여고' },
 { siteId: '210-0008', siteName: '온천장역 북측' },
];

// ── 1차 메뉴 컴포넌트 ────────────────────────────────
function MenuItem({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="menu-item">
      <button
        className={`menu-trigger${open ? ' active' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
      >
        {label}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" className={`chevron${open ? ' open' : ''}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <div className={`submenu${open ? ' open' : ''}`}>{children}</div>

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
        .menu-trigger:hover, .menu-trigger.active { 
          background: var(--bg-hover); /* 서울 메뉴 열었을 때 서울의 배경색 */
          color: var(--accent);        /* 서울 메뉴 열었을 때 서울의 폰트색 */
        }
        .chevron {
          flex-shrink: 0; opacity: 0.45;
          transition: transform var(--transition), opacity var(--transition);
        }
        .chevron.open {
          transform: rotate(90deg); 
          opacity: 1;
        }
        .submenu {
          max-height: 0;
          overflow: hidden;
          background: var(--bg-water); /* 서울 메뉴 열었을 때 그냥 나오는 배경색 */
          border-left: 2px solid transparent;
          opacity: 0;
          transition: max-height 300ms cubic-bezier(0.4,0,0.2,1), opacity 240ms ease, border-color var(--transition);
        }
        .submenu.open {
          max-height: 2000px; 
          opacity: 1; 
          border-left-color: var(--tree-expand); /* 서울 메뉴 열었을 때 왼쪽에 나오는 파란색 선 */
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}

// ── 2차 메뉴 항목 ────────────────────────────────────
function SubItem({ children, href }: { children: React.ReactNode; href?: string }) {
  const baseStyle: React.CSSProperties = {
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.55rem',
    padding: '0.58rem 1.5rem 0.58rem 2rem',
    fontSize: '0.82rem', 
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'color var(--transition), background var(--transition)',
    textDecoration: 'none',
  };

  const dot = (
    <span style={{ 
      width: '4px', 
      height: '4px', 
      borderRadius: '50%', 
      background: 'var(--accent)', 
      opacity: 0.4, 
      flexShrink: 0 
    }} />
  );

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = 'var(--text-primary)';
    e.currentTarget.style.background = 'var(--bg-hover)'; // 불광천에 마우스 올렸을때 배경색
  };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = 'var(--text-muted)';
    e.currentTarget.style.background = 'transparent';
  };

  const Tag = href ? 'a' : 'div';

  return (
    <Tag
      {...(href ? { href, target: '_top' } : {})}
      style={baseStyle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {dot}
      <span style={{ flex: 1 }}>{children}</span>
    </Tag>
  );
}


// ── Sidebar 본체 ─────────────────────────────────────
export default function Sidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* 모바일 전용 배경 오버레이: 터치 시 사이드바 닫힘 */}
      <div
        className={`rl-sidebar-backdrop${isOpen ? ' open' : ''}`}
        onClick={close}
      />

      <nav className={`rl-sidebar${isOpen ? ' open' : ''}`} style={{
      gridColumn: '1', gridRow: '2',
      background: 'linear-gradient(180deg, var(--bg-water) 0%, #2f7fd6 100%), var(--bg-water)', //사이드바 기본 배경
      borderRight: '1px solid var(--border)',
      overflowY: 'auto', overflowX: 'hidden',
      padding: '1.5rem 0', zIndex: 50,
    }}>

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
        href="/history"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
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
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
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
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
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
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
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
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-body)', textDecoration: 'none', transition: 'background var(--transition)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
          <>유지보수 기여<br />- 카카오페이 송금</>
      </a>

      </nav>

      <style>{`
        .rl-sidebar-backdrop { display: none; }
        @media (max-width: 768px) {
          .rl-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            z-index: 45;
            opacity: 0;
            pointer-events: none;
            transition: opacity 260ms ease;
          }
          .rl-sidebar-backdrop.open {
            opacity: 1;
            pointer-events: auto;
          }
          .rl-sidebar {
            position: fixed !important;
            top: 20vh !important;
            left: 0 !important;
            grid-column: unset !important;
            grid-row: unset !important;
            width: 80vw !important;
            max-width: 300px !important;
            height: 80vh !important;
            transform: translateX(-100%);
            transition: transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
          }
          .rl-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
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
