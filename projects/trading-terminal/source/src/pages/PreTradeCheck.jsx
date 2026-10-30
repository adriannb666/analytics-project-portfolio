import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { loadPlanContext, buildPlanSummary, computeRisk, evaluateCheck, CHECK_ITEMS } from '@/lib/preTradeEngine';
import { computeDcaSummary } from '@/lib/positionCalc';
import PlanSummaryBar from '@/components/pretrade/PlanSummaryBar';
import TradeInfoForm from '@/components/pretrade/TradeInfoForm';
import ChecklistPanel from '@/components/pretrade/ChecklistPanel';
import CheckResultPanel from '@/components/pretrade/CheckResultPanel';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_FORM = {
  symbol: '', asset_name: '', market: '', direction: 'long', setup_type: '', trade_source: '自主分析',
  planned_entry_price: '', planned_stop_price: '', planned_target_price: '',
  position_input_type: 'quantity', planned_position_size: '', account_equity: '', trade_thesis: '',
  dca_enabled: false, dca_batches: [{ price: '', ratio: '50' }, { price: '', ratio: '50' }],
};

const num = (v) => (v === '' || v == null ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
const round = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const toDcaBatches = (batches) => (Array.isArray(batches) ? batches.map((b) => ({ price: num(b.price), ratio: num(b.ratio) })).filter((b) => Number.isFinite(b.price) && Number.isFinite(b.ratio)) : []);

export default function PreTradeCheck() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [manual, setManual] = useState({});
  const [result, setResult] = useState(null);
  const [exceptionReason, setExceptionReason] = useState('');
  const [todayCount, setTodayCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await loadPlanContext();
        setCtx(c);
        if (c) {
          const markets = (c.answers && Array.isArray(c.answers['s3_markets'])) ? c.answers['s3_markets'] : [];
          if (markets.length) setForm((f) => ({ ...f, market: markets[0].replace(/\s+/g, '') }));
        }
        try {
          const checks = await base44.entities.PreTradeCheck.list('-created_date', 100);
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          setTodayCount(checks.filter((c) => new Date(c.created_date) >= todayStart).length);
        } catch (e) { /* ignore */ }
      } catch (e) { console.error('加载计划失败', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const summary = useMemo(() => (ctx ? buildPlanSummary(ctx) : null), [ctx]);
  const risk = useMemo(() => computeRisk(form), [form]);
  const hasPlan = !!(ctx && ctx.plan && ctx.plan.id);

  const liveItems = useMemo(() => {
    if (!hasPlan) return CHECK_ITEMS.map((it) => ({ ...it, status: it.mode === 'auto' ? 'pending' : (manual[it.key] || 'pending'), detail: it.mode === 'auto' ? '需要交易计划' : '' }));
    return evaluateCheck(ctx, form, manual, todayCount).items;
  }, [hasPlan, ctx, form, manual, todayCount]);

  const onForm = (patch) => { setForm((f) => ({ ...f, ...patch })); if (result) setResult(null); };
  const onManual = (key, val) => { setManual((m) => ({ ...m, [key]: val })); if (result) setResult(null); };

  const runCheck = () => {
    if (!form.symbol.trim()) { toast({ title: '请填写标的代码', variant: 'destructive' }); return; }
    if (!form.direction) { toast({ title: '请选择交易方向', variant: 'destructive' }); return; }
    const r = hasPlan ? evaluateCheck(ctx, form, manual, todayCount) : evaluateCheck({ answers: {}, watchlist: [], flags: [] }, form, manual, todayCount);
    setResult(r);
    setExceptionReason('');
  };

  const persist = async (compliance) => {
    setSaving(true);
    try {
      const r = result;
      const dcaEnabled = !!form.dca_enabled;
      const dcaBatches = dcaEnabled ? toDcaBatches(form.dca_batches) : [];
      const dcaAvg = dcaEnabled ? (computeDcaSummary(form.dca_batches)?.avgPrice ?? null) : null;
      const entryPrice = dcaEnabled ? dcaAvg : num(form.planned_entry_price);
      const rec = {
        trading_plan_id: ctx?.plan?.id || null,
        symbol: form.symbol.trim(), asset_name: form.asset_name, market: form.market,
        direction: form.direction, setup_type: form.setup_type, trade_source: form.trade_source,
        planned_entry_price: entryPrice, planned_stop_price: num(form.planned_stop_price),
        planned_target_price: num(form.planned_target_price),
        position_input_type: form.position_input_type, planned_position_size: num(form.planned_position_size),
        dca_enabled: dcaEnabled, dca_batches: dcaBatches,
        account_equity: num(form.account_equity),
        planned_risk_amount: round(r.risk.riskAmount), planned_risk_percent: round(r.risk.riskPercent),
        planned_reward_risk: round(r.risk.rr), trade_thesis: form.trade_thesis,
        checklist_results: manual, passed_count: r.passedCount, warning_count: r.warningCount,
        violation_count: r.violationCount, consistency_score: r.consistencyScore,
        compliance_status: compliance, warnings: r.warnings, violations: r.violations,
        exception_reason: exceptionReason, status: 'completed',
      };
      const created = await base44.entities.PreTradeCheck.create(rec);
      const existing = await base44.entities.TradeJournal.filter({ pre_trade_check_id: created.id }, '-created_date', 1);
      let journal = existing && existing[0];
      if (!journal) {
        journal = await base44.entities.TradeJournal.create({
          trading_plan_id: ctx?.plan?.id || null, pre_trade_check_id: created.id,
          symbol: form.symbol.trim(), asset_name: form.asset_name, market: form.market,
          direction: form.direction, setup_type: form.setup_type, trade_source: form.trade_source,
          trade_thesis: form.trade_thesis,
          planned_entry_price: entryPrice, planned_stop_price: num(form.planned_stop_price),
          planned_target_price: num(form.planned_target_price),
          planned_position_size: num(form.planned_position_size),
          position_input_type: form.position_input_type,
          dca_enabled: dcaEnabled, dca_batches: dcaBatches,
          account_equity: num(form.account_equity),
          planned_risk_amount: round(r.risk.riskAmount), planned_risk_percent: round(r.risk.riskPercent),
          planned_reward_risk: round(r.risk.rr),
          compliance_status: compliance, warnings: r.warnings, violations: r.violations,
          exception_reason: exceptionReason, status: 'planned',
        });
      }
      toast({ title: '已保存并创建交易日志' });
      navigate(`/journal/${journal.id}`);
    } catch (e) {
      toast({ title: '保存失败', description: (e && e.message) || '请重试', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">加载中…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" />交易前检查</h1>
        <p className="mt-1 text-sm text-muted-foreground">在下单前，对照你的个人交易计划检查市场范围、策略条件、风险和心理状态。</p>
      </div>

      <PlanSummaryBar summary={summary} hasPlan={hasPlan} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border rounded bg-card/30 p-4">
          <TradeInfoForm form={form} onChange={onForm} risk={risk} ctx={ctx} />
        </div>
        <div className="border border-border rounded bg-card/30 p-4">
          <ChecklistPanel items={liveItems} manual={manual} onManual={onManual} />
        </div>
      </div>

      {!result && (
        <div className="flex justify-end">
          <Button onClick={runCheck}><ShieldCheck className="w-4 h-4 mr-1.5" />开始检查</Button>
        </div>
      )}

      {result && (
        <CheckResultPanel
          result={result}
          exceptionReason={exceptionReason}
          onExceptionChange={setExceptionReason}
          onSave={() => persist(result.complianceStatus)}
          onRecordViolation={() => persist('violation')}
          onBack={() => setResult(null)}
          saving={saving}
        />
      )}
    </div>
  );
}