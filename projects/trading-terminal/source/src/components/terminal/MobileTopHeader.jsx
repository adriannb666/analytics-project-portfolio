import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const TITLES = {
  '/plan': '交易计划',
  '/position-calculator': '仓位计算器',
  '/placeholder': '模块预览',
};

export default function MobileTopHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  if (path === '/') return null;
  const title = TITLES[path] || '知行交易终端';
  return (
    <div className="md:hidden shrink-0 h-11 border-b border-border bg-sidebar flex items-center gap-2 px-2 select-none">
      <button
        onClick={() => navigate(-1)}
        className="mobile-tap inline-flex items-center gap-1 px-2 h-8 rounded text-sm text-foreground hover:bg-accent"
        aria-label="返回"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-xs">返回</span>
      </button>
      <div className="flex-1 text-center text-sm font-heading text-foreground truncate">{title}</div>
      <div className="w-14" />
    </div>
  );
}