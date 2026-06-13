// app/page.tsx
import Header    from '@/components/Header';
import Sidebar   from '@/components/Sidebar';
import MapView   from '@/components/MapView';

export default function Page() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '10vh 90vh',
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
