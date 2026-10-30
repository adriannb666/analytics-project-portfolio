import React from 'react';
import { TOTAL_STEPS, PLAN_STEPS } from '@/components/terminal/navConfig';

export default function PlanStatusHeader({ plan, completeness, flagsCount }) {
  const stepIndex = PLAN_STEPS.findIndex((s) => s.code === plan?.current_step);
  const stepNum = stepIndex >= 0 ? stepIndex + 1 : 0;
  const comp = completeness ?? 0;
  const flags = flagsCount ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="border border-border bg-card rounded p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">计划进度</div>
        <div className="mt-1 font-mono text-lg text-foreground">
          第 <span className="text-primary">{stepNum}</span> 步
          <span className="text-muted-foreground text-sm"> / 共 {TOTAL_STEPS} 步</span>
        </div>
      </div>
      <div className="border border-border bg-card rounded p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">计划完整度</span>
          <span className="font-mono text-sm text-primary">{comp}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-muted rounded overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${comp}%` }} />
        </div>
      </div>
      <div className="border border-border bg-card rounded p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">待解决规则冲突</div>
        <div className="mt-1 font-mono text-lg text-foreground">{flags}</div>
      </div>
    </div>
  );
}