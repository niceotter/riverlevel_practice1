'use client';
// components/Header.tsx

export default function Header() {
  return (
    <header style={{
      gridColumn: '1 / -1',
      gridRow: '1',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2.5rem',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)',
      position: 'relative',
      zIndex: 100,
    }}>
      {/* 하단 골드 라인 */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
      }} />

      <h1 style={{
        fontFamily: "'Georgia', 'Nanum Myeongjo', serif",
        fontSize: 'clamp(1.5rem, 3vw, 2.6rem)',
        fontWeight: 400,
        letterSpacing: '0.07em',
        color: 'var(--text-primary)',
      }}>
        사이트{' '}
        <span style={{ color: 'var(--accent)' }}>제목</span>
      </h1>

      <span style={{
        marginLeft: 'auto',
        fontSize: '0.72rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        실시간 현황
      </span>
    </header>
  );
}
