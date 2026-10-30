// 规则冲突引擎：根据全部答案计算冲突列表

function A(ctx, k) { return ctx.answers[k]; }
function arr(ctx, k) { return Array.isArray(ctx.answers[k]) ? ctx.answers[k] : []; }
function num(v) { return v === null || v === undefined || v === '' ? null : Number(v); }

// 解析百分比答案：'1%' -> 1，'自定义' -> 取 _custom 数值
function pct(ctx, key) {
  const v = ctx.answers[key];
  if (!v) return null;
  if (v === '自定义') {
    const c = num(ctx.answers[`${key}_custom`]);
    return c;
  }
  const m = String(v).match(/([\d.]+)%?/);
  return m ? Number(m[1]) : null;
}

function dependsOnProfile(ctx) { return ctx.profile || {}; }

export const COHERENCE_RULES = [
  {
    key: 'C01', severity: 'high', title: '盯盘时间不足，但选择高频交易风格',
    description: '每日实际盯盘时间少于 30 分钟，无法支持超短线或日内交易所需的实时监控与执行。',
    affectedSteps: ['1', '4'], recommendation: '改为波段或中长期风格，或增加可长期维持的盯盘时间。',
    check: (ctx) => { const p = dependsOnProfile(ctx); const holds = p.daily_screen_time === '少于 30 分钟' && (A(ctx, 's4_style') === '超短线' || A(ctx, 's4_style') === '日内交易'); return { holds, currentValues: `盯盘:${p.daily_screen_time || '—'} / 风格:${A(ctx, 's4_style') || '—'}` }; },
  },
  {
    key: 'C02', severity: 'medium', title: '盯盘 30–60 分钟，但选择超短线',
    description: '超短线交易需要更密集的盯盘与执行，30–60 分钟难以长期维持。',
    affectedSteps: ['1', '4'], recommendation: '改用更高时间周期的日内或波段策略。',
    check: (ctx) => { const p = dependsOnProfile(ctx); return { holds: p.daily_screen_time === '30–60 分钟' && A(ctx, 's4_style') === '超短线', currentValues: `盯盘:${p.daily_screen_time || '—'} / 风格:${A(ctx, 's4_style') || '—'}` }; },
  },
  {
    key: 'C03', severity: 'medium', title: '每周参与天数少，但选择高频过程目标',
    description: '每周仅 1–2 天参与，却选择需要频繁交易的过程目标，难以达成。',
    affectedSteps: ['1', '2'], recommendation: '调整过程目标为低频、高质量执行目标。',
    check: (ctx) => { const p = dependsOnProfile(ctx); const freq = ['连续完成 30 笔符合计划的交易', '连续完成 50 笔符合计划的交易', '每笔交易都完成记录', '每笔交易都严格执行止损']; return { holds: p.days_per_week === '1–2 天' && arr(ctx, 's2_process_goals').some((g) => freq.includes(g)), currentValues: `每周:${p.days_per_week || '—'} / 过程目标:${arr(ctx, 's2_process_goals').join('、') || '—'}` }; },
  },
  {
    key: 'C04', severity: 'high', title: '实盘经验不足，但使用高杠杆',
    description: '实盘不足 1 年或第一次建立计划，最大杠杆超过 5 倍，风险显著。',
    affectedSteps: ['1', '5'], recommendation: '将最大杠杆降至 5 倍以内，或先以无杠杆/低杠杆积累经验。',
    check: (ctx) => { const p = dependsOnProfile(ctx); const lev = num(A(ctx, 's5_max_leverage')); return { holds: (p.trading_experience === '第一次建立交易计划' || p.trading_experience === '实盘不足 1 年') && A(ctx, 's5_leverage_allowed') === '允许' && lev !== null && lev > 5, currentValues: `经验:${p.trading_experience || '—'} / 最大杠杆:${lev ?? '—'}` }; },
  },
  {
    key: 'C05', severity: 'high', title: '初次建立计划，但单笔风险超过 1%',
    description: '第一次建立交易计划时，单笔风险超过 1% 会放大新手亏损。',
    affectedSteps: ['1', '5'], recommendation: '将单笔风险控制在 1% 以内。',
    check: (ctx) => { const p = dependsOnProfile(ctx); const r = pct(ctx, 's5_per_trade_risk'); return { holds: p.trading_experience === '第一次建立交易计划' && r !== null && r > 1, currentValues: `经验:${p.trading_experience} / 单笔风险:${r}%` }; },
  },
  {
    key: 'C06', severity: 'high', title: '依靠交易收入生活，但账户停止线高于 20%',
    description: '依赖交易收入时，账户停止线过高会导致生活资金承受过大回撤。',
    affectedSteps: ['1', '2'], recommendation: '将账户停止线降至 20% 以内。',
    check: (ctx) => { const p = dependsOnProfile(ctx); const s = pct(ctx, 's2_stop_drawdown'); return { holds: p.income_dependency === '需要，计划依靠交易收入生活' && s !== null && s > 20, currentValues: `收入依赖:${p.income_dependency} / 停止线:${s}%` }; },
  },
  {
    key: 'C07', severity: 'high', title: '依靠交易收入生活，但不做周复盘',
    description: '依赖交易收入却无周复盘制度，难以及时发现并修正问题。',
    affectedSteps: ['1', '8'], recommendation: '建立固定周复盘制度。',
    check: (ctx) => { const p = dependsOnProfile(ctx); return { holds: p.income_dependency === '需要，计划依靠交易收入生活' && A(ctx, 's8_weekly_day') === '不做周复盘', currentValues: `收入依赖:${p.income_dependency} / 周复盘:${A(ctx, 's8_weekly_day') || '—'}` }; },
  },
  {
    key: 'C08', severity: 'high', title: '依靠交易收入生活，但没有连续亏损暂停机制',
    description: '依赖交易收入却无连续亏损暂停，容易在亏损中持续加码。',
    affectedSteps: ['1', '7'], recommendation: '设置连续亏损暂停规则。',
    check: (ctx) => { const p = dependsOnProfile(ctx); return { holds: p.income_dependency === '需要，计划依靠交易收入生活' && A(ctx, 's7_consecutive_pause') === '不按连续次数暂停', currentValues: `收入依赖:${p.income_dependency} / 连亏暂停:${A(ctx, 's7_consecutive_pause') || '—'}` }; },
  },
  {
    key: 'C09', severity: 'high', title: '单笔风险大于单日最大亏损',
    description: '单笔风险超过单日最大亏损，一笔交易即可触发日限，逻辑矛盾。',
    affectedSteps: ['5'], recommendation: '确保单笔风险小于单日最大亏损。',
    check: (ctx) => { const a = pct(ctx, 's5_per_trade_risk'); const b = pct(ctx, 's5_daily_loss'); return { holds: a !== null && b !== null && a > b, currentValues: `单笔:${a}% / 单日:${b}%` }; },
  },
  {
    key: 'C10', severity: 'medium', title: '单笔风险等于单日最大亏损',
    description: '单笔风险等于单日上限，一笔亏损即用尽当日风险额度，无缓冲。',
    affectedSteps: ['5'], recommendation: '单笔风险应明显小于单日最大亏损。',
    check: (ctx) => { const a = pct(ctx, 's5_per_trade_risk'); const b = pct(ctx, 's5_daily_loss'); return { holds: a !== null && b !== null && a === b, currentValues: `单笔:${a}% / 单日:${b}%` }; },
  },
  {
    key: 'C11', severity: 'high', title: '最大同时持仓总风险低于单笔风险',
    description: '总风险限制低于单笔风险，意味着无法开仓，配置矛盾。',
    affectedSteps: ['5'], recommendation: '总风险应大于或等于单笔风险。',
    check: (ctx) => { const a = pct(ctx, 's5_per_trade_risk'); const t = pct(ctx, 's5_max_total_risk'); return { holds: a !== null && t !== null && t < a, currentValues: `单笔:${a}% / 总风险:${t}%` }; },
  },
  {
    key: 'C12', severity: 'medium', title: '总风险低于单笔风险乘以最大仓位数',
    description: '最大总风险不足以容纳计划的最大同时持仓数量。',
    affectedSteps: ['5'], recommendation: '提高总风险上限，或减少最大仓位数量。',
    check: (ctx) => { const a = pct(ctx, 's5_per_trade_risk'); const t = pct(ctx, 's5_max_total_risk'); const n = num(A(ctx, 's5_max_positions')); return { holds: a !== null && t !== null && n !== null && t < a * n, currentValues: `单笔:${a}% × ${n} = ${a * n}% / 总风险:${t}%` }; },
  },
  {
    key: 'C13', severity: 'medium', title: '最大账户回撤设置为 30% 或以上',
    description: '账户回撤 30% 后，需要约 42.9% 的收益才能恢复到原始本金。',
    affectedSteps: ['5'], recommendation: '考虑将最大回撤设为更保守的水平。',
    check: (ctx) => { const d = pct(ctx, 's5_max_drawdown'); return { holds: d !== null && d >= 30, currentValues: `最大回撤:${d}%` }; },
  },
  {
    key: 'C14', severity: 'high', title: '使用期货或永续合约，但未设置最大杠杆',
    description: '交易期货或永续合约却未设定最大杠杆倍数，风险无上限。',
    affectedSteps: ['1', '3', '5'], recommendation: '为杠杆产品明确设置最大杠杆倍数。',
    check: (ctx) => { const p = dependsOnProfile(ctx); const mk = arr(ctx, 's3_markets'); const has = mk.includes('国内期货') || mk.includes('海外期货') || (p.account_types || []).includes('永续合约') || (p.account_types || []).includes('期货'); const lev = num(A(ctx, 's5_max_leverage')); return { holds: has && A(ctx, 's5_leverage_allowed') === '允许' && (lev === null || lev === undefined), currentValues: `市场:${mk.join('、')} / 杠杆:未设置` }; },
  },
  {
    key: 'C15', severity: 'high', title: '使用杠杆，但未定义强平安全距离',
    description: '允许使用杠杆却未定义止损与强平价之间的安全距离，存在强平风险。',
    affectedSteps: ['5'], recommendation: '设置明确的强平安全距离。',
    check: (ctx) => { const d = A(ctx, 's5_liquidation_distance'); return { holds: A(ctx, 's5_leverage_allowed') === '允许' && (!d || d === '不适用'), currentValues: `杠杆:允许 / 强平距离:${d || '未设置'}` }; },
  },
  {
    key: 'C16', severity: 'high', title: '全仓保证金同时允许高相关仓位',
    description: '全仓模式下持有多个高相关仓位，极端行情会同时触发强平。',
    affectedSteps: ['5'], recommendation: '在全仓模式下限制高相关仓位，或改为逐仓。',
    check: (ctx) => { return { holds: A(ctx, 's5_margin_mode') === '全仓' && A(ctx, 's5_correlation') === '不考虑相关性', currentValues: `保证金:${A(ctx, 's5_margin_mode')} / 相关性:${A(ctx, 's5_correlation')}` }; },
  },
  {
    key: 'C17', severity: 'high', title: '允许亏损加仓，但未填写完整 DCA 规则',
    description: '允许 DCA 却缺少加仓次数、比例、统一止损或失效条件。',
    affectedSteps: ['6'], recommendation: '补全 DCA 计划的全部字段。',
    check: (ctx) => { const allowed = A(ctx, 's6_dca_allowed'); const incomplete = allowed && allowed !== '完全禁止' && (!num(A(ctx, 's6_dca_max_adds')) || !(A(ctx, 's6_dca_proportion') || '').trim() || !(A(ctx, 's6_dca_stop') || '').trim() || !(A(ctx, 's6_dca_max_risk') || '').trim() || !(A(ctx, 's6_dca_invalidation') || '').trim()); return { holds: !!incomplete, currentValues: `DCA:${allowed || '—'}` }; },
  },
  {
    key: 'C18', severity: 'high', title: '允许扩大止损，但没有仓位缩减或重新计算风险要求',
    description: '允许扩大止损却无仓位缩减或重新计算风险约束，会放大亏损。',
    affectedSteps: ['6'], recommendation: '禁止扩大止损，或仅允许在仓位同步缩小时扩大。',
    check: (ctx) => { const w = A(ctx, 's6_widen_stop'); return { holds: w === '允许，但必须记录原因', currentValues: `扩大止损:${w}` }; },
  },
  {
    key: 'C19', severity: 'high', title: '止损不要求在开仓时设置',
    description: '未强制开仓同时设止损，存在裸仓风险。',
    affectedSteps: ['6'], recommendation: '要求止损必须在开仓时同时设置。',
    check: (ctx) => { const v = A(ctx, 's6_stop_with_entry'); return { holds: v && v !== '必须同时设置', currentValues: `止损设置:${v}` }; },
  },
  {
    key: 'C20', severity: 'medium', title: '允许观察名单外交易，但没有记录原因要求',
    description: '允许计划外交易却无记录要求，难以复盘与约束。',
    affectedSteps: ['3'], recommendation: '改为"允许，但必须记录原因"。',
    check: (ctx) => { const v = A(ctx, 's3_offlist_policy'); return { holds: v === '完成完整检查后允许', currentValues: `计划外标的:${v}` }; },
  },
  {
    key: 'C21', severity: 'medium', title: '允许重大新闻期间正常交易，但没有风险降低规则',
    description: '重大新闻期间正常交易却无风险降低，波动放大会扩大损失。',
    affectedSteps: ['3'], recommendation: '改为风险降低 50% 或禁止交易。',
    check: (ctx) => { const v = A(ctx, 's3_news_policy'); return { holds: v === '正常交易', currentValues: `新闻期间:${v}` }; },
  },
  {
    key: 'C22', severity: 'medium', title: '选择 24 小时加密市场，但没有具体交易时段限制',
    description: '仅选择 24 小时加密市场而无其他时段限制，容易过度交易。',
    affectedSteps: ['3'], recommendation: '增加具体交易时段限制。',
    check: (ctx) => { const t = arr(ctx, 's3_time_ranges'); return { holds: t.includes('24 小时加密市场') && t.length <= 1, currentValues: `时段:${t.join('、') || '—'}` }; },
  },
  {
    key: 'C23', severity: 'high', title: '选择多个心理问题，但缺少对应 If–Then 规则',
    description: '已识别心理问题却未为每个问题制定纪律规则。',
    affectedSteps: ['7'], recommendation: '为每个已识别问题填写 If–Then 规则。',
    check: (ctx) => { const issues = arr(ctx, 's7_issues').filter((i) => i !== '目前没有明显问题' && i !== '其他'); const missing = issues.find((i) => { const r = (ctx.psychRules || []).find((p) => p.issue_key === i); return !r || !(r.final_rule || '').trim(); }); return { holds: issues.length > 0 && !!missing, currentValues: `已识别:${issues.join('、') || '—'}` }; },
  },
  {
    key: 'C24', severity: 'high', title: '已承认报复性交易问题，但连续亏损后不暂停',
    description: '承认报复性交易却无连续亏损暂停机制，容易在亏损中失控。',
    affectedSteps: ['7'], recommendation: '设置连续亏损暂停规则。',
    check: (ctx) => { return { holds: arr(ctx, 's7_issues').includes('报复性交易') && A(ctx, 's7_consecutive_pause') === '不按连续次数暂停', currentValues: `问题:报复性交易 / 连亏暂停:${A(ctx, 's7_consecutive_pause') || '—'}` }; },
  },
  {
    key: 'C25', severity: 'high', title: '已承认扩大止损问题，同时允许扩大止损',
    description: '承认扩大止损是个人问题，却仍允许扩大止损，直接违背纪律。',
    affectedSteps: ['6', '7'], recommendation: '禁止扩大止损。',
    check: (ctx) => { const w = A(ctx, 's6_widen_stop'); return { holds: arr(ctx, 's7_issues').includes('扩大止损') && w && w !== '完全禁止', currentValues: `问题:扩大止损 / 扩大止损规则:${w}` }; },
  },
  {
    key: 'C26', severity: 'medium', title: '已承认群聊或 KOL 影响，但允许计划外交易且无需记录',
    description: '承认易受 KOL 影响，却允许无记录的计划外交易，纪律缺口。',
    affectedSteps: ['3', '7'], recommendation: '禁止计划外交易或要求记录原因。',
    check: (ctx) => { return { holds: arr(ctx, 's7_issues').includes('因群聊或 KOL 改变计划') && A(ctx, 's3_offlist_policy') === '完成完整检查后允许', currentValues: `问题:KOL 影响 / 计划外标的:${A(ctx, 's3_offlist_policy') || '—'}` }; },
  },
  {
    key: 'C27', severity: 'high', title: '交易优势尚未验证，但选择较高单笔风险',
    description: '优势未验证却使用较高单笔风险，亏损概率与幅度都不可控。',
    affectedSteps: ['4', '5'], recommendation: '在验证完成前将单笔风险降至 1% 以内。',
    check: (ctx) => { const r = pct(ctx, 's5_per_trade_risk'); return { holds: A(ctx, 's4_edge_verified') === '尚未验证' && r !== null && r > 1, currentValues: `优势验证:${A(ctx, 's4_edge_verified')} / 单笔风险:${r}%` }; },
  },
  {
    key: 'C28', severity: 'medium', title: '策略仍在验证阶段，但最低样本量低于 30 笔',
    description: '策略未完成验证，修改样本量过低会导致过早下结论。',
    affectedSteps: ['4', '8'], recommendation: '将最低样本量设为 30 笔以上。',
    check: (ctx) => { const v = A(ctx, 's8_min_sample_modify'); const low = v === '20 笔'; return { holds: A(ctx, 's4_edge_verified') === '仍在验证阶段' && low, currentValues: `优势验证:${A(ctx, 's4_edge_verified')} / 样本量:${v || '—'}` }; },
  },
  {
    key: 'C29', severity: 'medium', title: '最低盈亏比低于 1.5:1，且无胜率或策略验证说明',
    description: '低盈亏比策略需要较高胜率支撑，未验证时风险偏大。',
    affectedSteps: ['4'], recommendation: '提高最低盈亏比至 1.5:1 以上，或先完成策略验证。',
    check: (ctx) => { const rr = A(ctx, 's4_min_rr'); const verified = A(ctx, 's4_edge_verified'); return { holds: rr === '1:1' && verified !== '已完成充分回测和实盘验证', currentValues: `盈亏比:${rr} / 验证:${verified || '—'}` }; },
  },
  {
    key: 'C30', severity: 'medium', title: '不记录"是否遵守计划"，但心理纪律中选择了多个问题',
    description: '不记录遵守计划情况，无法评价执行质量与纪律改善。',
    affectedSteps: ['7', '8'], recommendation: '在交易记录中加入"是否遵守计划"字段。',
    check: (ctx) => { const issues = arr(ctx, 's7_issues').filter((i) => i !== '目前没有明显问题' && i !== '其他'); return { holds: issues.length > 0 && !arr(ctx, 's8_record_fields').includes('是否遵守计划'), currentValues: `心理问题:${issues.length} 个 / 记录遵守计划:否` }; },
  },
  {
    key: 'C31', severity: 'high', title: '不做日复盘、周复盘，也不做月度复盘',
    description: '完全没有复盘制度，无法从交易中学习与改进。',
    affectedSteps: ['8'], recommendation: '至少建立周复盘与月度复盘。',
    check: (ctx) => { return { holds: A(ctx, 's8_daily_review') === '不做日复盘' && A(ctx, 's8_weekly_day') === '不做周复盘' && A(ctx, 's8_monthly_mode') === '不做月度复盘', currentValues: `日:${A(ctx, 's8_daily_review')} / 周:${A(ctx, 's8_weekly_day')} / 月:${A(ctx, 's8_monthly_mode')}` }; },
  },
  {
    key: 'C32', severity: 'high', title: '允许策略在任何时间修改',
    description: '未限制修改时机，容易因短期盈亏频繁更改策略。',
    affectedSteps: ['8'], recommendation: '限制为仅在复盘时或达到样本量后修改。',
    check: (ctx) => { const t = arr(ctx, 's8_modify_timing'); const restrict = ['只在周度复盘时', '只在月度复盘时', '达到最低样本量后', '发生重大市场结构变化时', '触发账户停止线后']; return { holds: t.length > 0 && !t.some((x) => restrict.includes(x)), currentValues: `修改时机:${t.join('、') || '—'}` }; },
  },
  {
    key: 'C33', severity: 'low', title: '修改策略不要求保留旧版本',
    description: '不保留旧版本会丢失策略演进记录，难以回溯。',
    affectedSteps: ['8'], recommendation: '要求每次修改保留旧版本。',
    check: (ctx) => { return { holds: !arr(ctx, 's8_modify_rules').includes('必须保留旧版本'), currentValues: `修改规则:${arr(ctx, 's8_modify_rules').join('、') || '—'}` }; },
  },
  {
    key: 'C34', severity: 'medium', title: '依赖交易收入，同时设置激进年度收益目标',
    description: '依靠交易收入生活却设置较高收益目标，会放大心理压力与冒险倾向。',
    affectedSteps: ['1', '2'], recommendation: '降低或取消固定收益目标。',
    check: (ctx) => { const p = dependsOnProfile(ctx); const t = A(ctx, 's2_return_target_type'); const g = num(A(ctx, 's2_return_target')); return { holds: p.income_dependency === '需要，计划依靠交易收入生活' && t === '设置具体收益目标' && g !== null && g >= 20, currentValues: `收入依赖:${p.income_dependency} / 目标:${g}%` }; },
  },
  {
    key: 'C35', severity: 'high', title: '账户停止线高于最大回撤限制',
    description: '账户停止线高于最大回撤，停止线失去保护意义。',
    affectedSteps: ['2', '5'], recommendation: '账户停止线应低于或等于最大回撤限制。',
    check: (ctx) => { const s = pct(ctx, 's2_stop_drawdown'); const d = pct(ctx, 's5_max_drawdown'); return { holds: s !== null && d !== null && s > d, currentValues: `停止线:${s}% / 最大回撤:${d}%` }; },
  },
];

export function computeCoherence(ctx) {
  const out = [];
  for (const r of COHERENCE_RULES) {
    try {
      const res = r.check(ctx) || {};
      if (res.holds) {
        out.push({
          key: r.key, severity: r.severity, title: r.title, description: r.description,
          affectedSteps: r.affectedSteps, currentValues: res.currentValues || '', recommendation: r.recommendation,
        });
      }
    } catch (e) {
      // 单条规则异常不影响其它规则
    }
  }
  return out;
}