'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MapView from '@/components/MapView';

export default function HomeShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="home-shell">
      <Header
        showMenuButton
        menuOpen={menuOpen}
        onMenuClick={() => setMenuOpen(true)}
      />
      <Sidebar
        mobileOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <MapView />
    </div>
  );
}
