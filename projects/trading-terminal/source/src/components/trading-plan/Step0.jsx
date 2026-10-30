import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Clock, ShieldCheck, FileText, ListChecks, ArrowRight } from 'lucide-react';

const PILLARS = ['交易者画像', '目标与预期', '市场范围', '策略与优势', '风险管理', '交易执行', '心理纪律', '记录与复盘'];
const OUTPUTS = [
  { icon: FileText, label: '完整交易计划' },
  { icon: ShieldCheck, label: '一页核心规则卡' },
  { icon: ListChecks, label: '交易前检查清单' },
];

export default function Step0({ plan, updatePlanFields, onComplete }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground">开始制定你的交易计划</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl">
          通过一系列引导式决策，建立一份完整、专业、可执行的个人交易计划。整个过程预计需要 20 至 35 分钟。请根据自己的真实情况认真完成，快速填写无法形成有价值的交易制度。
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {PILLARS.map((p, i) => (
          <div key={p} className="border border-border bg-card rounded p-3">
            <div className="font-mono text-[11px] text-muted-foreground">0{i + 1}</div>
            <div className="mt-1 text-sm font-heading text-foreground">{p}</div>
          </div>
        ))}
      </div>

      <div className="border border-border bg-card rounded p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">最终生成</div>
        <div className="mt-2 grid sm:grid-cols-3 gap-3">
          {OUTPUTS.map(o => {
            const Icon = o.icon;
            return (
              <div key={o.label} className="flex items-center gap-2 text-sm text-foreground">
                <Icon className="w-4 h-4 text-primary" /><span className="font-heading">{o.label}</span>
              </div>
            );
          })}
        </div>
        <Separator className="my-3" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" /> 预计完成时间 <span className="text-foreground font-mono">20–35 分钟</span>
        </div>
      </div>

      <div className="border border-border bg-card rounded p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">数据说明</div>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>· 用户回答会自动保存到当前账户。</li>
          <li>· 用户可以以后继续修改。</li>
          <li>· 后续将支持 JSON 备份与恢复（第一阶段暂未开放）。</li>
        </ul>
      </div>

      <div className="border border-border bg-card rounded p-4 space-y-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">基本信息</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">计划名称</Label>
            <Input value={plan?.plan_name || ''} onChange={e => updatePlanFields({ plan_name: e.target.value })} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">姓名（可选）</Label>
            <Input value={plan?.owner_name || ''} onChange={e => updatePlanFields({ owner_name: e.target.value })} placeholder="将显示在计划封面" className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">计划版本</Label>
            <Input value={plan?.version || ''} onChange={e => updatePlanFields({ version: e.target.value })} className="bg-background font-mono" />
          </div>
        </div>
      </div>

      <div className="border border-warning/30 bg-warning/5 rounded p-4">
        <div className="text-[11px] uppercase tracking-wider text-warning">重要声明</div>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          本工具仅用于交易教育、风险管理和计划制定。生成内容来自用户本人选择的规则，不构成投资建议、交易信号或任何金融产品的买卖建议。交易可能导致重大损失。所有参数均由用户自行选择，并由用户自行承担使用责任。生成的计划需要经过个人验证、测试和持续修订。
        </p>
      </div>

      <div className="border border-border bg-card rounded p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={agreed} onCheckedChange={setAgreed} className="mt-0.5" />
          <span className="text-sm text-foreground leading-relaxed">
            我理解本工具生成的是基于本人回答的教育性交易框架，不构成投资建议，最终计划中的所有规则由我本人负责。
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-background/90 backdrop-blur border border-border rounded p-3">
        <div className="text-xs text-muted-foreground">数据将自动保存到当前账户，可随时继续修改。</div>
        <Button onClick={onComplete} disabled={!agreed} className="font-heading">
          开始制定 <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}