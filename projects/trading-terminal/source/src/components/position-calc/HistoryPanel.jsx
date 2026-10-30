import React from 'react';
import { History, Trash2, X, ArrowUpRight } from 'lucide-react';
import { fmt, fmtPct } from '@/lib/positionCalc';

function timeLabel(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return `今天 ${time}`;
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + time;
  } catch (e) {
    return '';
  }
}

export default function HistoryPanel({ items, onReload, onDelete, onClear }) {
  return (
    <div className="border border-border bg-card/30 rounded">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-heading text-foreground uppercase tracking-wider">
          <History className="w-4 h-4 text-primary" />计算历史
          <span className="text-muted-foreground normal-case font-body">({items.length})</span>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={onClear} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />清空
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-xs text-muted-foreground">暂无历史记录。完成计算并点击「复制结果」后会自动保存到这里。</div>
      ) : (
        <div className="divide-y divide-border max-h-[360px] overflow-y-auto no-scrollbar">
          {items.map((h) => {
            const isStop = h.template === 'stop';
            const dir = h.result.direction === 'long' ? '多' : '空';
            const stopLabel = isStop ? fmt(h.result.stop) : fmt(h.result.stopPrice);
            return (
              <div key={h.id} className="px-4 py-3 hover:bg-accent/40 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => onReload(h)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">{isStop ? '按止损' : '按仓位'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${h.result.direction === 'long' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>{dir}</span>
                      <span className="text-[11px] text-muted-foreground">{timeLabel(h.created_at)}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5 text-xs">
                      <div><span className="text-muted-foreground">开仓 </span><span className="font-heading">{fmt(h.result.entry)}</span></div>
                      <div><span className="text-muted-foreground">止损 </span><span className="font-heading">{stopLabel}</span></div>
                      <div><span className="text-muted-foreground">仓位 </span><span className="font-heading">{fmt(h.result.positionSize)}</span></div>
                      <div><span className="text-muted-foreground">风险 </span><span className="font-heading">{fmt(h.result.maxLoss)} {h.currency}</span></div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => onReload(h)} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-accent transition-colors" title="载入此记录">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => onDelete(h.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-accent transition-colors" title="删除">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}