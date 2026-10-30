import React from 'react';
import { GROUP_META } from '@/lib/preTradeEngine';

const STATUS_STYLE = {
  pass: 'text-success border-success/40 bg-success/10',
  warn: 'text-warning border-warning/40 bg-warning/10',
  fail: 'text-destructive border-destructive/40 bg-destructive/10',
  pending: 'text-muted-foreground border-border',
};
const STATUS_LABEL = { pass: '通过', warn: '提醒', fail: '不通过', pending: '待确认' };

function TriState({ value, onChange }) {
  const opts = [{ v: 'pass', l: '通过' }, { v: 'warn', l: '提醒' }, { v: 'fail', l: '不通过' }];
  return (
    <div className="flex gap-1 shrink-0">
      {opts.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(value === o.v ? '' : o.v)} className={`text-[11px] px-2 py-0.5 rounded-sm border ${value === o.v ? STATUS_STYLE[o.v] : 'border-border text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
      ))}
    </div>
  );
}

export default function ChecklistPanel({ items, manual, onManual }) {
  const groups = ['A', 'B', 'C', 'D', 'E'].map((g) => ({ g, name: GROUP_META[g].name, weight: GROUP_META[g].weight, items: items.filter((i) => i.group === g) }));
  return (
    <div className="space-y-4">
      <div className="text-xs font-heading text-foreground uppercase tracking-wider">第二部分 · 动态检查清单</div>
      {groups.map((grp) => (
        <div key={grp.g}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-heading text-foreground">{grp.g}. {grp.name}</span>
            <span className="text-[10px] text-muted-foreground">权重 {grp.weight}</span>
          </div>
          <div className="space-y-0">
            {grp.items.map((it) => {
              const st = it.status;
              return (
                <div key={it.key} className="flex items-start justify-between gap-3 py-1.5 border-b border-border/50 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-foreground">{it.label}</div>
                    {it.detail && <div className="text-[10px] text-muted-foreground mt-0.5">{it.detail}</div>}
                  </div>
                  {it.mode === 'manual' ? (
                    <TriState value={manual[it.key] || ''} onChange={(v) => onManual(it.key, v)} />
                  ) : (
                    <span className={`text-[11px] px-2 py-0.5 rounded-sm border shrink-0 ${STATUS_STYLE[st]}`}>{STATUS_LABEL[st]}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}