import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Upload, Image as ImageIcon, X, Link2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { computeRisk } from '@/lib/preTradeEngine';
import { computeDcaSummary, fmt as fmtPrice, fmtPct as fmtPct2 } from '@/lib/positionCalc';
import DcaEditor from '@/components/position-calc/DcaEditor';
import DcaBreakdown from '@/components/position-calc/DcaBreakdown';
import { PLATFORM_LABEL, fmtPrice as fmtPriceRaw, fmtAddr, fmtTime } from '@/lib/dexMonitorFormat';

const STATUS_OPTIONS = [
  { v: 'planned', l: '待执行' },
  { v: 'open', l: '持仓中' },
  { v: 'completed', l: '已完成' },
  { v: 'closed', l: '已平仓' },
  { v: 'cancelled', l: '已取消' },
];
const ADHERENCE_OPTIONS = [
  { v: 'full', l: '完全执行' },
  { v: 'mostly', l: '基本执行' },
  { v: 'partial', l: '部分执行' },
  { v: 'severe', l: '严重偏离' },
];

function fmtNum(n, suffix = '') {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 }) + suffix;
}
const num = (v) => (v === '' || v == null ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
const round = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const toDcaBatches = (batches) => (Array.isArray(batches) ? batches.map((b) => ({ price: num(b.price), ratio: num(b.ratio) })).filter((b) => Number.isFinite(b.price) && Number.isFinite(b.ratio)) : []);

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value, className }) {
  return (
    <div className="flex justify-between py-1 border-b border-border/50 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-heading ${className || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export default function TradeJournalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [form, setForm] = useState({});
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const j = await base44.entities.TradeJournal.get(id);
        setJournal(j);
        if (j.connection_id) {
          try {
            const conns = await base44.entities.DexMonitorConnection.filter({ id: j.connection_id }, '-created_date', 1);
            setConnection(conns && conns[0] ? conns[0] : null);
          } catch (e) { setConnection(null); }
        }
        setForm({
          platform: j.platform || '',
          planned_entry_price: j.planned_entry_price ?? '',
          planned_stop_price: j.planned_stop_price ?? '',
          planned_target_price: j.planned_target_price ?? '',
          planned_position_size: j.planned_position_size ?? '',
          position_input_type: j.position_input_type || 'quantity',
          dca_enabled: !!j.dca_enabled,
          dca_batches: Array.isArray(j.dca_batches) && j.dca_batches.length > 0
            ? j.dca_batches.map((b) => ({ price: b.price ?? '', ratio: b.ratio ?? '' }))
            : [{ price: '', ratio: '50' }, { price: '', ratio: '50' }],
          account_equity: j.account_equity ?? '',
          setup_type: j.setup_type || '',
          trade_source: j.trade_source || '',
          trade_thesis: j.trade_thesis || '',
          actual_entry_price: j.actual_entry_price ?? '',
          actual_exit_price: j.actual_exit_price ?? '',
          actual_position_size: j.actual_position_size ?? '',
          opened_at: j.opened_at ? j.opened_at.slice(0, 16) : '',
          closed_at: j.closed_at ? j.closed_at.slice(0, 16) : '',
          fees: j.fees ?? '',
          pnl_amount: j.pnl_amount ?? '',
          pnl_percent: j.pnl_percent ?? '',
          r_multiple: j.r_multiple ?? '',
          max_favorable_r: j.max_favorable_r ?? '',
          max_adverse_r: j.max_adverse_r ?? '',
          execution_adherence: j.execution_adherence || '',
          execution_issues: (j.execution_issues || []).join('\n'),
          what_went_well: j.what_went_well || '',
          what_to_improve: j.what_to_improve || '',
          trade_reason: j.trade_reason || '',
          trade_result: j.trade_result || '',
          error_summary: j.error_summary || '',
          emotion: j.emotion || '',
          would_take_again: j.would_take_again || '',
          lessons_learned: j.lessons_learned || '',
          next_action_rule: j.next_action_rule || '',
          status: j.status || 'planned',
        });
        const shots = await base44.entities.TradeScreenshot.filter({ trade_journal_id: id }, 'created_date', 50);
        setScreenshots(shots);
      } catch (e) {
        toast({ title: '加载失败', description: (e && e.message) || '', variant: 'destructive' });
      } finally { setLoading(false); }
    })();
  }, [id]);

  const onForm = (patch) => setForm((f) => ({ ...f, ...patch }));

  const plannedRisk = useMemo(() => computeRisk({
    planned_entry_price: form.planned_entry_price,
    planned_stop_price: form.planned_stop_price,
    planned_target_price: form.planned_target_price,
    planned_position_size: form.planned_position_size,
    account_equity: form.account_equity,
    position_input_type: form.position_input_type,
    dca_enabled: form.dca_enabled,
    dca_batches: form.dca_batches,
  }), [form.planned_entry_price, form.planned_stop_price, form.planned_target_price, form.planned_position_size, form.account_equity, form.position_input_type, form.dca_enabled, form.dca_batches]);

  const dcaSummary = form.dca_enabled ? computeDcaSummary(form.dca_batches) : null;
  const dcaErr = form.dca_enabled && (!dcaSummary || dcaSummary.count < 2) ? '至少需要 2 个有效分批（价格与比例均大于 0）' : '';
  const dcaBreakdown = useMemo(() => {
    if (!form.dca_enabled || !dcaSummary || !Number.isFinite(plannedRisk.qty)) return null;
    const batches = dcaSummary.valid.map((p) => {
      const weight = p.ratio / dcaSummary.totalRatio;
      const position = plannedRisk.qty * weight;
      return { price: p.price, ratio: p.ratio, weight, position, notional: position * p.price };
    });
    return { avgPrice: dcaSummary.avgPrice, totalRatio: dcaSummary.totalRatio, batches };
  }, [form.dca_enabled, dcaSummary, plannedRisk.qty]);

  const computePnl = () => {
    const entry = num(form.actual_entry_price) ?? num(form.planned_entry_price) ?? num(journal?.planned_entry_price);
    const exit = num(form.actual_exit_price);
    const qty = num(form.actual_position_size) ?? num(form.planned_position_size) ?? num(journal?.planned_position_size);
    const fees = num(form.fees) || 0;
    const dir = journal?.direction;
    if (entry == null || exit == null || qty == null) return null;
    const gross = dir === 'long' ? (exit - entry) * qty : (entry - exit) * qty;
    const net = gross - fees;
    const plannedRiskAmt = Number.isFinite(plannedRisk.riskAmount) ? plannedRisk.riskAmount : num(journal?.planned_risk_amount);
    const rMultiple = plannedRiskAmt && plannedRiskAmt > 0 ? net / plannedRiskAmt : null;
    const eq = num(form.account_equity) ?? num(journal?.account_equity);
    const pct = eq && eq > 0 ? (net / eq) * 100 : null;
    return { pnlAmount: round(net), rMultiple: round(rMultiple), pnlPercent: round(pct) };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const computed = computePnl();
      const dcaEnabled = !!form.dca_enabled;
      const dcaBatches = dcaEnabled ? toDcaBatches(form.dca_batches) : [];
      const dcaAvg = dcaEnabled ? (computeDcaSummary(form.dca_batches)?.avgPrice ?? null) : null;
      const entryPrice = dcaEnabled ? dcaAvg : num(form.planned_entry_price);
      const patch = {
        platform: form.platform || null,
        planned_entry_price: entryPrice,
        planned_stop_price: num(form.planned_stop_price),
        planned_target_price: num(form.planned_target_price),
        planned_position_size: num(form.planned_position_size),
        position_input_type: form.position_input_type,
        dca_enabled: dcaEnabled,
        dca_batches: dcaBatches,
        account_equity: num(form.account_equity),
        setup_type: form.setup_type,
        trade_source: form.trade_source,
        trade_thesis: form.trade_thesis,
        actual_entry_price: num(form.actual_entry_price),
        actual_exit_price: num(form.actual_exit_price),
        actual_position_size: num(form.actual_position_size),
        opened_at: form.opened_at ? new Date(form.opened_at).toISOString() : null,
        closed_at: form.closed_at ? new Date(form.closed_at).toISOString() : null,
        fees: num(form.fees),
        execution_adherence: form.execution_adherence || null,
        execution_issues: form.execution_issues.split('\n').map((s) => s.trim()).filter(Boolean),
        what_went_well: form.what_went_well,
        what_to_improve: form.what_to_improve,
        trade_reason: form.trade_reason || null,
        trade_result: form.trade_result || null,
        error_summary: form.error_summary || null,
        emotion: form.emotion || null,
        would_take_again: form.would_take_again || null,
        lessons_learned: form.lessons_learned,
        next_action_rule: form.next_action_rule,
        status: form.status,
      };
      if (Number.isFinite(plannedRisk.riskAmount)) {
        patch.planned_risk_amount = round(plannedRisk.riskAmount);
        patch.planned_risk_percent = round(plannedRisk.riskPercent);
        patch.planned_reward_risk = round(plannedRisk.rr);
      }
      if (computed) {
        patch.pnl_amount = computed.pnlAmount;
        patch.pnl_percent = computed.pnlPercent;
        patch.r_multiple = computed.rMultiple;
      }
      const updated = await base44.entities.TradeJournal.update(id, patch);
      setJournal(updated);
      toast({ title: '已保存' });
    } catch (e) {
      toast({ title: '保存失败', description: (e && e.message) || '', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const shot = await base44.entities.TradeScreenshot.create({ trade_journal_id: id, screenshot_type: type, file_url, caption: '' });
      setScreenshots((s) => [...s, shot]);
      toast({ title: '截图已上传' });
    } catch (err) {
      toast({ title: '上传失败', description: (err && err.message) || '', variant: 'destructive' });
    }
  };

  const handleDeleteShot = async (shotId) => {
    try {
      await base44.entities.TradeScreenshot.delete(shotId);
      setScreenshots((s) => s.filter((x) => x.id !== shotId));
    } catch (err) { toast({ title: '删除失败', variant: 'destructive' }); }
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">加载中…</div>;
  if (!journal) return <div className="p-6 text-sm text-muted-foreground">未找到交易记录</div>;

  const dir = journal.direction === 'long' ? '做多' : '做空';
  const autoSources = ['position_monitor', 'exchange_fill', 'automatic'];
  const isAuto = autoSources.includes(journal.source);
  const isPosMonitor = journal.source === 'position_monitor';
  const computed = computePnl();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/journal')}><ArrowLeft className="w-4 h-4 mr-1" />返回列表</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-1" />{saving ? '保存中…' : '保存'}</Button>
      </div>

      <div className="border border-border rounded bg-card/30 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-heading text-foreground">{journal.symbol}</h1>
          <span className={`text-xs px-1.5 py-0.5 rounded-sm border ${journal.direction === 'long' ? 'text-success border-success/40 bg-success/10' : 'text-destructive border-destructive/40 bg-destructive/10'}`}>{dir}</span>
          {isAuto ? (
            <>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm border border-primary/40 bg-primary/10 text-primary">{isPosMonitor ? '持仓监控' : journal.source === 'exchange_fill' ? '成交同步' : '自动同步'}</span>
              {journal.platform && <span className="text-xs text-muted-foreground">{PLATFORM_LABEL[journal.platform] || journal.platform}</span>}
            </>
          ) : (
            <>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm border border-info/40 bg-info/10 text-info">手动记录</span>
              <span className="text-xs text-muted-foreground">{journal.market}</span>
              {journal.setup_type && <span className="text-xs text-muted-foreground">· {journal.setup_type}</span>}
            </>
          )}
        </div>

        {isAuto && (
          <div className="mt-3 border border-border/60 rounded bg-background/40 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Link2 className="w-3 h-3" />{isPosMonitor ? '持仓监控明细' : '成交明细 · 自动同步'}</div>
            {isPosMonitor ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                <InfoRow label="开仓时间" value={fmtTime(journal.opened_at)} />
                <InfoRow label="入场价格" value={fmtPriceRaw(journal.actual_entry_price)} />
                <InfoRow label="初始数量" value={fmtNum(journal.initial_quantity)} />
                <InfoRow label="当前数量" value={fmtNum(journal.current_quantity)} />
                <InfoRow label="名义价值" value={fmtNum(journal.trade_value)} />
                <InfoRow label="平仓时间" value={fmtTime(journal.closed_at)} />
                <InfoRow label="出场价格" value={fmtPriceRaw(journal.actual_exit_price)} />
                <InfoRow label="已实现盈亏" value={fmtNum(journal.pnl_amount)} className={(journal.pnl_amount ?? 0) >= 0 ? 'text-success' : 'text-destructive'} />
                <InfoRow label="关联账户" value={connection ? (connection.account_name || fmtAddr(connection.wallet_address)) : '—'} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                <InfoRow label="成交时间" value={fmtTime(journal.fill_time)} />
                <InfoRow label="成交价格" value={fmtPriceRaw(journal.fill_price)} />
                <InfoRow label="成交数量" value={fmtNum(journal.fill_quantity)} />
                <InfoRow label="成交价值" value={fmtNum(journal.trade_value)} />
                <InfoRow label="手续费" value={fmtNum(journal.fees)} />
                <InfoRow label="已实现盈亏" value={fmtNum(journal.pnl_amount)} className={(journal.pnl_amount ?? 0) >= 0 ? 'text-success' : 'text-destructive'} />
                <InfoRow label="杠杆" value={journal.leverage != null ? journal.leverage + '×' : '—'} />
                <InfoRow label="关联账户" value={connection ? (connection.account_name || fmtAddr(connection.wallet_address)) : '—'} />
              </div>
            )}
            {connection && (
              <div className="text-[10px] text-muted-foreground font-mono mt-2 truncate">
                {PLATFORM_LABEL[connection.platform] || connection.platform} · {fmtAddr(connection.wallet_address)}{connection.platform === 'lighter' && connection.lighter_account_index != null ? ` · index ${connection.lighter_account_index}` : ''}
              </div>
            )}
          </div>
        )}

        {!isAuto && (
          <div className="mt-3">
            <Field label="交易平台">
              <Input value={form.platform || ''} onChange={(e) => onForm({ platform: e.target.value })} className="h-8 text-xs" placeholder="如 Hyperliquid / Binance / A股" />
            </Field>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="计划开仓价"><Input type="number" value={form.planned_entry_price} onChange={(e) => onForm({ planned_entry_price: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="计划止损价"><Input type="number" value={form.planned_stop_price} onChange={(e) => onForm({ planned_stop_price: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="计划止盈价"><Input type="number" value={form.planned_target_price} onChange={(e) => onForm({ planned_target_price: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="计划仓位"><Input type="number" value={form.planned_position_size} onChange={(e) => onForm({ planned_position_size: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="账户权益"><Input type="number" value={form.account_equity} onChange={(e) => onForm({ account_equity: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="仓位口径">
            <div className="flex border border-border rounded-sm overflow-hidden h-8">
              {[{ v: 'quantity', l: '数量' }, { v: 'notional', l: '名义' }].map((o) => (
                <button key={o.v} type="button" onClick={() => onForm({ position_input_type: o.v })} className={`flex-1 text-xs ${form.position_input_type === o.v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
              ))}
            </div>
          </Field>
          <Field label="Setup"><Input value={form.setup_type} onChange={(e) => onForm({ setup_type: e.target.value })} className="h-8 text-xs" placeholder="如 突破回踩" /></Field>
          <Field label="交易来源"><Input value={form.trade_source} onChange={(e) => onForm({ trade_source: e.target.value })} className="h-8 text-xs" /></Field>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-4">
          <InfoRow label="计划风险金额" value={fmtNum(plannedRisk.riskAmount)} />
          <InfoRow label="计划风险比例" value={Number.isFinite(plannedRisk.riskPercent) ? plannedRisk.riskPercent.toFixed(2) + '%' : '—'} />
          <InfoRow label="计划盈亏比" value={Number.isFinite(plannedRisk.rr) ? plannedRisk.rr.toFixed(2) : '—'} />
          <InfoRow label="合规状态" value={journal.compliance_status === 'compliant' ? '符合' : journal.compliance_status === 'warning' ? '提醒' : journal.compliance_status === 'violation' ? '违规' : '未检查'} className={journal.compliance_status === 'compliant' ? 'text-success' : journal.compliance_status === 'violation' ? 'text-destructive' : journal.compliance_status === 'warning' ? 'text-warning' : ''} />
        </div>
        <div className="mt-3">
          <Field label="交易理由"><Textarea value={form.trade_thesis} onChange={(e) => onForm({ trade_thesis: e.target.value })} rows={2} className="text-xs" /></Field>
        </div>
        {journal.violations && journal.violations.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] text-destructive uppercase tracking-wider mb-1">违规项</div>
            {journal.violations.map((v, i) => <div key={i} className="text-xs text-destructive/90">• {v}</div>)}
          </div>
        )}
      </div>

      <div className="border border-border rounded bg-card/30 p-4 space-y-3">
        <div className="text-xs font-heading text-foreground uppercase tracking-wider">实际执行</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="实际开仓价"><Input type="number" value={form.actual_entry_price} onChange={(e) => onForm({ actual_entry_price: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="实际出场价"><Input type="number" value={form.actual_exit_price} onChange={(e) => onForm({ actual_exit_price: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="实际仓位"><Input type="number" value={form.actual_position_size} onChange={(e) => onForm({ actual_position_size: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="手续费"><Input type="number" value={form.fees} onChange={(e) => onForm({ fees: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="开仓时间"><Input type="datetime-local" value={form.opened_at} onChange={(e) => onForm({ opened_at: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="平仓时间"><Input type="datetime-local" value={form.closed_at} onChange={(e) => onForm({ closed_at: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="最大有利 R"><Input type="number" step="0.01" value={form.max_favorable_r} onChange={(e) => onForm({ max_favorable_r: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label="最大不利 R"><Input type="number" step="0.01" value={form.max_adverse_r} onChange={(e) => onForm({ max_adverse_r: e.target.value })} className="h-8 text-xs" /></Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
          <InfoRow label="盈亏金额" value={computed ? fmtNum(computed.pnlAmount) : '—'} className={(computed?.pnlAmount ?? 0) >= 0 ? 'text-success' : 'text-destructive'} />
          <InfoRow label="盈亏比例" value={computed?.pnlPercent != null ? computed.pnlPercent.toFixed(2) + '%' : '—'} className={(computed?.pnlAmount ?? 0) >= 0 ? 'text-success' : 'text-destructive'} />
          <InfoRow label="R 倍数" value={computed?.rMultiple != null ? computed.rMultiple.toFixed(2) + 'R' : '—'} className={(computed?.pnlAmount ?? 0) >= 0 ? 'text-success' : 'text-destructive'} />
        </div>
        <Field label="交易状态">
          <div className="flex border border-border rounded-sm overflow-hidden h-8 max-w-md">
            {STATUS_OPTIONS.map((o) => (
              <button key={o.v} type="button" onClick={() => onForm({ status: o.v })} className={`flex-1 text-xs ${form.status === o.v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
            ))}
          </div>
        </Field>
      </div>

      <div className="border border-border rounded bg-card/30 p-4 space-y-3">
        <div className="text-xs font-heading text-foreground uppercase tracking-wider">执行质量与复盘</div>
        <Field label="执行符合度">
          <div className="flex border border-border rounded-sm overflow-hidden h-8 max-w-md">
            {ADHERENCE_OPTIONS.map((o) => (
              <button key={o.v} type="button" onClick={() => onForm({ execution_adherence: o.v })} className={`flex-1 text-xs ${form.execution_adherence === o.v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
            ))}
          </div>
        </Field>
        <Field label="执行问题（每行一条）"><Textarea value={form.execution_issues} onChange={(e) => onForm({ execution_issues: e.target.value })} rows={2} className="text-xs" /></Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="做对了什么"><Textarea value={form.what_went_well} onChange={(e) => onForm({ what_went_well: e.target.value })} rows={3} className="text-xs" /></Field>
          <Field label="需要改进什么"><Textarea value={form.what_to_improve} onChange={(e) => onForm({ what_to_improve: e.target.value })} rows={3} className="text-xs" /></Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="交易原因"><Textarea value={form.trade_reason} onChange={(e) => onForm({ trade_reason: e.target.value })} rows={2} className="text-xs" /></Field>
          <Field label="交易结果"><Textarea value={form.trade_result} onChange={(e) => onForm({ trade_result: e.target.value })} rows={2} className="text-xs" /></Field>
          <Field label="错误总结"><Textarea value={form.error_summary} onChange={(e) => onForm({ error_summary: e.target.value })} rows={2} className="text-xs" /></Field>
        </div>
        <Field label="情绪状态">
          <div className="flex flex-wrap gap-2">
            {[{ v: 'calm', l: '冷静' }, { v: 'hesitant', l: '犹豫' }, { v: 'fomo', l: 'FOMO' }, { v: 'impatient', l: '急躁' }, { v: 'revenge', l: '复仇交易' }].map((o) => (
              <button key={o.v} type="button" onClick={() => onForm({ emotion: form.emotion === o.v ? '' : o.v })} className={`text-xs px-2.5 py-1.5 rounded border mobile-tap ${form.emotion === o.v ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="是否愿意再做一次">
            <div className="flex border border-border rounded-sm overflow-hidden h-8 max-w-xs">
              {[{ v: 'yes', l: '是' }, { v: 'no', l: '否' }, { v: 'unsure', l: '不确定' }].map((o) => (
                <button key={o.v} type="button" onClick={() => onForm({ would_take_again: o.v })} className={`flex-1 text-xs ${form.would_take_again === o.v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
              ))}
            </div>
          </Field>
          <Field label="经验教训"><Textarea value={form.lessons_learned} onChange={(e) => onForm({ lessons_learned: e.target.value })} rows={2} className="text-xs" /></Field>
        </div>
        <Field label="下一步行动规则"><Textarea value={form.next_action_rule} onChange={(e) => onForm({ next_action_rule: e.target.value })} rows={2} className="text-xs" /></Field>
      </div>

      <div className="border border-border rounded bg-card/30 p-4 space-y-3">
        <div className="text-xs font-heading text-foreground uppercase tracking-wider">交易截图</div>
        <div className="grid grid-cols-3 gap-2">
          {['before', 'during', 'after'].map((type) => (
            <label key={type} className="border border-dashed border-border rounded p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-accent/40 h-24">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{type === 'before' ? '入场前' : type === 'during' ? '持仓中' : '出场后'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, type)} />
            </label>
          ))}
          {screenshots.map((s) => (
            <div key={s.id} className="relative border border-border rounded overflow-hidden h-24 group">
              <img src={s.file_url} alt={s.screenshot_type} className="w-full h-full object-cover" />
              <button onClick={() => handleDeleteShot(s.id)} className="absolute top-1 right-1 bg-background/80 rounded p-0.5 opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button>
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1 py-0.5 text-[9px] text-muted-foreground">{s.screenshot_type === 'before' ? '入场前' : s.screenshot_type === 'during' ? '持仓中' : '出场后'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}