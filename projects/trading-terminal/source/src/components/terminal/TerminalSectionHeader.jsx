import React from 'react';
import { cn } from '@/lib/utils';

const TONE = {
  demo: 'text-warning border-warning/30',
  live: 'text-success border-success/30',
  pending: 'text-info border-info/30',
};

export default function TerminalSectionHeader({ title, english, date, statusLabel, statusTone, action }) {
  const toneCls = TONE[statusTone] || 'text-muted-foreground border-border';
  return (
    <div className="flex items-end justify-between gap-3 border-b border-border pb-2 mb-3">
      <div className="min-w-0">
        {english && <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">{english}</div>}
        <h2 className="text-base font-heading font-semibold text-foreground tracking-tight truncate">{title}</h2>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {date && <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">{date}</span>}
        {statusLabel && (
          <span className={cn('text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border rounded-sm', toneCls)}>
            {statusLabel}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}