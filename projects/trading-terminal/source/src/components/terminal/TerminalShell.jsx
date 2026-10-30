import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopStatusBar from './TopStatusBar';
import SideNav from './SideNav';
import MobileTabBar from './MobileTabBar';
import MobileTopHeader from './MobileTopHeader';

export default function TerminalShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background safe-top">
      <TopStatusBar onMenuClick={() => setMobileOpen(true)} />
      <MobileTopHeader />
      <div className="flex flex-1 overflow-hidden">
        <SideNav
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}