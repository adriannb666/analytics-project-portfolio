import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { psychRecommended } from '@/components/trading-plan/stepsConfig';

const SEVERITIES = ['偶尔发生', '经常发生', '已造成明显亏损'];

function PsychCard({ issue, rule, onUpdate }) {
  const [text, setText] = useState(rule?.final_rule || '');
  useEffect(() => { setText(rule?.final_rule || ''); }, [rule?.id]);
  const recommended = psychRecommended(issue);
  return (
    <div className="border border-border rounded p-3 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-heading font-semibold text-foreground">{issue}</h4>
        <div className="flex items-center gap-1">
          {SEVERITIES.map((s) => (
            <button key={s} type="button" onClick={() => onUpdate(issue, { severity: s })}
              className={`px-2 py-1 rounded border text-[11px] ${rule?.severity === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground uppercase tracking-wider">系统推荐规则</div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{recommended}</p>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider">最终 If–Then 规则<span className="text-destructive">*</span></div>
        <Button type="button" variant="outline" size="sm" onClick={() => { setText(recommended); onUpdate(issue, { final_rule: recommended }); }}>使用推荐规则</Button>
      </div>
      <Textarea className="mt-1 bg-card min-h-[80px] text-sm leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => onUpdate(issue, { final_rule: text })} placeholder="编辑你的最终纪律规则" />
    </div>
  );
}

export default function PsychCards({ t }) {
  const issues = (t.answers['s7_issues'] || []).filter((i) => i !== '目前没有明显问题' && i !== '其他');
  if (issues.length === 0) {
    return <p className="text-xs text-muted-foreground">未选择具体心理问题，无需填写 If–Then 规则。</p>;
  }
  return (
    <div className="space-y-3">
      {issues.map((issue) => {
        const r = (t.psychRules || []).find((p) => p.issue_key === issue);
        return <PsychCard key={issue} issue={issue} rule={r} onUpdate={t.updatePsychRule} />;
      })}
    </div>
  );
}