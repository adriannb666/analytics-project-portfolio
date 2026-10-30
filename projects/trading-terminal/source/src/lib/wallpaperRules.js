// 从交易计划上下文提取并压缩核心规则，用于壁纸生成
// ctx 形如 { plan, profile, answers, watchlist, psychRules, flags }

function txt(v) {
  return v != null && String(v).trim() ? String(v).trim() : null;
}
function list(a) {
  return Array.isArray(a) && a.length ? a.join('、') : null;
}
function compress(s, n = 20) {
  const t = txt(s);
  if (!t) return null;
  const c = t.replace(/\s+/g, ' ').slice(0, n);
  return c.length < t.length ? c + '…' : c;
}

export function extractRules(ctx) {
  const answers = ctx.answers || {};
  const A = (k) => answers[k];
  const C = (k) => answers[`${k}_custom`];
  const pct = (k) => {
    const v = A(k);
    if (!v) return null;
    if (v === '自定义') {
      const c = C(k);
      return c != null && c !== '' ? `${c}%` : null;
    }
    return v;
  };

  const minRR = (() => {
    const v = A('s4_min_rr');
    if (!v) return null;
    if (v === '自定义') return C('s4_min_rr') || null;
    return v;
  })();

  const leverage = (() => {
    const v = A('s5_leverage_allowed');
    if (v === '允许') {
      const m = A('s5_max_leverage');
      return m ? `≤ ${m} 倍` : '允许';
    }
    if (v === '不允许') return '不使用杠杆';
    return null;
  })();

  const scope = [
    { label: '主要市场', value: txt(A('s3_primary_market')) },
    { label: '主要策略', value: list(A('s4_strategies')) },
    { label: '合格 Setup', value: compress(A('s4_setup_conditions'), 18) },
    { label: '最低盈亏比', value: minRR, highlight: true },
  ].filter((r) => r.value);

  const risk = [
    { label: '单笔风险', value: (() => { const v = pct('s5_per_trade_risk'); return v ? `≤ ${v}` : null; })(), highlight: true },
    { label: '单日最大亏损', value: (() => { const v = pct('s5_daily_loss'); return v ? `≤ ${v}` : null; })(), highlight: true },
    { label: '单周最大亏损', value: (() => { const v = pct('s5_weekly_loss'); return v ? `≤ ${v}` : null; })() },
    { label: '最大回撤', value: (() => { const v = pct('s5_max_drawdown'); return v ? `≤ ${v}` : null; })(), highlight: true },
    { label: '最大总风险', value: (() => { const v = pct('s5_max_total_risk'); return v ? `≤ ${v}` : null; })() },
    { label: '最大持仓数', value: txt(A('s5_max_positions')) },
    { label: '杠杆上限', value: leverage },
  ].filter((r) => r.value);

  const exec = [
    { label: '止损', value: A('s6_stop_with_entry') === '必须同时设置' ? '开仓同步带止损' : null },
    { label: '扩大止损', value: A('s6_widen_stop') === '完全禁止' ? '禁止扩大' : compress(A('s6_widen_stop'), 12) },
    { label: 'TP1 后', value: compress(A('s6_tp1_handling'), 14) },
    { label: '加仓', value: compress(A('s6_add_position'), 12) },
    { label: 'DCA', value: compress(A('s6_dca_allowed'), 12) },
  ].filter((r) => r.value);

  const consec = (() => {
    const v = A('s7_consecutive_pause');
    if (!v) return null;
    if (v === '自定义') { const c = C('s7_consecutive_pause'); return c ? `${c} 次 → 暂停` : null; }
    if (v === '不按连续次数暂停') return '不按次数暂停';
    return `${String(v).replace(' 次', '')} 次 → 暂停`;
  })();
  const dailyTrades = (() => { const v = A('s7_max_daily_trades'); return v ? `${v} 笔` : null; })();
  const issues = Array.isArray(A('s7_issues')) ? A('s7_issues') : [];
  const kolRule = issues.includes('因群聊或 KOL 改变计划') ? '不可直接开仓' : null;

  const discipline = [
    { label: '连续亏损', value: consec, highlight: true },
    { label: '每日交易', value: dailyTrades },
    { label: '重大新闻', value: compress(A('s3_news_policy'), 14) },
    { label: '群聊/KOL', value: kolRule },
  ].filter((r) => r.value);

  // 三条最重要的禁止事项
  const cand = [];
  const add = (s) => { if (s && !cand.includes(s)) cand.push(s); };
  if (A('s6_widen_stop') === '完全禁止') add('禁止扩大止损');
  if (A('s6_stop_with_entry') === '必须同时设置') add('禁止无止损持仓');
  if (A('s6_add_position') === '不允许') add('禁止加仓');
  else if (A('s6_add_position') === '只允许浮盈加仓') add('禁止亏损加仓');
  if (A('s3_offlist_policy') === '完全禁止') add('禁止计划外交易');
  if (A('s3_news_policy') === '完全禁止') add('重大新闻前禁开新仓');
  if (issues.includes('因群聊或 KOL 改变计划')) add('禁止因群聊/KOL 改计划');
  if (A('s5_consecutive_loss') === '直接暂停交易') add('连续亏损后暂停交易');
  const pool = [
    consec ? '连续亏损后暂停并复盘' : null,
    A('s6_stop_with_entry') === '必须同时设置' ? '开仓必须带止损' : null,
    A('s6_widen_stop') === '完全禁止' ? '不得扩大止损' : null,
    dailyTrades ? `每日最多 ${dailyTrades}` : null,
    kolRule ? '群聊观点不可直接开仓' : null,
  ].filter(Boolean);
  for (const p of pool) { if (cand.length >= 3) break; add(p); }
  const prohibitions = cand.slice(0, 3);

  const highOpen = (ctx.flags || []).filter((f) => f.status === 'open' && f.severity === 'high').length;

  const bottomLines = [
    '先执行规则，再评价结果',
    '好交易不等于盈利，坏交易不等于亏损',
    '风险先行，机会其次',
    '计划优先，情绪靠后',
    '先保护本金，再追求收益',
  ];
  const bottomLine = bottomLines[Math.floor(Math.random() * bottomLines.length)];

  return {
    bottomLines,
    planName: txt(ctx.plan && ctx.plan.plan_name) || '我的交易计划',
    version: txt(ctx.plan && ctx.plan.version) || 'v1.0',
    generatedDate: new Date(),
    scope,
    risk,
    exec,
    discipline,
    prohibitions,
    highOpen,
    bottomLine,
    sufficient: risk.length > 0,
  };
}