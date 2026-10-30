import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, ReferenceLine, Cell,
} from 'recharts';
import { BarChart3, TrendingDown, TrendingUp, Activity, Gauge } from 'lucide-react';
import { getRealizedTrades, computeOverview, groupByMonth, cumulativeCurve, splitBySource } from '@/lib/journalStats';

const COL = {
  gold: '#e8a23a',
  green: '#2dbd6e',
  red: '#e23b3b',
  muted: '#5a6473',
  grid: 'rgba(255,255,255,0.06)',
};

function fmt(n, d = 2) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) === Infinity) return n > 0 ? '∞' : '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: d });
}
function fmtSigned(n, d = 2) {
  if (n == null || !Number.isFinite(n)) return '—';
  return (n >= 0 ? '+' : '') + fmt(n, d);
}
function pnlClass(n) {
  if (n == null || !Number.isFinite(n)) return 'text-muted-foreground';
  return n >= 0 ? 'text-success' : 'text-destructive';
}

function MetricCard({ label, value, sub, icon: Icon, valueClass }) {
  return (
    <div className="border border-border rounded bg-card/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="w-3 h-3" />}{label}
      </div>
      <div className={`text-lg font-heading ${valueClass || 'text-foreground'}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function SourceCard({ title, overview }) {
  return (
    <div className="border border-border rounded bg-card/30 p-3">
      <div className="text-[11px] font-heading text-foreground mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <Row label="交易笔数" value={overview.n} />
        <Row label="胜率" value={overview.n > 0 ? overview.winRate.toFixed(0) + '%' : '—'} />
        <Row label="总盈亏" value={fmtSigned(overview.totalPnl)} cls={pnlClass(overview.totalPnl)} />
        <Row label="盈亏比" value={Number.isFinite(overview.profitFactor) ? overview.profitFactor.toFixed(2) : '—'} />
        <Row label="平均盈亏" value={fmtSigned(overview.avgPnl)} cls={pnlClass(overview.avgPnl)} />
        <Row label="最大回撤" value={fmt(overview.maxDrawdownAbs)} cls="text-destructive" />
      </div>
    </div>
  );
}

function Row({ label, value, cls }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-0.5">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className={`font-heading ${cls || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="border border-border rounded bg-popover px-2.5 py-1.5 text-[11px]">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-3">
          <span style={{ color: p.color || p.fill }}>{p.name}</span>
          <span className="font-heading text-foreground">{fmtSigned(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function JournalDashboard({ journals }) {
  const trades = useMemo(() => getRealizedTrades(journals), [journals]);
  const overview = useMemo(() => computeOverview(trades), [trades]);
  const monthly = useMemo(() => groupByMonth(trades), [trades]);
  const curve = useMemo(() => cumulativeCurve(trades), [trades]);
  const sources = useMemo(() => splitBySource(trades), [trades]);

  const hasData = trades.length > 0;

  return (
    <div className="border border-border rounded bg-background/40 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-heading font-semibold text-foreground">交易绩效仪表盘</h2>
        <span className="text-[10px] text-muted-foreground">· 基于 {trades.length} 笔已实现盈亏交易</span>
      </div>

      {!hasData ? (
        <div className="border border-dashed border-border rounded py-10 text-center text-sm text-muted-foreground">
          暂无已实现盈亏的交易记录，完成交易并填写盈亏后将自动统计。
        </div>
      ) : (
        <>
          {/* 核心指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <MetricCard label="总盈亏" value={fmtSigned(overview.totalPnl)} icon={TrendingUp} valueClass={pnlClass(overview.totalPnl)} />
            <MetricCard label="胜率" value={overview.winRate.toFixed(1) + '%'} sub={`${overview.winners}胜 / ${overview.losers}负 / 共${overview.n}笔`} icon={Activity} />
            <MetricCard label="盈亏比" value={Number.isFinite(overview.profitFactor) ? overview.profitFactor.toFixed(2) : '—'} sub={`均盈 ${fmt(overview.avgWin)} / 均亏 ${fmt(overview.avgLoss)}`} icon={Gauge} />
            <MetricCard label="期望收益" value={fmtSigned(overview.expectancy)} sub="每笔平均盈亏" valueClass={pnlClass(overview.expectancy)} icon={TrendingUp} />
            <MetricCard label="最大回撤" value={fmt(overview.maxDrawdownAbs)} sub={overview.maxDrawdownPct > 0 ? `占峰值 ${overview.maxDrawdownPct.toFixed(1)}%` : '—'} icon={TrendingDown} valueClass="text-destructive" />
            <MetricCard label="夏普比率" value={overview.sharpe.toFixed(2)} sub="每笔均值 / 标准差" icon={Activity} />
            <MetricCard label="最佳交易" value={fmtSigned(overview.best)} valueClass="text-success" />
            <MetricCard label="最差交易" value={fmtSigned(overview.worst)} valueClass="text-destructive" />
          </div>

          {/* 来源对比 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SourceCard title="手动记录" overview={sources.manual} />
            <SourceCard title="自动同步" overview={sources.auto} />
          </div>

          {/* 累计盈亏曲线 */}
          <div>
            <div className="text-[11px] text-muted-foreground mb-1.5">累计盈亏曲线</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COL.gold} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={COL.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={COL.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: COL.muted }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: COL.muted }} width={48} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke={COL.muted} strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="cum" name="累计盈亏" stroke={COL.gold} strokeWidth={1.5} fill="url(#cumGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 月度盈亏 */}
          <div>
            <div className="text-[11px] text-muted-foreground mb-1.5">月度盈亏</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={COL.grid} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: COL.muted }} />
                  <YAxis tick={{ fontSize: 10, fill: COL.muted }} width={48} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const m = monthly.find((x) => x.month === label) || {};
                      return (
                        <div className="border border-border rounded bg-popover px-2.5 py-1.5 text-[11px]">
                          <div className="text-muted-foreground mb-1">{label}</div>
                          <div className="flex justify-between gap-3"><span className="text-muted-foreground">月度盈亏</span><span className={`font-heading ${m.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtSigned(m.pnl)}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-muted-foreground">交易笔数</span><span className="font-heading text-foreground">{m.count}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-muted-foreground">胜率</span><span className="font-heading text-foreground">{m.count ? (((m.winners || 0) / m.count) * 100).toFixed(0) + '%' : '—'}</span></div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke={COL.muted} />
                  <Bar dataKey="pnl" name="月度盈亏" radius={[2, 2, 0, 0]}>
                    {monthly.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? COL.green : COL.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 月度明细表 */}
          <div className="border border-border rounded overflow-hidden">
            <div className="grid grid-cols-5 px-3 py-1.5 bg-muted/30 text-[10px] text-muted-foreground uppercase tracking-wider">
              <div>月份</div><div className="text-right">笔数</div><div className="text-right">胜率</div><div className="text-right">盈亏</div><div className="text-right">累计</div>
            </div>
            {monthly.map((m, i) => {
              let running = 0;
              for (let k = 0; k <= i; k++) running += monthly[k].pnl;
              return (
                <div key={m.month} className="grid grid-cols-5 px-3 py-1.5 border-t border-border text-xs items-center">
                  <div className="font-mono text-foreground">{m.month}</div>
                  <div className="text-right text-muted-foreground">{m.count}</div>
                  <div className="text-right text-muted-foreground">{m.count ? ((m.winners / m.count) * 100).toFixed(0) + '%' : '—'}</div>
                  <div className={`text-right font-heading ${m.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtSigned(m.pnl)}</div>
                  <div className={`text-right font-heading ${running >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtSigned(running)}</div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground pt-1">
            <span>· 最大回撤基于累计盈亏峰值计算</span>
            <span>· 夏普比率为每笔交易的均值/标准差，未年化</span>
            <span>· 盈亏比 = 总盈利 / 总亏损</span>
          </div>
        </>
      )}
    </div>
  );
}