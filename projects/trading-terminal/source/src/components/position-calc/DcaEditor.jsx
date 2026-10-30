import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import NumberField from './NumberField';
import { computeDcaSummary, fmt } from '@/lib/positionCalc';

export default function DcaEditor({ batches, onChange, error }) {
  const summary = computeDcaSummary(batches);
  const update = (i, patch) => onChange(batches.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const add = () => onChange([...batches, { price: '', ratio: '' }]);
  const remove = (i) => onChange(batches.filter((_, idx) => idx !== i));

  const totalRatio = summary ? summary.totalRatio : 0;
  const ratioOk = summary && Math.abs(totalRatio - 100) < 0.01;

  return (
    <div className="space-y-2 border border-border rounded p-3 bg-card/40">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">分批建仓（DCA）批次</Label>
        <Button variant="outline" size="sm" type="button" onClick={add}>
          <Plus className="w-3.5 h-3.5 mr-1" />添加批次
        </Button>
      </div>
      {batches.map((b, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <NumberField label={`批次 ${i + 1} 价格`} value={b.price} onChange={(v) => update(i, { price: v })} placeholder="如 100" />
          <NumberField label="比例" value={b.ratio} onChange={(v) => update(i, { ratio: v })} placeholder="如 30" suffix="%" />
          <Button variant="ghost" size="icon" type="button" onClick={() => remove(i)} disabled={batches.length <= 2} className="mb-1">
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      ))}
      {error && <p className="text-[11px] text-destructive leading-snug">{error}</p>}
      {summary && (
        <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 pt-1">
          <span>比例合计：{fmt(totalRatio)}%{!ratioOk && <span className="text-warning ml-1">（按相对权重归一化）</span>}</span>
          <span>平均开仓价：{fmt(summary.avgPrice)}</span>
        </div>
      )}
    </div>
  );
}