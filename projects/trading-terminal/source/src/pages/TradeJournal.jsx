import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
import NewTradeDialog from '@/components/journal/NewTradeDialog';
import JournalDashboard from '@/components/journal/JournalDashboard';
import { PLATFORM_LABEL, fmtPrice } from '@/lib/dexMonitorFormat';

const STATUS_META = {
  draft: { label: '草稿', cls: 'text-muted-foreground border-border' },
  planned: { label: '待执行', cls: 'text-info border-info/40 bg-info/10' },
  open: { label: '持仓中', cls: 'text-primary border-primary/40 bg-primary/10' },
  completed: { label: '已完成', cls: 'text-success border-success/40 bg-success/10' },
  closed: { label: '已平仓', cls: 'text-success border-success/40 bg-success/10' },
  cancelled: { label: '已取消', cls: 'text-muted-foreground border-border' },
};
const SOURCE_META = {
  manual: { label: '手动', cls: 'border-info/40 bg-info/10 text-info' },
  position_monitor: { label: '持仓监控', cls: 'border-primary/40 bg-primary/10 text-primary' },
  exchange_fill: { label: '成交同步', cls: 'border-primary/40 bg-primary/10 text-primary' },
  automatic: { label: '自动', cls: 'border-primary/40 bg-primary/10 text-primary' },
};

function fmtNum(n, suffix = '') {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 }) + suffix;
}
function fmtDateShort(t) {
  if (!t) return '—';
  const d = new Date(t);
  if (isNaN(d.getTime())) return '—';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}-${day} ${hh}:${mm}`;
}

function startOfWeek(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }

export default function TradeJournal() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dirFilter, setDirFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const { data: journals = [], isLoading } = useQuery({
    queryKey: ['trade-journals'],
    queryFn: () => base44.entities.TradeJournal.list('-updated_date', 200),
  });

  const filtered = useMemo(() => {
    return journals.filter((j) => {
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (dirFilter !== 'all' && j.direction !== dirFilter) return false;
      if (sourceFilter !== 'all' && (j.source || 'manual') !== sourceFilter) return false;
      return true;
    });
  }, [journals, statusFilter, dirFilter, sourceFilter]);

  const stats = useMemo(() => {
    const weekStart = startOfWeek(new Date()).getTime();
    const week = journals.filter((j) => j.status === 'completed' && j.closed_at && new Date(j.closed_at).getTime() >= weekStart);
    const wins = week.filter((j) => (j.pnl_amount || 0) > 0).length;
    const totalPnl = week.reduce((s, j) => s + (j.pnl_amount || 0), 0);
    return { weekCount: week.length, wins, winRate: week.length > 0 ? (wins / week.length) * 100 : 0, totalPnl };
  }, [journals]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />交易日志</h1>
          <p className="mt-1 text-sm text-muted-foreground">记录、同步并复盘你的交易执行过程。</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1.5" />新建交易</Button>
      </div>

      <NewTradeDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <JournalDashboard journals={journals} />

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatBox label="本周交易" value={stats.weekCount} />
        <StatBox label="盈利笔数" value={stats.wins} className="text-success" />
        <StatBox label="胜率" value={stats.weekCount > 0 ? stats.winRate.toFixed(0) + '%' : '—'} />
        <StatBox label="本周盈亏" value={fmtNum(stats.totalPnl)} className={stats.totalPnl >= 0 ? 'text-success' : 'text-destructive'} />
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-2 items-center">
        <FilterSeg label="状态" value={statusFilter} onChange={setStatusFilter} options={[{ v: 'all', l: '全部' }, { v: 'planned', l: '待执行' }, { v: 'open', l: '持仓中' }, { v: 'completed', l: '已完成' }, { v: 'cancelled', l: '已取消' }]} />
        <FilterSeg label="方向" value={dirFilter} onChange={setDirFilter} options={[{ v: 'all', l: '全部' }, { v: 'long', l: '做多' }, { v: 'short', l: '做空' }]} />
        <FilterSeg label="来源" value={sourceFilter} onChange={setSourceFilter} options={[{ v: 'all', l: '全部' }, { v: 'manual', l: '手动' }, { v: 'position_monitor', l: '持仓监控' }, { v: 'exchange_fill', l: '成交同步' }]} />
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded py-12 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">暂无交易记录</div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1.5" />新建交易</Button>
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-muted/30 text-[10px] text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">时间</div>
            <div className="col-span-2">标的</div>
            <div className="col-span-1">方向</div>
            <div className="col-span-2">平台 · 来源</div>
            <div className="col-span-2">入场价格</div>
            <div className="col-span-2 text-right">PnL</div>
            <div className="col-span-1">状态</div>
          </div>
          {filtered.map((j) => {
            const sm = STATUS_META[j.status] || STATUS_META.draft;
            const src = j.source || 'manual';
            const srcM = SOURCE_META[src];
            const isAuto = src === 'position_monitor' || src === 'exchange_fill' || src === 'automatic';
            const timeKey = isAuto ? j.fill_time : (j.opened_at || j.created_date);
            const entryPx = isAuto ? j.fill_price : (j.actual_entry_price || j.planned_entry_price);
            return (
              <Link key={j.id} to={`/journal/${j.id}`} className="grid grid-cols-2 md:grid-cols-12 gap-2 px-3 py-2.5 border-t border-border hover:bg-accent/40 transition-colors items-center text-xs">
                <div className="col-span-2 md:col-span-2 text-muted-foreground">
                  <div>{fmtDateShort(timeKey)}</div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="font-heading text-foreground">{j.symbol}</div>
                </div>
                <div className="col-span-1">
                  <span className={j.direction === 'long' ? 'text-success' : 'text-destructive'}>{j.direction === 'long' ? '多' : '空'}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${srcM.cls}`}>{srcM.label}</span>
                  <span className="text-[10px] text-muted-foreground">{j.platform ? (PLATFORM_LABEL[j.platform] || j.platform) : '—'}</span>
                </div>
                <div className="col-span-2 text-muted-foreground font-mono">{fmtPrice(entryPx)}</div>
                <div className="col-span-2 md:text-right">
                  {j.pnl_amount != null ? (
                    <span className={j.pnl_amount >= 0 ? 'text-success' : 'text-destructive'}>{j.pnl_amount >= 0 ? '+' : ''}{fmtNum(j.pnl_amount)}</span>
                  ) : <span className="text-muted-foreground">—</span>}
                </div>
                <div className="col-span-1"><span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${sm.cls}`}>{sm.label}</span></div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, className }) {
  return (
    <div className="border border-border rounded bg-card/40 px-3 py-2">
      <div className={`text-lg font-heading ${className || 'text-foreground'}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function FilterSeg({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex border border-border rounded-sm overflow-hidden h-7">
        {options.map((o) => (
          <button key={o.v} onClick={() => onChange(o.v)} className={`text-[11px] px-2 ${value === o.v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}