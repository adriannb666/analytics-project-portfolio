import React from 'react';
import { fmt, fmtPct } from '@/lib/positionCalc';

export default function DcaBreakdown({ dca, currency }) {
  if (!dca) return null;
  return (
    <div className="mt-2 border border-border rounded p-3 bg-card/40">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">DCA 分批明细</div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground">
          <span className="col-span-2">批次</span>
          <span className="col-span-3">价格</span>
          <span className="col-span-2">权重</span>
          <span className="col-span-5">仓位 / 名义</span>
        </div>
        {dca.batches.map((b, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 text-xs font-mono items-center">
            <span className="col-span-2 text-muted-foreground">{i + 1}</span>
            <span className="col-span-3">{fmt(b.price)}</span>
            <span className="col-span-2 text-muted-foreground">{fmtPct(b.weight * 100)}</span>
            <span className="col-span-5 text-foreground">{fmt(b.position)} / {fmt(b.notional)} {currency}</span>
          </div>
        ))}
        <div className="grid grid-cols-12 gap-2 text-xs font-mono items-center pt-1.5 border-t border-border">
          <span className="col-span-2 text-muted-foreground">平均</span>
          <span className="col-span-3 text-primary">{fmt(dca.avgPrice)}</span>
          <span className="col-span-2"></span>
          <span className="col-span-5"></span>
        </div>
      </div>
    </div>
  );
}