import React from 'react';
import { Label } from '@/components/ui/label';
import NumberField from './NumberField';
import SegmentedToggle from './SegmentedToggle';
import PlanRiskBanner from './PlanRiskBanner';

export default function CommonInputs({ input, errors, onChange, planRisk, planLoading }) {
  const set = (k, v) => onChange({ ...input, [k]: v });
  return (
    <div className="space-y-3">
      <NumberField label="账户总资金" value={input.account} onChange={(v) => set('account', v)} placeholder="如 10000" error={errors.account} />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">计价币种</Label>
        <SegmentedToggle
          options={[
            { value: 'USDT', label: 'USDT' },
            { value: 'USD', label: 'USD' },
            { value: 'CNY', label: 'CNY' },
            { value: 'HKD', label: 'HKD' },
          ]}
          value={input.currency}
          onChange={(v) => set('currency', v)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">风险输入方式</Label>
        <SegmentedToggle
          options={[
            { value: 'percent', label: '按风险比例' },
            { value: 'amount', label: '按最大亏损金额' },
          ]}
          value={input.riskMode}
          onChange={(v) => set('riskMode', v)}
        />
      </div>
      {input.riskMode === 'percent' ? (
        <>
          <NumberField label="单笔风险比例" value={input.riskPercent} onChange={(v) => set('riskPercent', v)} placeholder="如 1" suffix="%" error={errors.riskPercent} />
          <PlanRiskBanner planRisk={planRisk} planLoading={planLoading} currentRisk={input.riskPercent} />
        </>
      ) : (
        <NumberField label="最大亏损金额" value={input.maxLossAmount} onChange={(v) => set('maxLossAmount', v)} placeholder="如 200" error={errors.maxLossAmount} />
      )}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">交易方向</Label>
        <SegmentedToggle
          options={[
            { value: 'long', label: '做多' },
            { value: 'short', label: '做空' },
          ]}
          value={input.direction}
          onChange={(v) => set('direction', v)}
        />
      </div>
      {!input.dcaEnabled && (
        <NumberField label="开仓价" value={input.entry} onChange={(v) => set('entry', v)} placeholder="如 100" error={errors.entry} />
      )}
    </div>
  );
}