import React from 'react';
import { DIR_LABEL, DIR_BADGE, STOP_LABEL, STOP_BADGE, fmtNum, fmtPct, fmtPrice } from '@/lib/dexMonitorFormat';

const COLS = [
  { k: 'symbol', label: '标的' },
  { k: 'direction', label: '方向' },
  { k: 'quantity', label: '数量' },
  { k: 'entry_price', label: '开仓均价' },
  { k: 'mark_price', label: '标记价' },
  { k: 'notional_value', label: '名义价值' },
  { k: 'leverage', label: '杠杆' },
  { k: 'margin_mode', label: '保证金' },
  { k: 'unrealized_pnl', label: '未实现盈亏' },
  { k: 'unrealized_pnl_percent', label: '盈亏%' },
  { k: 'liquidation_price', label: '清算价' },
  { k: 'liquidation_distance_percent', label: '清算距离' },
  { k: 'detected_stop_price', label: '预计止损' },
  { k: 'stop_coverage_status', label: '止损覆盖' },
  { k: 'account_equity_percent', label: '占权益' },
  { k: 'compliance_status', label: '计划符合' },
];

const COMPLIANCE_BADGE = {
  compliant: 'text-success',
  warning: 'text-warning',
  violation: 'text-destructive',
};
const COMPLIANCE_LABEL = { compliant: '符合', warning: '提醒', violation: '不符' };

function liqColor(d) {
  if (d == null || !Number.isFinite(d)) return '';
  if (d < 5) return 'text-destructive';
  if (d < 10) return 'text-orange-400';
  if (d < 20) return 'text-warning';
  return 'text-muted-foreground';
}

export default function PositionsTable({ positions, stopReadable }) {
  if (!positions || positions.length === 0) {
    return <div className="border border-border rounded p-6 text-center text-xs text-muted-foreground">当前账户没有未平仓持仓。</div>;
  }
  return (
    <div className="border border-border rounded bg-card/20 overflow-hidden">
      <div className="hidden lg:block overflow-x-auto no-scrollbar">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              {COLS.map((c) => <th key={c.k} className="text-left font-medium px-2 py-1.5 whitespace-nowrap">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr key={i} className="border-b border-border/50 last:border-b-0">
                {COLS.map((c) => {
                  const v = p[c.k];
                  let content = v;
                  if (c.k === 'direction') content = <span className={DIR_BADGE[v]}>{DIR_LABEL[v]}</span>;
                  else if (c.k === 'leverage') content = fmtNum(v, 1) + (Number.isFinite(v) ? '×' : '');
                  else if (['entry_price', 'mark_price', 'detected_stop_price', 'liquidation_price'].includes(c.k)) content = fmtPrice(v);
                  else if (['quantity', 'notional_value'].includes(c.k)) content = fmtNum(v);
                  else if (c.k === 'unrealized_pnl') content = <span className={Number.isFinite(v) && v >= 0 ? 'text-success' : 'text-destructive'}>{fmtNum(v)}</span>;
                  else if (c.k === 'unrealized_pnl_percent' || c.k === 'account_equity_percent') content = fmtPct(v);
                  else if (c.k === 'liquidation_distance_percent') content = <span className={liqColor(v)}>{fmtPct(v)}</span>;
                  else if (c.k === 'stop_coverage_status') content = <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${STOP_BADGE[v] || ''}`}>{STOP_LABEL[v]}</span>;
                  else if (c.k === 'margin_mode') content = v || '—';
                  else if (c.k === 'compliance_status') content = <span className={COMPLIANCE_BADGE[v]}>{COMPLIANCE_LABEL[v]}</span>;
                  return <td key={c.k} className="px-2 py-1.5 whitespace-nowrap font-mono">{content}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile vertical list */}
      <div className="lg:hidden divide-y divide-border/50">
        {positions.map((p, i) => (
          <div key={i} className="p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-heading">{p.symbol}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${DIR_BADGE[p.direction]}`}>{DIR_LABEL[p.direction]}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${STOP_BADGE[p.stop_coverage_status] || ''}`}>{STOP_LABEL[p.stop_coverage_status]}</span>
                <span className={`text-[10px] ${COMPLIANCE_BADGE[p.compliance_status]}`}>{COMPLIANCE_LABEL[p.compliance_status]}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">杠杆 {fmtNum(p.leverage, 1)}×</div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <div><span className="text-muted-foreground">数量 </span><span className="font-mono">{fmtNum(p.quantity)}</span></div>
              <div><span className="text-muted-foreground">开仓 </span><span className="font-mono">{fmtPrice(p.entry_price)}</span></div>
              <div><span className="text-muted-foreground">标记 </span><span className="font-mono">{fmtPrice(p.mark_price)}</span></div>
              <div><span className="text-muted-foreground">名义 </span><span className="font-mono">{fmtNum(p.notional_value)}</span></div>
              <div><span className="text-muted-foreground">盈亏 </span><span className={`font-mono ${Number.isFinite(p.unrealized_pnl) && p.unrealized_pnl >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtNum(p.unrealized_pnl)} ({fmtPct(p.unrealized_pnl_percent)})</span></div>
              <div><span className="text-muted-foreground">占权益 </span><span className="font-mono">{fmtPct(p.account_equity_percent)}</span></div>
              <div><span className="text-muted-foreground">清算价 </span><span className="font-mono">{fmtPrice(p.liquidation_price)}</span></div>
              <div><span className="text-muted-foreground">清算距离 </span><span className={`font-mono ${liqColor(p.liquidation_distance_percent)}`}>{fmtPct(p.liquidation_distance_percent)}</span></div>
              <div><span className="text-muted-foreground">止损 </span><span className="font-mono">{fmtPrice(p.detected_stop_price)}</span></div>
            </div>
          </div>
        ))}
      </div>

      {!stopReadable && (
        <div className="px-3 py-1.5 text-[10px] text-info border-t border-border bg-info/5">
          Lighter 公开接口无法读取止损订单，止损覆盖状态显示为「无法确认」。
        </div>
      )}
    </div>
  );
}