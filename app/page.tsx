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
    </div>
  );
}
