import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ClipboardPaste } from 'lucide-react';
import { validateStopDirection, parseCopiedResult, computeDcaSummary, fmt as fmtPrice } from '@/lib/positionCalc';
import DcaEditor from '@/components/position-calc/DcaEditor';
import { useToast } from '@/components/ui/use-toast';

const MARKETS = ['A股', '港股', '美股', '加密货币', '外汇', '国内期货', '海外期货', '指数', '商品', '其他'];
const SOURCES = ['自主分析', '社群观点', 'KOL 或博主', '朋友建议', '自动信号', '临时异动', '其他'];
const DEFAULT_SETUPS = ['趋势跟随', '突破', '均值回归', '关键区域', '动量', '市场结构', '事件驱动', '其他'];

function Field({ label, required, children, error, hint }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground/70 mt-1">{hint}</div>}
      {error && <div className="text-[11px] text-destructive mt-1">{error}</div>}
    </div>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div className="flex border border-border rounded-sm overflow-hidden h-8">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} className={`flex-1 text-xs ${value === o.v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
      ))}
    </div>
  );
}

function fmt(n) { if (!Number.isFinite(n)) return '—'; return n.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
function fmtPct(n) { if (!Number.isFinite(n)) return '—'; return n.toLocaleString('en-US', { maximumFractionDigits: 4 }) + '%'; }
function ReadStat({ label, value }) {
  return (
    <div className="border border-border rounded-sm bg-muted/30 px-2 py-1.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-heading">{value}</div>
    </div>
  );
}

export default function TradeInfoForm({ form, onChange, risk, ctx }) {
  const { toast } = useToast();
  const planStrats = (ctx && Array.isArray(ctx.answers && ctx.answers['s4_strategies'])) ? ctx.answers['s4_strategies'] : [];
  const setups = Array.from(new Set([...planStrats, ...DEFAULT_SETUPS]));
  const stopErr = validateStopDirection(form.direction, form.planned_entry_price, form.planned_stop_price);
  const inputCls = 'h-8 text-xs';
  const dcaEnabled = !!form.dca_enabled;
  const dcaSummary = dcaEnabled ? computeDcaSummary(form.dca_batches) : null;
  const dcaErr = dcaEnabled && (!dcaSummary || dcaSummary.count < 2) ? '至少需要 2 个有效分批（价格与比例均大于 0）' : '';
  const effectiveEntry = dcaSummary ? dcaSummary.avgPrice : form.planned_entry_price;
  const stopErrDca = validateStopDirection(form.direction, effectiveEntry, form.planned_stop_price);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const patch = parseCopiedResult(text);
      if (!patch) {
        toast({ title: '剪贴板内容不是仓位计算结果', description: '请先在仓位计算器复制结果，再回来粘贴。', variant: 'destructive' });
        return;
      }
      onChange(patch);
      toast({ title: '已粘贴仓位计算结果', description: patch.dca_enabled ? '已自动填入方向、DCA 分批、止损价、仓位与账户权益。' : '已自动填入方向、开仓价、止损价、仓位与账户权益。' });
    } catch (e) {
      toast({ title: '读取剪贴板失败', description: '请手动复制结果后重试，或检查浏览器剪贴板权限。', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-heading text-foreground uppercase tracking-wider">第一部分 · 交易信息</div>
        <button type="button" onClick={handlePaste} className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <ClipboardPaste className="w-3.5 h-3.5" />一键粘贴仓位计算结果
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="标的代码" required>
          <Input value={form.symbol} onChange={(e) => onChange({ symbol: e.target.value })} placeholder="BTCUSDT / NVDA / SPY" className={inputCls} />
        </Field>
        <Field label="标的名称">
          <Input value={form.asset_name} onChange={(e) => onChange({ asset_name: e.target.value })} placeholder="可选" className={inputCls} />
        </Field>
        <Field label="所属市场" required>
          <select value={form.market} onChange={(e) => onChange({ market: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2">
            <option value="">请选择</option>
            {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="交易方向" required>
          <Seg options={[{ v: 'long', l: '做多' }, { v: 'short', l: '做空' }]} value={form.direction} onChange={(v) => onChange({ direction: v })} />
        </Field>
        <Field label="Setup 类型" required>
          <select value={form.setup_type} onChange={(e) => onChange({ setup_type: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2">
            <option value="">请选择</option>
            {setups.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="交易来源" required>
          <select value={form.trade_source} onChange={(e) => onChange({ trade_source: e.target.value })} className="w-full h-8 text-xs bg-background border border-border rounded px-2">
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="开仓价" required hint={dcaEnabled ? '已启用分批建仓，开仓价按分批加权平均自动计算' : undefined}>
          {dcaEnabled ? (
            <Input type="text" readOnly value={dcaSummary ? fmtPrice(dcaSummary.avgPrice) : '—'} className={`${inputCls} bg-muted/40 text-muted-foreground`} />
          ) : (
            <Input type="number" value={form.planned_entry_price} onChange={(e) => onChange({ planned_entry_price: e.target.value })} className={inputCls} />
          )}
        </Field>
        <Field label="止损价" required error={(dcaEnabled ? stopErrDca : stopErr) || undefined}>
          <Input type="number" value={form.planned_stop_price} onChange={(e) => onChange({ planned_stop_price: e.target.value })} className={inputCls} />
        </Field>
        <Field label="止盈价">
          <Input type="number" value={form.planned_target_price} onChange={(e) => onChange({ planned_target_price: e.target.value })} className={inputCls} />
        </Field>
        <Field label="仓位输入方式">
          <Seg options={[{ v: 'quantity', l: '仓位数量' }, { v: 'notional', l: '名义仓位价值' }]} value={form.position_input_type} onChange={(v) => onChange({ position_input_type: v })} />
        </Field>
        <Field label={form.position_input_type === 'notional' ? '名义仓位价值' : '仓位大小'} required>
          <Input type="number" value={form.planned_position_size} onChange={(e) => onChange({ planned_position_size: e.target.value })} className={inputCls} />
        </Field>
        <Field label="账户总权益">
          <Input type="number" value={form.account_equity} onChange={(e) => onChange({ account_equity: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="dca-pretrade" checked={dcaEnabled} onCheckedChange={(v) => onChange({ dca_enabled: v, dca_batches: v && (!form.dca_batches || form.dca_batches.length < 2) ? [{ price: '', ratio: '50' }, { price: '', ratio: '50' }] : (form.dca_batches || []) })} />
        <Label htmlFor="dca-pretrade" className="text-xs text-muted-foreground select-none">分批建仓（DCA）</Label>
        {dcaSummary && <span className="text-[11px] text-muted-foreground">· 平均开仓价 {fmtPrice(dcaSummary.avgPrice)} · {dcaSummary.count} 批</span>}
      </div>
      {dcaEnabled && (
        <DcaEditor batches={form.dca_batches || []} onChange={(b) => onChange({ dca_batches: b })} error={dcaErr} />
      )}
      <div className="grid grid-cols-3 gap-2">
        <ReadStat label="风险金额" value={fmt(risk.riskAmount)} />
        <ReadStat label="风险比例" value={Number.isFinite(risk.riskPercent) ? risk.riskPercent.toFixed(2) + '%' : '—'} />
        <ReadStat label="计划盈亏比" value={Number.isFinite(risk.rr) ? risk.rr.toFixed(2) : '—'} />
      </div>
      <Field label="交易理由" required hint="请说明市场环境、方向判断、入场触发和失效条件。">
        <Textarea value={form.trade_thesis} onChange={(e) => onChange({ trade_thesis: e.target.value })} rows={3} className="text-xs" placeholder="市场环境、方向判断、入场触发、失效条件" />
      </Field>
    </div>
  );
}