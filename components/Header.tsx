'use client';
// components/Header.tsx

export default function Header() {
  
  const bgWater = '#63adf8';  // 물결 라인 backgroundImage에 --bg-water 값을 직접 넣기보다는 변수로 정의해서 관리
  return (
    <header style={{
      gridColumn: '1 / -1',
      gridRow: '1',
      display: 'flex',
      flexShrink: 0,
      alignItems: 'center',
      paddingTop: 0,
      paddingRight: '1rem',
      paddingBottom: '1rem',
      paddingLeft: '1rem',
      background: 'var(--bg-header)',
      borderBottom: '10px solid var(--bg-water)',
      position: 'relative',
      zIndex: 100,
    }}>

      <h1 style={{
        fontFamily: "'Georgia', 'Nanum Myeongjo', serif",
        fontSize: 'clamp(1.5rem, 3vw, 2.6rem)',
        fontWeight: 400,
        letterSpacing: '0.07em',
        color: 'var(--text-header)',
      }}>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <>실시간<br />하천 수위 정보</>
        </a>
        {/*
        <span style={{
          color: '#000000',
          fontWeight: 300,
          fontSize: '1.2rem',
          marginLeft: '0.5rem',
        }}>
        </span>
        */}
      </h1>
      
      {/*}
      <span style={{
        marginLeft: 'auto',
        fontSize: '0.72rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSculavkKLqlbaxQeB7iM5horoVSCi0amN-1h4vmRT38mxG_Yw/viewform?usp=publish-editor"
        target="_blank" title="새 창에서 구글폼 열기">
          <>버그 및 개선사항 제보<br />Bug & Feedback</>
        </a>
      </span>
      */}

      {/* 물결 라인 정의 */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '10px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpath d='M0 10 Q9 9 10 0 Q11 9 20 10' stroke='${encodeURIComponent(bgWater)}' fill='${encodeURIComponent(bgWater)}' stroke-width='2'/%3E%3C/svg%3E")`,
//        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpath d='M0 10 Q9 9 10 0 Q11 9 20 10' stroke='%230080ff' fill='%230080ff' stroke-width='2'/%3E%3C/svg%3E")`,
//      data URI 스킴을 사용하여 SVG 패턴을 인라인으로 정의했습니다.
//      SVG는 40x6 크기의 작은 이미지로, 물결 모양의 선을 그리고 있습니다.
//      xmlns 속성은 SVG 네임스페이스를 정의하며, 
//      path 요소는 M(시작점)과 Q(직전 점에서 제어점-끝점을 잇는 2차 베지어 곡선을 그려줌) 명령어를 사용하여 곡선을 그립니다.
//      stroke는 선 색상, fill은 채우기 색상, stroke-width는 선 두께입니다.
//      backgroundRepeat: 'repeat-x'로 수평으로 패턴을 반복하고, width와 backgroundSize로 패턴의 크기를 조절하여 원하는 효과를 얻을 수 있습니다.
        backgroundRepeat: 'repeat-x',
        backgroundSize: '20px 10px',
//        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
      }}>
      </div>

    </header>
  );
}
