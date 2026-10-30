import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/', label: '总览', icon: LayoutDashboard, end: true },
  { to: '/plan', label: '交易计划', icon: ClipboardList },
  { to: '/position-calculator', label: '仓位计算器', icon: Calculator },
];

export default function MobileTabBar() {
  return (
    <nav className="md:hidden shrink-0 border-t border-border bg-sidebar/95 backdrop-blur flex items-stretch safe-bottom select-none">
      {TABS.map((t) => {
        const Icon = t.icon;
        return (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => cn(
              'mobile-tap flex-1 flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-heading transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{t.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}