import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEV_CFG = {
  high: { label: '高', cls: 'text-destructive border-destructive/40 bg-destructive/10', dot: 'bg-destructive' },
  medium: { label: '中', cls: 'text-warning border-warning/40 bg-warning/10', dot: 'bg-warning' },
  low: { label: '低', cls: 'text-muted-foreground border-border bg-muted', dot: 'bg-muted-foreground' },
};
const STATUS_CFG = {
  open: { label: '待处理', cls: 'text-warning' },
  accepted: { label: '已保留', cls: 'text-muted-foreground' },
  resolved: { label: '已解决', cls: 'text-success' },
};

export default function StepC({ t }) {
  const { flags } = t;
  const [accepting, setAccepting] = useState(null);
  const [reasons, setReasons] = useState({});

  const counts = {
    high: flags.filter((f) => f.status === 'open' && f.severity === 'high').length,
    medium: flags.filter((f) => f.status === 'open' && f.severity === 'medium').length,
    low: flags.filter((f) => f.status === 'open' && f.severity === 'low').length,
    resolved: flags.filter((f) => f.status === 'resolved').length,
    accepted: flags.filter((f) => f.status === 'accepted').length,
  };

  const handleAccept = async (f) => {
    await t.setFlagStatus(f.id, 'accepted', reasons[f.id] || '');
    setAccepting(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground">规则冲突检查</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl">系统检查不同步骤之间是否存在逻辑矛盾、风险缺口或执行规则缺失。未解决冲突仍可生成计划，但会进入最终计划的"待处理事项"。</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="border border-destructive/40 bg-destructive/5 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">高风险</div>
          <div className="mt-1 font-mono text-lg text-destructive">{counts.high}</div>
        </div>
        <div className="border border-warning/40 bg-warning/5 rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">中风险</div>
          <div className="mt-1 font-mono text-lg text-warning">{counts.medium}</div>
        </div>
        <div className="border border-border bg-card rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">低风险</div>
          <div className="mt-1 font-mono text-lg text-muted-foreground">{counts.low}</div>
        </div>
        <div className="border border-border bg-card rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">已解决</div>
          <div className="mt-1 font-mono text-lg text-success">{counts.resolved}</div>
        </div>
        <div className="border border-border bg-card rounded p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">已保留</div>
          <div className="mt-1 font-mono text-lg text-foreground">{counts.accepted}</div>
        </div>
      </div>

      {flags.length === 0 ? (
        <div className="border border-border bg-card rounded p-6 text-center">
          <Check className="w-6 h-6 text-success mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">未检测到规则冲突。修改前序步骤答案后，系统会自动重新计算。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((f) => {
            const sev = SEV_CFG[f.severity] || SEV_CFG.low;
            const st = STATUS_CFG[f.status] || STATUS_CFG.open;
            const firstStep = (f.affected_steps || '').split(',')[0]?.trim() || '0';
            return (
              <div key={f.id} className="border border-border bg-card rounded p-4">
                <div className="flex items-start gap-2">
                  <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', sev.dot)} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('px-1.5 py-0.5 rounded border text-[10px] font-mono', sev.cls)}>{sev.label}</span>
                      <span className={cn('text-[11px] font-mono', st.cls)}>{st.label}</span>
                      <h3 className="text-sm font-heading font-semibold text-foreground">{f.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                    <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">涉及步骤：</span><span className="text-foreground font-mono">{f.affected_steps}</span></div>
                      <div><span className="text-muted-foreground">当前值：</span><span className="text-foreground">{f.current_values || '—'}</span></div>
                    </div>
                    <p className="mt-1 text-xs"><span className="text-muted-foreground">建议：</span><span className="text-foreground">{f.recommendation}</span></p>
                    {f.status === 'accepted' && f.accepted_reason && (
                      <p className="mt-1 text-xs text-muted-foreground">用户保留理由：{f.accepted_reason}</p>
                    )}
                  </div>
                </div>
                {f.status === 'open' && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Button size="sm" variant="outline" onClick={() => t.goToStep(firstStep)}><RotateCcw className="w-3.5 h-3.5 mr-1.5" />返回修改</Button>
                    <Button size="sm" variant="outline" onClick={() => t.setFlagStatus(f.id, 'resolved')}><Check className="w-3.5 h-3.5 mr-1.5" />标记已解决</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAccepting(accepting === f.id ? null : f.id)}><AlertTriangle className="w-3.5 h-3.5 mr-1.5" />保留该设置</Button>
                    {accepting === f.id && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input className="h-8 bg-background border border-border rounded px-2 text-xs flex-1" placeholder="保留理由（可选）" value={reasons[f.id] || ''} onChange={(e) => setReasons({ ...reasons, [f.id]: e.target.value })} />
                        <Button size="sm" onClick={() => handleAccept(f)}>确认保留</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-background/90 backdrop-blur border border-border rounded p-3">
        <Button onClick={() => t.completeC()} className="font-heading">继续生成计划 <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
      </div>
    </div>
  );
}