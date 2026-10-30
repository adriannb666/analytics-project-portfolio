import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CommonInputs from './CommonInputs';
import NumberField from './NumberField';
import ResultStat from './ResultStat';
import DcaEditor from './DcaEditor';
import DcaBreakdown from './DcaBreakdown';
import { calcByStop, validateByStop, copyByStop, fmt, fmtPct } from '@/lib/positionCalc';

export default function TemplateByStop({ input, onChange, onReset, planRisk, planLoading, onRecord }) {
  const { toast } = useToast();
  const errors = useMemo(() => validateByStop(input), [input]);
  const result = useMemo(() => calcByStop(input), [input]);
  const hasErrors = Object.keys(errors).length > 0;
  const calcError = result && result.error;
  const showResult = !hasErrors && !calcError && result && result.maxLoss != null;

  const handleCopy = async () => {
    if (!showResult) return;
    try {
      await navigator.clipboard.writeText(copyByStop(input, result, input.currency));
      if (onRecord) onRecord(input, result);
      toast({ title: '已复制计算结果' });
    } catch (e) {
      toast({ title: '复制失败', description: '请手动选择文本复制', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">已知账户资金、单笔风险、开仓价和止损价，计算建议仓位数量和名义仓位价值。</p>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3 border border-border bg-card rounded p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">输入</div>
          <CommonInputs input={input} errors={errors} onChange={onChange} planRisk={planRisk} planLoading={planLoading} />
          <div className="flex items-center gap-2">
            <Switch id="dca-stop" checked={!!input.dcaEnabled} onCheckedChange={(v) => onChange({ ...input, dcaEnabled: v })} />
            <Label htmlFor="dca-stop" className="text-xs text-muted-foreground select-none">分批建仓（DCA）</Label>
          </div>
          {input.dcaEnabled && (
            <DcaEditor batches={input.dcaBatches || []} onChange={(b) => onChange({ ...input, dcaBatches: b })} error={errors.dca} />
          )}
          <NumberField label="止损价" value={input.stop} onChange={(v) => onChange({ ...input, stop: v })} placeholder="如 95" error={errors.stop} />
        </div>

        <div className="space-y-3 border border-border bg-card rounded p-4 min-h-[200px]">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">结果</div>
          {calcError ? (
            <div className="text-sm text-destructive border border-destructive/40 bg-destructive/5 rounded p-3">{calcError}</div>
          ) : hasErrors ? (
            <div className="text-xs text-muted-foreground">请先补全并修正输入字段，结果将自动更新。</div>
          ) : showResult ? (
            <>
              <div className="grid grid-cols-1 gap-2">
                <ResultStat label="最大允许亏损" value={fmt(result.maxLoss)} unit={input.currency} emphasis />
                <ResultStat label="建议仓位数量" value={fmt(result.positionSize)} emphasis tone="green" />
                <ResultStat label="建议名义仓位" value={fmt(result.notionalValue)} unit={input.currency} emphasis />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                <ResultStat label="止损距离" value={fmtPct(result.stopDistancePct)} />
                <ResultStat label="实际风险比例" value={fmtPct(result.actualRiskPct)} />
                <ResultStat label="交易方向" value={result.direction === 'long' ? '做多' : '做空'} />
                <ResultStat label="开仓价" value={fmt(result.entry)} />
                <ResultStat label="止损价" value={fmt(result.stop)} />
              </div>
              <DcaBreakdown dca={result.dca} currency={input.currency} />
            </>
          ) : (
            <div className="text-xs text-muted-foreground">输入完整后将自动显示计算结果。</div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!showResult}>
          <Copy className="w-3.5 h-3.5 mr-1.5" />复制结果
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />重置
        </Button>
      </div>
    </div>
  );
}