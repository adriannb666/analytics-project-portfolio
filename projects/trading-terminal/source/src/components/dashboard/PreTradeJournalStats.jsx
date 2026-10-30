import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ListChecks, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SoonLabel from '@/components/terminal/SoonLabel';

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d) { const x = startOfDay(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }

function Stat({ label, value, className }) {
  return (
    <div>
      <div className={`text-lg font-heading ${className || 'text-foreground'}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

export default function PreTradeJournalStats() {
  const { data } = useQuery({
    queryKey: ['pretrade-journal-stats'],
    queryFn: async () => {
      const [checks, journals] = await Promise.all([
        base44.entities.PreTradeCheck.list('-created_date', 100),
        base44.entities.TradeJournal.list('-updated_date', 200),
      ]);
      const todayStart = startOfDay(new Date()).getTime();
      const weekStart = startOfWeek(new Date()).getTime();
      const todayChecks = checks.filter((c) => new Date(c.created_date).getTime() >= todayStart);
      const compliant = todayChecks.filter((c) => c.compliance_status === 'compliant').length;
      const warning = todayChecks.filter((c) => c.compliance_status === 'warning').length;
      const violation = todayChecks.filter((c) => c.compliance_status === 'violation').length;
      const drafts = journals.filter((j) => j.status === 'draft' || j.status === 'planned').length;
      const open = journals.filter((j) => j.status === 'open').length;
      const weekCompleted = journals.filter((j) => j.status === 'completed' && j.closed_at && new Date(j.closed_at).getTime() >= weekStart).length;
      return { todayCount: todayChecks.length, compliant, warning, violation, drafts, open, weekCompleted };
    },
    staleTime: 30000,
  });
  const s = data || { todayCount: 0, compliant: 0, warning: 0, violation: 0, drafts: 0, open: 0, weekCompleted: 0 };
  return (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="border border-border rounded-sm bg-card/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading text-foreground flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 text-primary" />今日交易检查</span>
            <Link to="/pretrade" className="text-xs text-primary hover:underline inline-flex items-center gap-1">开始检查 <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="已检查" value={s.todayCount} />
            <Stat label="符合" value={s.compliant} className="text-success" />
            <Stat label="提醒" value={s.warning} className="text-warning" />
            <Stat label="违规" value={s.violation} className="text-destructive" />
          </div>
        </div>
        <div className="border border-border rounded-sm bg-card/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading text-foreground flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-primary" />交易日志</span>
            <Link to="/journal" className="text-xs text-primary hover:underline inline-flex items-center gap-1">查看日志 <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="草稿/计划" value={s.drafts} />
            <Stat label="持仓中" value={s.open} />
            <Stat label="本周已完成" value={s.weekCompleted} className="text-success" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['风险监控', '复盘中心'].map((label) => (
          <div key={label} className="border border-border/60 rounded-sm bg-card/20 px-3 py-2 flex items-center justify-between opacity-60">
            <span className="text-xs text-muted-foreground">{label}</span>
            <SoonLabel />
          </div>
        ))}
      </div>
    </div>
  );
}