import React from 'react';
import { cn } from '@/lib/utils';

const CAT_TONE = {
  '宏观': 'text-info',
  '财报': 'text-warning',
  '加密': 'text-primary',
  '监管': 'text-destructive',
  '代币解锁': 'text-warning',
  '央行': 'text-info',
  '政策': 'text-muted-foreground',
};

export default function KeyEventRow({ date, time, category, event, market, importance, status }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b border-border/50 text-xs last:border-b-0 hover:bg-accent/40">
      <div className="col-span-3 sm:col-span-2 font-mono text-muted-foreground">
        {date}{time && <span className="block text-[10px] text-muted-foreground/70">{time}</span>}
      </div>
      <div className="col-span-2 sm:col-span-2">
        <span className={cn('text-[10px] font-mono uppercase tracking-wider', CAT_TONE[category] || 'text-muted-foreground')}>{category}</span>
      </div>
      <div className="col-span-4 sm:col-span-5 text-foreground truncate">{event}</div>
      <div className="col-span-2 sm:col-span-2 text-muted-foreground font-mono text-[11px] truncate">{market}</div>
      <div className="col-span-1 text-right">
        <span className="font-mono text-[11px] text-warning">{importance}</span>
      </div>
    </div>
  );
}