import React from 'react';

export default function EmptyDataState({ title, note, children }) {
  return (
    <div className="border border-dashed border-border rounded-sm bg-card/40 px-4 py-5">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-info" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-info">等待数据源</span>
      </div>
      {title && <div className="mt-2 text-sm text-foreground">{title}</div>}
      {note && <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-prose">{note}</p>}
      {children}
    </div>
  );
}