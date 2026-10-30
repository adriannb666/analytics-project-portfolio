import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, ClipboardList, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DIRECTIONS = [{ v: 'long', l: '做多' }, { v: 'short', l: '做空' }];
const EMOTIONS = [
  { v: 'calm', l: '冷静' },
  { v: 'hesitant', l: '犹豫' },
  { v: 'fomo', l: 'FOMO' },
  { v: 'impatient', l: '急躁' },
  { v: 'revenge', l: '复仇交易' },
];
const PLATFORMS = ['Hyperliquid', 'Lighter', 'Binance', 'OKX', 'Bybit', 'A股', '美股', '期货', '其他'];

const num = (v) => (v === '' || v == null ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
const round = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

// 从 PlanAnswer 提取风险规则与交易逻辑摘要
function derivePlanContext(answers) {
  const get = (k) => {
    const r = answers.find((a) => a.question_key === k);
    if (!r) return null;
    try { return JSON.parse(r.answer_value); } catch (e) { return r.answer_value; }
  };
  const strategy = answers
    .filter((a) => a.question_key && a.question_key.startsWith('s4'))
    .map((a) => a.answer_text || a.answer_value)
    .filter(Boolean);
  const maxLev = get('s5_max_leverage');
  const levAllowed = get('s5_leverage_allowed');
  const maxDrawdown = get('s5_max_drawdown');
  const maxPositions = get('s5_max_positions');
  const stopPolicy = get('s6_stop_with_entry');
  const riskPerTrade = get('s5_risk_per_trade');
  const rules = [];
  if (levAllowed === '不允许') rules.push('不允许使用杠杆');
  else if (maxLev != null) rules.push(`最大杠杆 ${maxLev}×`);
  if (maxDrawdown != null) rules.push(`最大回撤 ${maxDrawdown}`);
  if (riskPerTrade != null) rules.push(`单笔风险 ${riskPerTrade}`);
  if (maxPositions != null) rules.push(`最大持仓 ${maxPositions} 个`);
  if (stopPolicy) rules.push(`止损策略：${stopPolicy}`);
  return { strategy: strategy.slice(0, 3), rules };
}

export default function ManualTradeForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform: 'Hyperliquid',
    symbol: '',
    direction: 'long',
    opened_at: '',
    actual_entry_price: '',
    actual_exit_price: '',
    actual_position_size: '',
    trade_value: '',
    leverage: '',
    planned_stop_price: '',
    planned_target_price: '',
    trading_plan_id: '',
    trade_thesis: '',
    trade_reason: '',
    what_went_well: '',
    what_to_improve: '',
    emotion: '',
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['trading-plans-for-journal'],
    queryFn: () => base44.entities.TradingPlan.list('-updated_date', 50),
  });

  const { data: planAnswers = [] } = useQuery({
    queryKey: ['plan-answers', form.trading_plan_id],
    queryFn: () => base44.entities.PlanAnswer.filter({ trading_plan_id: form.trading_plan_id }, 'created_date', 300),
    enabled: !!form.trading_plan_id,
  });

  const planCtx = useMemo(() => derivePlanContext(planAnswers), [planAnswers]);

  const onForm = (patch) => setForm((f) => ({ ...f, ...patch }));

  // 自动计算仓位价值（未手动填写时）
  const computedValue = useMemo(() => {
    const e = num(form.actual_entry_price);
    const q = num(form.actual_position_size);
    if (Number.isFinite(e) && Number.isFinite(q)) return round(e * q);
    return null;
  }, [form.actual_entry_price, form.actual_position_size]);

  const handleSave = async () => {
    if (!form.symbol || !form.direction) {
      toast({ title: '请填写标的与方向', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const entry = num(form.actual_entry_price);
      const exit = num(form.actual_exit_price);
      const qty = num(form.actual_position_size);
      const tv = num(form.trade_value) != null ? num(form.trade_value) : computedValue;
      const fees = 0;
      let status = 'planned';
      let pnl = null;
      if (entry != null && exit != null && qty != null) {
        const gross = form.direction === 'long' ? (exit - entry) * qty : (entry - exit) * qty;
        pnl = round(gross - fees);
        status = 'completed';
      } else if (entry != null) {
        status = 'open';
      }
      const payload = {
        source: 'manual',
        platform: form.platform || null,
        symbol: form.symbol,
        direction: form.direction,
        market: form.platform || null,
        opened_at: form.opened_at ? new Date(form.opened_at).toISOString() : (entry != null ? new Date().toISOString() : null),
        closed_at: status === 'completed' && form.opened_at ? new Date().toISOString() : null,
        actual_entry_price: entry,
        actual_exit_price: exit,
        actual_position_size: qty,
        trade_value: tv,
        leverage: num(form.leverage),
        planned_stop_price: num(form.planned_stop_price),
        planned_target_price: num(form.planned_target_price),
        trading_plan_id: form.trading_plan_id || null,
        trade_thesis: form.trade_thesis || null,
        trade_reason: form.trade_reason || null,
        what_went_well: form.what_went_well || null,
        what_to_improve: form.what_to_improve || null,
        emotion: form.emotion || null,
        pnl_amount: pnl,
        status,
      };
      const created = await base44.entities.TradeJournal.create(payload);
      toast({ title: '交易记录已创建' });
      navigate(`/journal/${created.id}`);
    } catch (e) {
      toast({ title: '创建失败', description: (e && e.message) || '', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/journal')}><ArrowLeft className="w-4 h-4 mr-1" />返回列表</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-1" />{saving ? '保存中…' : '保存记录'}</Button>
      </div>

      <div>
        <h1 className="text-lg font-heading font-semibold text-foreground">手动记录交易</h1>
        <p className="mt-1 text-xs text-muted-foreground">录入交易的基础信息、执行数据、交易计划关联与复盘。</p>
      </div>

      {/* 基础信息 */}
      <Section title="基础信息">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="交易平台">
            <select
              value={form.platform}
              onChange={(e) => onForm({ platform: e.target.value })}
              className="h-8 text-xs bg-card border border-border rounded px-2 w-full"
            >
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="标的"><Input value={form.symbol} onChange={(e) => onForm({ symbol: e.target.value })} className="h-8 text-xs" placeholder="如 BTC / 600519" /></Field>
          <Field label="方向">
            <div className="flex border border-border rounded-sm overflow-hidden h-8">
              {DIRECTIONS.map((o) => (
                <button key={o.v} type="button" onClick={() => onForm({ direction: o.v })} className={`flex-1 text-xs ${form.direction === o.v ? (o.v === 'long' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive') : 'text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
              ))}
            </div>
          </Field>
          <Field label="开仓时间"><Input type="datetime-local" value={form.opened_at} onChange={(e) => onForm({ opened_at: e.target.value })} className="h-8 text-xs" /></Field>
        </div>
      </Section>

      {/* 交易信息 */}
      <Section title="交易信息">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="入场价格"><Input type="number" value={form.actual_entry_price} onChange={(e) => onForm({ actual_entry_price: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="出场价格"><Input type="number" value={form.actual_exit_price} onChange={(e) => onForm({ actual_exit_price: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="数量"><Input type="number" value={form.actual_position_size} onChange={(e) => onForm({ actual_position_size: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="仓位价值" hint={computedValue != null ? `自动计算：${computedValue}` : ''}>
            <Input type="number" value={form.trade_value} onChange={(e) => onForm({ trade_value: e.target.value })} className="h-8 text-xs" placeholder={computedValue != null ? String(computedValue) : '入场价 × 数量'} />
          </Field>
          <Field label="杠杆"><Input type="number" step="0.1" value={form.leverage} onChange={(e) => onForm({ leverage: e.target.value })} className="h-8 text-xs" placeholder="如 3" /></Field>
          <Field label="止损价格"><Input type="number" value={form.planned_stop_price} onChange={(e) => onForm({ planned_stop_price: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="止盈计划"><Input type="number" value={form.planned_target_price} onChange={(e) => onForm({ planned_target_price: e.target.value })} className="h-8 text-xs" /></Field>
        </div>
      </Section>

      {/* 交易计划 */}
      <Section title="交易计划">
        <Field label="关联 Trading Plan">
          <select
            value={form.trading_plan_id}
            onChange={(e) => onForm({ trading_plan_id: e.target.value })}
            className="h-8 text-xs bg-card border border-border rounded px-2 w-full max-w-md"
          >
            <option value="">不关联</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.plan_name || '未命名计划'}{p.status === 'active' ? ' · 进行中' : ''}</option>)}
          </select>
        </Field>
        {form.trading_plan_id && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-border/60 rounded bg-background/40 p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><ClipboardList className="w-3 h-3" />交易逻辑</div>
              {planCtx.strategy.length > 0 ? (
                planCtx.strategy.map((s, i) => <div key={i} className="text-xs text-foreground/90 leading-relaxed">• {s}</div>)
              ) : <div className="text-xs text-muted-foreground">该计划未填写策略与优势</div>}
            </div>
            <div className="border border-border/60 rounded bg-background/40 p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />风险规则</div>
              {planCtx.rules.length > 0 ? (
                planCtx.rules.map((r, i) => <div key={i} className="text-xs text-foreground/90 leading-relaxed">• {r}</div>)
              ) : <div className="text-xs text-muted-foreground">该计划未设置风险规则</div>}
            </div>
          </div>
        )}
        <div className="mt-3">
          <Field label="交易逻辑 / 入场理由"><Textarea value={form.trade_thesis} onChange={(e) => onForm({ trade_thesis: e.target.value })} rows={2} className="text-xs" placeholder="本次交易的逻辑与入场依据" /></Field>
        </div>
      </Section>

      {/* 复盘 */}
      <Section title="复盘">
        <div className="space-y-3">
          <Field label="交易原因"><Textarea value={form.trade_reason} onChange={(e) => onForm({ trade_reason: e.target.value })} rows={2} className="text-xs" placeholder="为什么做这笔交易" /></Field>
          <Field label="交易结果"><Textarea value={form.what_went_well} onChange={(e) => onForm({ what_went_well: e.target.value })} rows={2} className="text-xs" placeholder="结果如何、做对的地方" /></Field>
          <Field label="错误总结"><Textarea value={form.what_to_improve} onChange={(e) => onForm({ what_to_improve: e.target.value })} rows={2} className="text-xs" placeholder="存在的问题与可改进之处" /></Field>
          <Field label="情绪状态">
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => onForm({ emotion: form.emotion === o.v ? '' : o.v })}
                  className={`text-xs px-2.5 py-1.5 rounded border mobile-tap ${form.emotion === o.v ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border border-border rounded bg-card/30 p-4 space-y-3">
      <div className="text-xs font-heading text-foreground uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}