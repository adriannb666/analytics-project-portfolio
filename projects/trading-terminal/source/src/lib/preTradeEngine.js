// 交易前检查引擎：计划解析、风险计算、动态检查清单评估

import { parsePerTradeRisk, validateStopDirection, computeDcaSummary } from './positionCalc';
import { base44 } from '@/api/base44Client';

function num(v) {
  if (v === null || v === undefined || v === '') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function norm(s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); }

export function parseRR(answers) {
  const v = answers && answers['s4_min_rr'];
  if (v == null || v === '不使用固定盈亏比') return null;
  let raw = v;
  if (v === '自定义') raw = answers['s4_min_rr_custom'];
  const m = String(raw).match(/([\d.]+)\s*:\s*([\d.]+)/);
  if (m) { const a = num(m[1]); return Number.isFinite(a) ? a : null; }
  const n = num(raw);
  return Number.isFinite(n) ? n : null;
}

export function buildPlanSummary(ctx) {
  const { plan, answers, flags } = ctx || {};
  const maxRisk = parsePerTradeRisk(answers);
  const minRR = parseRR(answers);
  const levAllowed = answers && answers['s5_leverage_allowed'];
  const maxLev = levAllowed === '允许' ? num(answers['s5_max_leverage']) : NaN;
  const maxDaily = answers ? num(answers['s7_max_daily_trades']) : NaN;
  const highFlags = (flags || []).filter((f) => f.status === 'open' && f.severity === 'high').length;
  return {
    planName: plan?.plan_name || '我的交易计划',
    version: plan?.version || '—',
    status: plan?.status || '—',
    maxRisk,
    minRR,
    leverage: levAllowed === '不允许' ? '不允许' : (Number.isFinite(maxLev) ? maxLev + '×' : '—'),
    maxDaily: Number.isFinite(maxDaily) ? maxDaily : null,
    highFlags,
  };
}

export function computeRisk(form) {
  let e = num(form.planned_entry_price);
  // DCA 模式：用分批加权平均价作为开仓价
  if (form.dca_enabled) {
    const dca = computeDcaSummary(form.dca_batches);
    if (dca && Number.isFinite(dca.avgPrice)) e = dca.avgPrice;
  }
  const s = num(form.planned_stop_price),
    t = num(form.planned_target_price), sz = num(form.planned_position_size), eq = num(form.account_equity);
  if (!Number.isFinite(e) || !Number.isFinite(s) || !Number.isFinite(sz)) return { riskAmount: NaN, riskPercent: NaN, rr: NaN, notional: NaN, qty: NaN, entry: e };
  const priceRisk = Math.abs(e - s);
  let qty, notional;
  if (form.position_input_type === 'notional') { notional = sz; qty = e > 0 ? sz / e : NaN; }
  else { qty = sz; notional = sz * e; }
  const riskAmount = qty * priceRisk;
  const riskPercent = Number.isFinite(eq) && eq > 0 ? (riskAmount / eq) * 100 : NaN;
  const rr = Number.isFinite(t) ? Math.abs(t - e) / priceRisk : NaN;
  return { riskAmount, riskPercent, rr, notional, qty, entry: e };
}

export const CHECK_ITEMS = [
  { group: 'A', key: 'a_mkt_range', label: '当前市场属于计划允许范围', mode: 'auto' },
  { group: 'A', key: 'a_in_watchlist', label: '当前标的在观察名单内', mode: 'auto' },
  { group: 'A', key: 'a_session_ok', label: '当前处于允许交易时段', mode: 'manual' },
  { group: 'A', key: 'a_not_forbidden', label: '当前标的不属于禁止类别', mode: 'manual' },
  { group: 'A', key: 'a_offlist_reason', label: '计划外交易已填写原因', mode: 'auto' },
  { group: 'B', key: 'b_setup_allowed', label: '当前 Setup 属于计划允许策略', mode: 'auto' },
  { group: 'B', key: 'b_env_fit', label: '当前市场环境适合该策略', mode: 'manual' },
  { group: 'B', key: 'b_entry_triggered', label: '入场条件已经出现', mode: 'manual' },
  { group: 'B', key: 'b_invalidation_clear', label: '失效条件明确', mode: 'manual' },
  { group: 'B', key: 'b_min_rr', label: '最低盈亏比符合计划要求', mode: 'auto' },
  { group: 'C', key: 'c_stop_dir', label: '止损方向正确', mode: 'auto' },
  { group: 'C', key: 'c_risk_limit', label: '单笔风险未超过计划上限', mode: 'auto' },
  { group: 'C', key: 'c_leverage_limit', label: '杠杆未超过计划上限', mode: 'auto' },
  { group: 'C', key: 'c_rr_ok', label: '盈亏比符合计划要求', mode: 'auto' },
  { group: 'C', key: 'c_risk_state_ok', label: '当前风险状态允许开仓', mode: 'manual' },
  { group: 'C', key: 'c_total_risk', label: '最大同时持仓总风险', mode: 'manual' },
  { group: 'D', key: 'd_stop_with_entry', label: '开仓时会同步设置止损', mode: 'manual' },
  { group: 'D', key: 'd_no_widen_stop', label: '不会扩大止损', mode: 'manual' },
  { group: 'D', key: 'd_not_loss_add', label: '这不是未经计划的亏损加仓', mode: 'manual' },
  { group: 'D', key: 'd_not_chase', label: '这不是追价交易', mode: 'manual' },
  { group: 'D', key: 'd_news_confirmed', label: '重大新闻风险已经确认', mode: 'manual' },
  { group: 'D', key: 'd_slippage_ok', label: '订单和滑点符合计划', mode: 'manual' },
  { group: 'E', key: 'e_no_fomo', label: '当前没有 FOMO', mode: 'manual' },
  { group: 'E', key: 'e_no_revenge', label: '当前没有报复性交易冲动', mode: 'manual' },
  { group: 'E', key: 'e_no_revenge_std', label: '当前没有为了回本降低标准', mode: 'manual' },
  { group: 'E', key: 'e_emotion_ok', label: '当前情绪和注意力正常', mode: 'manual' },
  { group: 'E', key: 'e_no_win_inflate', label: '当前没有因为连续盈利而放大风险', mode: 'manual' },
  { group: 'E', key: 'e_thesis_indep', label: '交易理由并非完全来自群聊、KOL 或朋友', mode: 'manual' },
];

export const GROUP_META = {
  A: { name: '市场范围', weight: 20 },
  B: { name: '策略条件', weight: 25 },
  C: { name: '风险管理', weight: 30 },
  D: { name: '执行纪律', weight: 15 },
  E: { name: '心理状态', weight: 10 },
};

const PLAN_DEPENDENT = ['a_mkt_range', 'a_in_watchlist', 'a_offlist_reason', 'b_setup_allowed', 'b_min_rr', 'c_rr_ok', 'c_risk_limit', 'c_leverage_limit'];

function evalAuto(item, ctx, form, risk) {
  const { answers, watchlist } = ctx || {};
  const sym = norm(form.symbol);
  if (PLAN_DEPENDENT.includes(item.key) && !answers) return { status: 'pending', detail: '需要交易计划' };
  switch (item.key) {
    case 'a_mkt_range': {
      const markets = Array.isArray(answers && answers['s3_markets']) ? answers['s3_markets'] : [];
      const ok = markets.length > 0 && markets.some((m) => norm(m) === norm(form.market));
      return ok ? { status: 'pass', detail: '市场在计划允许范围内' } : { status: 'fail', detail: '当前市场不在计划允许范围内' };
    }
    case 'a_in_watchlist': {
      const wl = (watchlist || []).map((w) => norm(w.symbol));
      return wl.includes(sym) ? { status: 'pass', detail: '标的在观察名单内' } : { status: 'warn', detail: '标的不在观察名单内' };
    }
    case 'a_offlist_reason': {
      const wl = (watchlist || []).map((w) => norm(w.symbol));
      if (wl.includes(sym)) return { status: 'pass', detail: '计划内交易' };
      const policy = answers && answers['s3_offlist_policy'];
      if (policy === '完全禁止') return { status: 'fail', detail: '计划禁止交易观察名单以外的标的' };
      if (policy === '允许，但必须记录原因') return (form.trade_thesis || '').trim() ? { status: 'warn', detail: '计划外交易，已填写理由' } : { status: 'fail', detail: '计划外交易未填写理由' };
      return { status: 'warn', detail: '计划外交易' };
    }
    case 'b_setup_allowed': {
      const strats = Array.isArray(answers && answers['s4_strategies']) ? answers['s4_strategies'] : [];
      const ok = strats.length > 0 && strats.some((s) => norm(s).includes(norm(form.setup_type)) || norm(form.setup_type).includes(norm(s)));
      return ok ? { status: 'pass', detail: 'Setup 属于计划允许策略' } : { status: 'warn', detail: '当前 Setup 不在计划策略列表内' };
    }
    case 'b_min_rr':
    case 'c_rr_ok': {
      const minRR = parseRR(answers);
      if (!Number.isFinite(risk.rr)) return { status: 'pending', detail: '未设置止盈价，无法计算盈亏比' };
      if (minRR == null) return { status: 'pass', detail: '计划未设置最低盈亏比' };
      return risk.rr >= minRR ? { status: 'pass', detail: `盈亏比 ${risk.rr.toFixed(2)} ≥ ${minRR}` } : { status: 'warn', detail: `盈亏比 ${risk.rr.toFixed(2)} 低于目标 ${minRR}` };
    }
    case 'c_stop_dir': {
      const entry = Number.isFinite(risk.entry) ? risk.entry : num(form.planned_entry_price);
      const err = validateStopDirection(form.direction, entry, form.planned_stop_price);
      return err ? { status: 'fail', detail: err } : { status: 'pass', detail: '止损方向正确' };
    }
    case 'c_risk_limit': {
      const maxRisk = parsePerTradeRisk(answers);
      if (!Number.isFinite(risk.riskPercent)) return { status: 'pending', detail: '未提供账户权益或仓位，无法计算风险比例' };
      if (maxRisk == null) return { status: 'pass', detail: '计划未设置单笔风险上限' };
      return risk.riskPercent <= maxRisk ? { status: 'pass', detail: `风险比例 ${risk.riskPercent.toFixed(2)}% ≤ ${maxRisk}%` } : { status: 'fail', detail: `风险比例 ${risk.riskPercent.toFixed(2)}% 超过上限 ${maxRisk}%` };
    }
    case 'c_leverage_limit': {
      const levAllowed = answers && answers['s5_leverage_allowed'];
      const eq = num(form.account_equity);
      if (levAllowed === '不允许') {
        if (Number.isFinite(risk.notional) && Number.isFinite(eq) && eq > 0 && risk.notional > eq) return { status: 'fail', detail: '计划不允许杠杆，但名义仓位超过账户权益' };
        return { status: 'pass', detail: '计划不允许杠杆' };
      }
      const maxLev = num(answers && answers['s5_max_leverage']);
      if (!Number.isFinite(risk.notional) || !Number.isFinite(eq) || eq <= 0) return { status: 'pending', detail: '未提供账户权益，无法计算杠杆' };
      const lev = risk.notional / eq;
      if (!Number.isFinite(maxLev)) return { status: 'pass', detail: '计划未设置最大杠杆' };
      return lev <= maxLev ? { status: 'pass', detail: `杠杆 ${lev.toFixed(2)}× ≤ ${maxLev}×` } : { status: 'fail', detail: `杠杆 ${lev.toFixed(2)}× 超过上限 ${maxLev}×` };
    }
    default: return { status: 'pending', detail: '' };
  }
}

export function evaluateCheck(ctx, form, manualResults, todayCheckCount) {
  const risk = computeRisk(form);
  const answers = ctx && ctx.answers;
  const items = CHECK_ITEMS.map((it) => {
    let res;
    if (it.mode === 'auto') res = evalAuto(it, ctx, form, risk);
    else res = manualResults && manualResults[it.key] ? { status: manualResults[it.key] } : { status: 'pending' };
    return { ...it, status: res.status, detail: res.detail || '' };
  });
  const itemByKey = Object.fromEntries(items.map((i) => [i.key, i]));

  const violations = [];
  const warnings = [];
  const dcaForbidden = answers && answers['s6_dca_allowed'] === '完全禁止';
  const maxDaily = answers ? num(answers['s7_max_daily_trades']) : NaN;

  if (itemByKey['c_stop_dir'].status === 'fail') violations.push('止损方向错误');
  if (itemByKey['c_risk_limit'].status === 'fail') violations.push('单笔风险超过计划上限');
  if (itemByKey['c_leverage_limit'].status === 'fail') violations.push('杠杆超过计划上限');
  if (itemByKey['c_risk_state_ok'].status === 'fail') violations.push('已触发计划暂停状态');
  if (itemByKey['a_not_forbidden'].status === 'fail') violations.push('标的属于计划明确禁止类别');
  if (itemByKey['a_offlist_reason'].status === 'fail') violations.push('交易观察名单以外的标的（计划禁止）');
  if (itemByKey['d_not_loss_add'].status === 'fail' && dcaForbidden) violations.push('计划禁止亏损加仓，但当前为亏损加仓');
  if (itemByKey['e_no_revenge'].status === 'fail') violations.push('用户确认当前为报复性交易');
  if (itemByKey['d_stop_with_entry'].status === 'fail') violations.push('用户确认当前没有止损');
  if (Number.isFinite(maxDaily) && Number.isFinite(todayCheckCount) && todayCheckCount >= maxDaily) violations.push('已超过每日最大交易次数');

  if (itemByKey['a_in_watchlist'].status === 'warn') warnings.push('标的不在观察名单');
  if (['社群观点', 'KOL 或博主', '朋友建议'].includes(form.trade_source)) warnings.push('交易来源为群聊、KOL 或朋友');
  if (itemByKey['b_min_rr'].status === 'warn' || itemByKey['c_rr_ok'].status === 'warn') warnings.push('盈亏比略低于目标');
  const markets = Array.isArray(answers && answers['s3_markets']) ? answers['s3_markets'] : [];
  const primary = answers && answers['s3_primary_market'];
  if (primary && markets.some((m) => norm(m) === norm(form.market)) && norm(primary) !== norm(form.market)) warnings.push('在计划允许市场内，但不在主要市场');
  if (itemByKey['a_offlist_reason'].status === 'warn' && (form.trade_thesis || '').trim()) warnings.push('当前为计划外交易但已填写理由');
  items.filter((i) => i.mode === 'manual' && i.status === 'warn').forEach((i) => { if (!warnings.includes(i.label)) warnings.push(i.label); });

  const passed = items.filter((i) => i.status === 'pass').length;
  const warnCount = items.filter((i) => i.status === 'warn').length;
  const failCount = items.filter((i) => i.status === 'fail').length;

  let score = 0;
  ['A', 'B', 'C', 'D', 'E'].forEach((g) => {
    const gi = items.filter((i) => i.group === g && i.status !== 'pending');
    const ratio = gi.length > 0 ? gi.filter((i) => i.status === 'pass').length / gi.length : 0;
    score += GROUP_META[g].weight * ratio;
  });
  score = Math.round(score);

  let compliance = 'compliant';
  if (violations.length > 0) compliance = 'violation';
  else if (warnings.length > 0) compliance = 'warning';

  return { items, risk, violations, warnings, passedCount: passed, warningCount: warnCount, violationCount: failCount, consistencyScore: score, complianceStatus: compliance };
}

export async function loadPlanContext() {
  const plans = await base44.entities.TradingPlan.filter({}, '-updated_date', 1);
  const plan = plans && plans[0];
  if (!plan || !plan.id) return null;
  const [ansRecs, wl, fl] = await Promise.all([
    base44.entities.PlanAnswer.filter({ trading_plan_id: plan.id }, '-created_date', 300),
    base44.entities.WatchlistItem.filter({ trading_plan_id: plan.id }, 'sort_order', 200),
    base44.entities.CoherenceFlag.filter({ trading_plan_id: plan.id }, '-created_date', 100),
  ]);
  const answers = {};
  ansRecs.forEach((r) => { try { answers[r.question_key] = JSON.parse(r.answer_value); } catch (e) { answers[r.question_key] = r.answer_value; } });
  return { plan, answers, watchlist: wl, flags: fl };
}