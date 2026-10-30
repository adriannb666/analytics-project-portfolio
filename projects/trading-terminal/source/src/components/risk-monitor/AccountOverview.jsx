import React from 'react';
import { RISK_STATUS, fmtNum, fmtPct, fmtTime } from '@/lib/dexMonitorFormat';

function Metric({ label, value, accent }) {
  return (
    <div className="px-3 py-2 border-r border-border last:border-r-0">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-heading font-mono ${accent || 'text-foreground'}`}>{value}</div>
    </div>
  );
}

export default function AccountOverview({ data, connection }) {
  const ov = data?.overview || {};
  const st = RISK_STATUS[data?.risk_status] || RISK_STATUS.normal;
  const planLinked = data?.plan_linked;
  return (
    <div className="border border-border rounded bg-card/30">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
          <span className="text-xs font-heading">账户总览</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${st.badge}`}>{st.label}</span>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">最后同步 {fmtTime(ov.updated_at || connection?.last_synced_at)}</div>
      </div>

      {!planLinked && (
        <div className="px-3 py-1.5 text-[11px] text-warning border-b border-border bg-warning/5">
          当前账户尚未关联交易计划，无法进行个性化规则检查。
        </div>
      )}

      <div className="flex flex-wrap">
        <Metric label="账户权益" value={fmtNum(ov.account_equity)} />
        <Metric label="可用余额" value={fmtNum(ov.available_balance)} />
        <Metric label="保证金占用" value={fmtNum(ov.margin_used)} />
        <Metric label="未实现盈亏" value={fmtNum(ov.unrealized_pnl)} accent={Number.isFinite(ov.unrealized_pnl) ? (ov.unrealized_pnl >= 0 ? 'text-success' : 'text-destructive') : ''} />
        <Metric label="持仓数量" value={ov.positions_count ?? 0} />
        <Metric label="总名义敞口" value={fmtNum(ov.gross_notional)} />
        <Metric label="多头敞口" value={fmtNum(ov.long_notional)} accent="text-success" />
        <Metric label="空头敞口" value={fmtNum(ov.short_notional)} accent="text-destructive" />
        <Metric label="有效杠杆" value={Number.isFinite(ov.effective_leverage) ? ov.effective_leverage.toFixed(2) + '×' : '—'} />
        <Metric label="最大单一仓位占比" value={fmtPct(ov.largest_position_percent)} />
        <Metric label="当前回撤" value={data?.drawdown_percent != null ? fmtPct(data.drawdown_percent) : '暂无法计算'} />
      </div>
    </div>
  );
}