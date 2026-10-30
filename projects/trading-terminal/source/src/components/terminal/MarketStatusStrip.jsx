import React from 'react';

export default function MarketStatusStrip({ items }) {
  return (
    <div className="flex items-stretch gap-0 overflow-x-auto border border-border rounded-sm bg-card/40 select-none">
      {items.map((it, i) => (
        <div key={it.name} className={`min-w-[150px] flex-1 px-3 py-2.5 ${i > 0 ? 'border-l border-border' : ''}`}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">{it.name}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-info" />
            <span className="text-xs font-mono text-info">{it.value || '未接入'}</span>
          </div>
          {it.note && <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{it.note}</div>}
          {it.updated && <div className="mt-1 text-[10px] font-mono text-muted-foreground/60">{it.updated}</div>}
        </div>
      ))}
    </div>
  );
}