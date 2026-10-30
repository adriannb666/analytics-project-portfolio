import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeft, X } from 'lucide-react';
import { navConfig } from './navConfig';
import { cn } from '@/lib/utils';

export default function SideNav({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    navConfig.forEach((c, i) => { init[c.category] = i <= 1; });
    return init;
  });

  const toggleCategory = (cat) => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  const isActive = (item) => item.path === '/' ? location.pathname === '/' : location.pathname === item.path;

  const renderItem = (item) => {
    const active = isActive(item);
    const Icon = item.icon;
    const href = item.available ? item.path : `/placeholder?module=${item.id}`;
    return (
      <Link
        key={item.id}
        to={href}
        onClick={onCloseMobile}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex items-center gap-2.5 rounded-sm text-[13px] transition-colors mobile-tap',
          collapsed ? 'justify-center px-2 py-2' : 'px-2.5 py-1.5',
          active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          !item.available && !active && 'opacity-50 hover:opacity-90'
        )}
      >
        {active && <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />}
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span className="flex-1 truncate font-heading">{item.label}</span>}
        {!collapsed && !item.available && <span className="text-[9px] font-mono uppercase tracking-wider text-warning/80 shrink-0">SOON</span>}
      </Link>
    );
  };

  return (
    <>
      {mobileOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={onCloseMobile} />}
      <aside className={cn(
        'z-50 md:z-auto bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-[width,transform] duration-200 select-none',
        'fixed md:static inset-y-0 left-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        collapsed ? 'md:w-14 w-60' : 'w-60'
      )}>
        <div className={cn('h-12 shrink-0 border-b border-sidebar-border flex items-center', collapsed ? 'justify-center px-2' : 'px-3 justify-between')}>
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-sm bg-primary" />
              <span className="font-heading text-sm font-semibold text-foreground tracking-tight">知行</span>
            </div>
          )}
          <div className="flex items-center">
            <button onClick={onCloseMobile} className="md:hidden p-1.5 text-muted-foreground hover:text-foreground" aria-label="关闭">
              <X className="w-4 h-4" />
            </button>
            <button onClick={onToggleCollapse} className="hidden md:flex p-1.5 text-muted-foreground hover:text-foreground" aria-label="折叠侧栏">
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-4">
          {navConfig.map((cat) => {
            const isExpanded = expanded[cat.category] || collapsed;
            return (
              <div key={cat.category}>
                {!collapsed && (
                  <button
                    onClick={() => toggleCategory(cat.category)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    <span className="font-heading">{cat.category}</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                {isExpanded && (
                  <div className={cn('mt-1 space-y-0.5', collapsed && 'space-y-1')}>{cat.items.map(renderItem)}</div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-3 text-[10px] text-muted-foreground/60 font-mono leading-relaxed">
          {!collapsed ? (<><div>v0.2.0 · EARLY ACCESS</div><div>仅用于交易教育</div></>) : <div className="text-center">v0.2</div>}
        </div>
      </aside>
    </>
  );
}