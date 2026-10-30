import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

function Cell({ label, value, accent }) {
  return (
    <div className="px-3 py-2 border-b md:border-b-0 md:border-r border-border">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-heading mt-0.5 ${accent || 'text-foreground'}`}>{value}</div>
    </div>
  );
}

export default function PlanSummaryBar({ summary, hasPlan }) {
  if (!hasPlan) {
    return (
      <div className="border border-warning/40 bg-warning/5 rounded p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-heading text-foreground">请先完成交易计划，才能使用个性化交易前检查。</div>
            <div className="text-xs text-muted-foreground mt-1">当前未关联完整交易计划，检查结果仅供参考。</div>
          </div>
        </div>
        <Button size="sm" asChild><Link to="/plan">前往交易计划</Link></Button>
      </div>
    );
  }
  const s = summary;
  return (
    <div className="border border-border rounded bg-card/40 overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <Cell label="交易计划" value={s.planName} />
        <Cell label="版本" value={s.version} />
        <Cell label="单笔最大风险" value={s.maxRisk != null ? s.maxRisk + '%' : '—'} />
        <Cell label="最低盈亏比" value={s.minRR != null ? s.minRR + ':1' : '—'} />
        <Cell label="最大杠杆" value={s.leverage} />
        <Cell label="每日最大交易" value={s.maxDaily != null ? s.maxDaily + ' 笔' : '—'} />
        <Cell label="计划状态" value={s.status} />
        <Cell label="高风险冲突" value={s.highFlags} accent={s.highFlags > 0 ? 'text-destructive' : ''} />
      </div>
    </div>
  );
}