import React from 'react';
import { SEVERITY, PLATFORM_LABEL, fmtTime } from '@/lib/dexMonitorFormat';

export default function RiskAlertsList({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return <div className="border border-border rounded p-6 text-center text-xs text-muted-foreground">当前没有活跃风险提醒。</div>;
  }
  return (
    <div className="border border-border rounded bg-card/20 divide-y divide-border/50">
      {alerts.map((a) => {
        const sev = SEVERITY[a.severity] || SEVERITY.info;
        return (
          <div key={a.id} className="p-2.5 flex items-start gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border shrink-0 mt-0.5 ${sev.badge}`}>{sev.label}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-heading text-foreground">{a.title}</span>
                <span className="text-[10px] text-muted-foreground">{PLATFORM_LABEL[a.platform]}</span>
                {a.symbol && <span className="text-[10px] text-muted-foreground font-mono">· {a.symbol}</span>}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{a.description}</div>
              {(a.current_value || a.limit_value) && (
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {a.current_value && <span>当前 {a.current_value}</span>}
                  {a.current_value && a.limit_value && <span className="mx-1 text-border">|</span>}
                  {a.limit_value && <span>限制 {a.limit_value}</span>}
                </div>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{fmtTime(a.last_detected_at)}</div>
          </div>
        );
      })}
    </div>
  );
}