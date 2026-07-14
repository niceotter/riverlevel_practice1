// app/page.tsx
import Header    from '@/components/Header';
import Sidebar   from '@/components/Sidebar';
import MapView   from '@/components/MapView';

export default function Page() {
  return (
    <div className="app-grid" style={{
      display: 'grid',
      gridTemplateRows: '20vh 80vh',
      gridTemplateColumns: '20% 80%',
      height: '100vh',
      width: '100vw',
    }}>
      <Header />
      <Sidebar />
      <MapView />

      <style>{`
        @media (max-width: 768px) {
          .app-grid {
            grid-template-columns: 1fr !important;
          }
          /* 사이드바(햄버거 버튼/오버레이/nav)를 제외한 나머지 요소는
             모바일에서 화면 전체 폭을 사용하도록 강제 */
          .app-grid > *:not(.sidebar-hamburger):not(.sidebar-backdrop):not(.sidebar-nav) {
            grid-column: 1 !important;
          }
        }
      `}</style>

    </div>
  );
}
