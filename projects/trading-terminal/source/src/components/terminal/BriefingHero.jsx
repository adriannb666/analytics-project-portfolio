import React from 'react';

const TYPE_LABEL = {
  week_ahead: '本周前瞻',
  week_review: '上周回顾',
  daily: '每日简报',
};

export default function BriefingHero({ type, date, title, summary, bottomLine, tags, demo, onRead }) {
  return (
    <div className="border border-border rounded-sm bg-card/40 p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-wider text-primary border border-primary/30 px-1.5 py-0.5 rounded-sm">
          {TYPE_LABEL[type] || type}
        </span>
        {date && <span className="text-[11px] font-mono text-muted-foreground">{date}</span>}
        {demo && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-warning border border-warning/30 px-1.5 py-0.5 rounded-sm">
            演示数据
          </span>
        )}
      </div>
      <h3 className="mt-2 text-base font-heading font-semibold text-foreground leading-snug">{title}</h3>
      {summary && <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-prose">{summary}</p>}
      {bottomLine && (
        <div className="mt-3 border-t border-border pt-2 text-xs">
          <span className="font-mono uppercase tracking-wider text-muted-foreground/70 mr-1.5">BOTTOM LINE</span>
          <span className="text-foreground">{bottomLine}</span>
        </div>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">{t}</span>
          ))}
        </div>
      )}
      {onRead && (
        <button onClick={onRead} className="mt-3 text-xs text-primary hover:underline font-heading">阅读 →</button>
      )}
    </div>
  );
}