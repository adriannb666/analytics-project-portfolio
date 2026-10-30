import React from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertTriangle, Info } from 'lucide-react';

export default function PlanRiskBanner({ planRisk, planLoading, currentRisk }) {
  if (planLoading) {
    return <div className="text-xs text-muted-foreground/60">正在读取交易计划风险参数…</div>;
  }
  if (planRisk == null) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <Info className="w-3.5 h-3.5 shrink-0" />尚未读取到交易计划风险参数，请手动输入。
      </div>
    );
  }
  const cur = Number(currentRisk);
  const hasCur = Number.isFinite(cur) && cur > 0;
  let tone = 'ok';
  let msg = `已使用你的交易计划默认单笔风险：${planRisk}%`;
  if (hasCur) {
    if (cur > planRisk) { tone = 'warn'; msg = `当前风险高于你的交易计划设定值 ${planRisk}%。`; }
    else { tone = 'ok'; msg = `当前风险符合你的交易计划。`; }
  }
  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs rounded px-2 py-1.5 border',
      tone === 'warn' ? 'text-warning border-warning/40 bg-warning/5' : 'text-success border-success/40 bg-success/5'
    )}>
      {tone === 'warn' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
      {msg}
    </div>
  );
}