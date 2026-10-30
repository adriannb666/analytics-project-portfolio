import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

function Metric({ label, value, className }) {
  return (
    <div>
      <div className={`text-base font-heading ${className || 'text-foreground'}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

export default function CheckResultPanel({ result, exceptionReason, onExceptionChange, onSave, onRecordViolation, onBack, saving }) {
  const r = result;
  const tone = r.complianceStatus === 'compliant' ? 'success' : r.complianceStatus === 'warning' ? 'warning' : 'destructive';
  const Icon = r.complianceStatus === 'compliant' ? CheckCircle2 : r.complianceStatus === 'warning' ? AlertTriangle : XCircle;
  const title = r.complianceStatus === 'compliant' ? '当前交易符合你的交易计划' : r.complianceStatus === 'warning' ? '当前交易存在提醒' : '当前交易违反核心规则';
  const border = { success: 'border-success/50 bg-success/5', warning: 'border-warning/50 bg-warning/5', destructive: 'border-destructive/50 bg-destructive/5' }[tone];
  const text = { success: 'text-success', warning: 'text-warning', destructive: 'text-destructive' }[tone];
  const needReason = r.complianceStatus !== 'compliant';
  return (
    <div className={`border rounded p-4 space-y-3 ${border}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${text}`} />
        <span className="text-base font-heading text-foreground">{title}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
        <Metric label="一致性评分" value={r.consistencyScore} />
        <Metric label="通过" value={r.passedCount} className="text-success" />
        <Metric label="提醒" value={r.warningCount} className="text-warning" />
        <Metric label="违规" value={r.violationCount} className="text-destructive" />
        <Metric label="风险比例" value={Number.isFinite(r.risk.riskPercent) ? r.risk.riskPercent.toFixed(2) + '%' : '—'} />
      </div>
      {r.violations.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-heading text-destructive">硬性违规</div>
          {r.violations.map((v, i) => <div key={i} className="text-xs text-destructive/90">• {v}</div>)}
        </div>
      )}
      {r.warnings.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-heading text-warning">提醒</div>
          {r.warnings.map((w, i) => <div key={i} className="text-xs text-warning/90">• {w}</div>)}
        </div>
      )}
      {needReason && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{r.complianceStatus === 'warning' ? '执行说明或例外理由 *' : '违规原因 *'}</label>
          <Textarea value={exceptionReason} onChange={(e) => onExceptionChange(e.target.value)} rows={2} className="text-xs" placeholder={r.complianceStatus === 'warning' ? '必须填写例外理由才能保存' : '必须填写违规原因才能记录'} />
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onBack}>返回修改</Button>
        {r.complianceStatus === 'compliant' && <Button size="sm" onClick={onSave} disabled={saving}>保存并创建交易日志</Button>}
        {r.complianceStatus === 'warning' && <Button size="sm" onClick={onSave} disabled={saving || !exceptionReason.trim()}>保存并创建交易日志</Button>}
        {r.complianceStatus === 'violation' && <Button size="sm" variant="destructive" onClick={onRecordViolation} disabled={saving || !exceptionReason.trim()}>记录为违规交易</Button>}
      </div>
    </div>
  );
}