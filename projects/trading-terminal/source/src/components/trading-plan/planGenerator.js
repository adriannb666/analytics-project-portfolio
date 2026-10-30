// 将问卷答案转换为正式交易规则文本

function A(ctx, k) { return ctx.answers[k]; }
function C(ctx, k) { return ctx.answers[`${k}_custom`]; }
function arr(ctx, k) { return Array.isArray(ctx.answers[k]) ? ctx.answers[k] : []; }
function pctVal(ctx, key) {
  const v = ctx.answers[key];
  if (!v) return null;
  if (v === '自定义') return C(ctx, key) != null && C(ctx, key) !== '' ? `${C(ctx, key)}%` : '—';
  return v;
}
function list(arr, empty = '—') { return arr && arr.length ? arr.join('、') : empty; }
function txt(v, empty = '—') { return v && String(v).trim() ? String(v).trim() : empty; }

function fmtDate(d) { try { return new Date(d).toLocaleString('zh-CN', { hour12: false }); } catch { return '—'; } }

export function generateFullPlan(ctx) {
  const { plan, profile, answers, watchlist, psychRules, flags } = ctx;
  const p = profile || {};
  const L = [];
  const now = new Date().toISOString();

  L.push(`# ${plan?.plan_name || '我的交易计划'}`);
  L.push('');
  L.push(`- 姓名：${txt(plan?.owner_name)}`);
  L.push(`- 版本：${plan?.version || 'v1.0'}`);
  L.push(`- 计划状态：${plan?.status || 'draft'}`);
  L.push(`- 创建日期：${fmtDate(plan?.created_date)}`);
  L.push(`- 最近更新：${fmtDate(plan?.updated_date)}`);
  L.push('');

  L.push('## 第一章 计划说明');
  L.push('');
  L.push('- 本计划基于用户本人选择的规则生成，不构成投资建议。');
  L.push('- 用户必须自行验证和测试本计划中的所有规则。');
  L.push('- 本计划需要持续复盘和修改，不得在未复盘前因短期盈亏频繁更改。');
  L.push('');

  L.push('## 第二章 交易者画像');
  L.push('');
  L.push(`- 交易经验：${txt(p.trading_experience)}`);
  L.push(`- 每日可长期维持的盯盘时间：${txt(p.daily_screen_time)}`);
  L.push(`- 每周可参与天数：${txt(p.days_per_week)}`);
  L.push(`- 可稳定参与时段：${list(p.available_sessions)}`);
  L.push(`- 资金规模区间：${txt(p.preferred_currency)} ${txt(p.capital_bracket)}`);
  L.push(`- 是否依赖交易收入：${txt(p.income_dependency)}`);
  L.push(`- 账户与产品类型：${list(p.account_types)}${p.account_types?.includes('其他') ? `（${txt(p.other_account_type)}）` : ''}`);
  L.push('');
  L.push(`上述条件决定本计划的节奏、风险强度与执行要求。交易方式与风险规则必须与这些现实条件匹配，不得在条件不足时强行提高强度。${p.income_dependency === '需要，计划依靠交易收入生活' ? '由于交易收入承担生活成本，本计划对停止线、连续亏损暂停与风险缩减采用更严格标准，生活支出压力不得成为提高风险、增加交易次数或降低入场标准的理由。' : ''}`);
  L.push('');

  L.push('## 第三章 目标与预期');
  L.push('');
  L.push(`- 主要交易目的：${(() => { const a = arr(ctx, 's2_purpose'); return list(a); })()}`);
  L.push(`- 12 个月成功定义：${txt(A(ctx, 's2_success'))}`);
  L.push(`- 核心过程目标：${list(arr(ctx, 's2_process_goals'))}`);
  L.push(`- 最低评价样本量：${(() => { const v = A(ctx, 's2_sample_size'); return v === '自定义' ? `${C(ctx, 's2_sample_size')} 笔` : txt(v); })()}`);
  L.push(`- 账户停止线：${(() => { const v = pctVal(ctx, 's2_stop_drawdown'); return v && v !== '—' ? `当账户总回撤达到 ${v} 时，必须暂停整个交易计划并重新评估。该停止线为账户级保护，不因市场机会或回本需求而突破。` : '—'; })()}`);
  const rt = A(ctx, 's2_return_target_type');
  let rtLine = '不设置固定收益目标。收益以过程目标和风险控制为主，不以收益数字强迫交易。';
  if (rt === '设置收益区间') rtLine = `设置年度收益区间为 ${A(ctx, 's2_return_low') ?? '—'}% 至 ${A(ctx, 's2_return_high') ?? '—'}%。该目标仅为参考，不是市场承诺，不得为了达到目标降低交易标准或增加风险。`;
  else if (rt === '设置具体收益目标') rtLine = `设置年度收益目标为 ${A(ctx, 's2_return_target') ?? '—'}%。该目标仅为参考，不是市场承诺，不得为了达到目标降低交易标准或增加风险。`;
  L.push(`- 收益目标：${rtLine}`);
  const wd = A(ctx, 's2_withdrawal');
  let wdLine = '不进行定期提款，利润保留在账户中作为风险缓冲。';
  if (wd && wd !== '不提款') wdLine = `提款规则：${wd === '自定义' ? C(ctx, 's2_withdrawal') || '—' : wd}。具体规则：${txt(A(ctx, 's2_withdrawal_rule'))}。`;
  L.push(`- 提款规则：${wdLine}`);
  L.push('');

  L.push('## 第四章 市场范围与观察名单');
  L.push('');
  L.push(`- 允许交易市场：${list(arr(ctx, 's3_markets'))}`);
  L.push(`- 主要交易市场：${txt(A(ctx, 's3_primary_market'))}`);
  L.push(`- 观察名单上限：${(() => { const v = A(ctx, 's3_max_watchlist'); return v === '自定义' ? `${C(ctx, 's3_max_watchlist')} 个` : txt(v); })()}`);
  L.push(`- 观察名单调整频率：${txt(A(ctx, 's3_adjust_freq'))}`);
  const wl = watchlist || [];
  if (wl.length) {
    L.push('');
    L.push('**当前观察名单：**');
    L.push('');
    L.push('| 代码 | 名称 | 市场 | 备注 |');
    L.push('| --- | --- | --- | --- |');
    wl.forEach((w) => L.push(`| ${w.symbol} | ${w.name || '—'} | ${w.market || '—'} | ${w.notes || '—'} |`));
  }
  L.push('');
  const off = A(ctx, 's3_offlist_policy');
  L.push(`- 计划外标的规则：${(() => { if (off === '完全禁止') return '完全禁止交易观察名单以外的标的，任何计划外机会均不构成可执行交易。'; if (off === '允许，但必须记录原因') return '允许交易观察名单以外标的，但必须在交易前记录原因，并在复盘中单独评价。'; return '只有在完成完整交易前检查后才允许交易观察名单以外标的。'; })()}`);
  L.push(`- 禁止交易类别：${txt(A(ctx, 's3_forbidden'))}`);
  const news = A(ctx, 's3_news_policy');
  L.push(`- 重大新闻与事件风险：${(() => { if (news === '完全禁止') return '重大新闻、财报或经济数据公布前后完全禁止新建仓位。'; if (news === '只允许减仓或平仓') return '重大新闻公布前后只允许减仓或平仓，不得新建仓位。'; if (news === '允许，但风险降低 50%') return '允许在重大新闻期间交易，但单笔风险必须降低 50%。'; if (news === '正常交易') return '允许在重大新闻期间正常交易（注意：本规则未设置风险降低，存在较高风险）。'; return '根据策略单独规定重大新闻期间的处理方式。'; })()}`);
  L.push(`- 允许交易时段：${list(arr(ctx, 's3_time_ranges'))}`);
  L.push('');

  L.push('## 第五章 策略与优势');
  L.push('');
  L.push(`- 交易风格：${txt(A(ctx, 's4_style'))}`);
  L.push(`- 策略类型：${list(arr(ctx, 's4_strategies'))}`);
  L.push(`- 大方向周期：${txt(A(ctx, 's4_trend_tf'))}`);
  L.push(`- 市场结构周期：${txt(A(ctx, 's4_structure_tf'))}`);
  L.push(`- 入场触发周期：${txt(A(ctx, 's4_entry_tf'))}`);
  L.push(`- 合格 Setup 条件：${txt(A(ctx, 's4_setup_conditions'))}`);
  L.push(`- 交易逻辑失效条件：${txt(A(ctx, 's4_invalidation'))}`);
  L.push(`- 最低盈亏比：${(() => { const v = A(ctx, 's4_min_rr'); return v === '自定义' ? C(ctx, 's4_min_rr') || '—' : txt(v); })()}`);
  L.push(`- 适用市场环境：${list(arr(ctx, 's4_best_env'))}`);
  L.push(`- 禁止使用环境：${list(arr(ctx, 's4_forbidden_env'))}`);
  L.push(`- 优势来源：${list(arr(ctx, 's4_edge_source'))}`);
  L.push(`- 优势验证状态：${txt(A(ctx, 's4_edge_verified'))}`);
  L.push('');

  L.push('## 第六章 风险与资金管理');
  L.push('');
  const ptr = pctVal(ctx, 's5_per_trade_risk');
  L.push(`- 单笔最大风险：${ptr && ptr !== '—' ? `每笔交易的计划亏损不得超过当前账户权益的 ${ptr}。该比例以初始止损被触发后的预计损失计算，不代表名义仓位价值或保证金占用。止损距离扩大时，仓位必须相应缩小。` : '—'}`);
  const dl = pctVal(ctx, 's5_daily_loss');
  L.push(`- 单日最大亏损：${dl && dl !== '—' ? `当日累计已实现亏损达到当前账户权益的 ${dl} 后，当天不得再建立新仓位。该限制不因主观判断、市场机会或回本需求而改变。` : '—'}`);
  L.push(`- 单周最大亏损：${pctVal(ctx, 's5_weekly_loss') || '—'}`);
  L.push(`- 最大账户回撤：${pctVal(ctx, 's5_max_drawdown') || '—'}`);
  L.push(`- 最大同时持仓总风险：${pctVal(ctx, 's5_max_total_risk') || '—'}`);
  L.push(`- 最大同时持仓数量：${txt(A(ctx, 's5_max_positions'))}`);
  L.push(`- 仓位计算方法：${(() => { const v = A(ctx, 's5_sizing_method'); return v === '自定义' ? C(ctx, 's5_sizing_method') || '—' : txt(v); })()}`);
  if (A(ctx, 's5_leverage_allowed') === '允许') {
    L.push(`- 杠杆限制：允许使用杠杆，最大 ${txt(A(ctx, 's5_max_leverage'))} 倍。`);
    L.push(`- 保证金模式：${txt(A(ctx, 's5_margin_mode'))}；交叉保证金：${txt(A(ctx, 's5_cross_margin'))}。`);
    L.push(`- 强平安全距离：止损与预计强平价格之间至少保留 ${pctVal(ctx, 's5_liquidation_distance') || '—'}。`);
  } else {
    L.push('- 杠杆限制：不允许使用杠杆。');
  }
  L.push(`- 连续亏损调整：${(() => { const v = A(ctx, 's5_consecutive_loss'); return v === '自定义' ? C(ctx, 's5_consecutive_loss') || '—' : txt(v); })()}`);
  L.push('- 账户风险状态：');
  L.push(`  - 正常：使用标准风险。`);
  L.push(`  - 谨慎（风险降低 50%）：${txt(A(ctx, 's5_risk_cautious'))}`);
  L.push(`  - 恢复（风险降低 75%）：${txt(A(ctx, 's5_risk_recovery'))}`);
  L.push(`  - 暂停（禁止新开仓）：${txt(A(ctx, 's5_risk_pause'))}`);
  L.push(`  - 恢复正常条件：${txt(A(ctx, 's5_risk_resume'))}`);
  L.push(`- 相关性限制：${(() => { const v = A(ctx, 's5_correlation'); return v === '自定义' ? C(ctx, 's5_correlation') || '—' : txt(v); })()}`);
  L.push(`- 补充资金规则：${(() => { const v = A(ctx, 's5_add_funds'); return v === '自定义' ? C(ctx, 's5_add_funds') || '—' : txt(v); })()}`);
  L.push('');

  L.push('## 第七章 执行与持仓管理');
  L.push('');
  L.push(`- 允许订单类型：${list(arr(ctx, 's6_order_types'))}`);
  const swe = A(ctx, 's6_stop_with_entry');
  L.push(`- 止损设置：${swe === '必须同时设置' ? '止损必须在开仓时同时设置，不得持有无止损仓位。' : txt(swe)}`);
  const ws = A(ctx, 's6_widen_stop');
  L.push(`- 扩大止损规则：${(() => { if (ws === '完全禁止') return '交易建立后，不得将止损向扩大亏损的方向移动。当交易逻辑失效时，应按照原始止损退出，不得通过修改止损延迟承认错误。'; return txt(ws); })()}`);
  L.push(`- 止盈方式：${list(arr(ctx, 's6_tp_methods'))}`);
  L.push(`- TP1 后处理：${(() => { const v = A(ctx, 's6_tp1_handling'); return v === '自定义' ? C(ctx, 's6_tp1_handling') || '—' : txt(v); })()}`);
  const ap = A(ctx, 's6_add_position');
  L.push(`- 加仓规则：${(() => { if (ap === '只允许浮盈加仓') return '加仓只能发生在已有仓位处于浮盈状态，且新增仓位符合独立入场条件的情况下。加仓后总风险不得超过计划规定的最大同时持仓风险。'; return ap === '自定义' ? C(ctx, 's6_add_position') || '—' : txt(ap); })()}`);
  const dca = A(ctx, 's6_dca_allowed');
  if (dca && dca !== '完全禁止') {
    L.push(`- DCA 规则：${dca}。最大加仓次数 ${txt(A(ctx, 's6_dca_max_adds'))}，每次加仓比例 ${txt(A(ctx, 's6_dca_proportion'))}，最大总风险 ${txt(A(ctx, 's6_dca_max_risk'))}。`);
    L.push(`  - 最终统一止损规则：${txt(A(ctx, 's6_dca_stop'))}`);
    L.push(`  - 失效条件：${txt(A(ctx, 's6_dca_invalidation'))}`);
  } else {
    L.push(`- DCA 规则：${txt(dca)}`);
  }
  L.push(`- 滑点上限：${(() => { const v = A(ctx, 's6_max_slippage'); return v === '自定义' ? C(ctx, 's6_max_slippage') || '—' : txt(v); })()}`);
  L.push(`- 隔夜持仓：${txt(A(ctx, 's6_overnight'))}`);
  L.push(`- 周末持仓：${txt(A(ctx, 's6_weekend'))}`);
  L.push(`- 重大消息前已有仓位：${txt(A(ctx, 's6_news_existing'))}`);
  L.push(`- 故障与极端行情应急：${txt(A(ctx, 's6_emergency'))}`);
  L.push(`- 手动提前平仓：${(() => { const v = A(ctx, 's6_manual_close'); return v === '自定义' ? C(ctx, 's6_manual_close') || '—' : txt(v); })()}`);
  L.push('');

  L.push('## 第八章 心理与纪律协议');
  L.push('');
  const issues = arr(ctx, 's7_issues').filter((i) => i !== '目前没有明显问题' && i !== '其他');
  L.push(`- 已识别心理问题：${issues.length ? issues.join('、') : '目前没有明显问题'}`);
  if (issues.length) {
    L.push('');
    L.push('**If–Then 纪律规则：**');
    L.push('');
    issues.forEach((i) => {
      const r = (psychRules || []).find((pr) => pr.issue_key === i);
      L.push(`- **${i}**（严重程度：${r?.severity || '—'}）`);
      L.push(`  - ${txt(r?.final_rule)}`);
    });
  }
  L.push('');
  L.push(`- 连续亏损暂停：${(() => { const v = A(ctx, 's7_consecutive_pause'); return v === '自定义' ? `${C(ctx, 's7_consecutive_pause')} 次后暂停` : txt(v); })()}`);
  L.push(`- 暂停时长：${(() => { const v = A(ctx, 's7_pause_duration'); return v === '自定义' ? C(ctx, 's7_pause_duration') || '—' : txt(v); })()}`);
  L.push(`- 恢复交易要求：${list(arr(ctx, 's7_resume_requirements'))}`);
  L.push(`- 每日最大新交易次数：${txt(A(ctx, 's7_max_daily_trades'))}`);
  L.push(`- 连胜后风险限制：${(() => { const v = A(ctx, 's7_winrisk'); return v === '自定义' ? C(ctx, 's7_winrisk') || '—' : txt(v); })()}`);
  L.push(`- 疲劳与生活事件处理：${txt(A(ctx, 's7_fatigue'))}`);
  L.push('');

  L.push('## 第九章 记录与复盘制度');
  L.push('');
  L.push(`- 每笔交易记录字段：${list(arr(ctx, 's8_record_fields'))}`);
  L.push(`- 日复盘：${txt(A(ctx, 's8_daily_review'))}`);
  L.push(`- 周复盘：${txt(A(ctx, 's8_weekly_day'))}${A(ctx, 's8_weekly_day') && A(ctx, 's8_weekly_day') !== '不做周复盘' ? ` ${txt(A(ctx, 's8_weekly_time'))}` : ''}`);
  L.push(`- 月度复盘：${txt(A(ctx, 's8_monthly_mode'))}${A(ctx, 's8_monthly_mode') === '每月固定日期' ? ` ${txt(A(ctx, 's8_monthly_day'))} 日 ${txt(A(ctx, 's8_monthly_time'))}` : (A(ctx, 's8_monthly_mode') && A(ctx, 's8_monthly_mode') !== '不做月度复盘' ? ` ${txt(A(ctx, 's8_monthly_time'))}` : '')}`);
  L.push(`- 复盘核心指标：${list(arr(ctx, 's8_review_metrics'))}`);
  L.push(`- 修改策略最低样本量：${(() => { const v = A(ctx, 's8_min_sample_modify'); return v === '自定义' ? `${C(ctx, 's8_min_sample_modify')} 笔` : txt(v); })()}`);
  L.push(`- 计划修改时机：${list(arr(ctx, 's8_modify_timing'))}`);
  L.push(`- 修改规则：${list(arr(ctx, 's8_modify_rules'))}`);
  L.push(`- 交易质量评价方式：${list(arr(ctx, 's8_trade_eval'))}`);
  L.push(`- 提示：盈利交易不一定是好交易，亏损交易也不一定是坏交易，是否遵守计划应单独评价。`);
  L.push('');

  L.push('## 第十章 待处理事项');
  L.push('');
  const openFlags = (flags || []).filter((f) => f.status === 'open' || f.status === 'accepted');
  if (!openFlags.length) {
    L.push('当前没有未解决的规则冲突。');
  } else {
    L.push('以下为尚未解决或用户选择保留的规则冲突，视为本计划的待处理事项或风险声明：');
    L.push('');
    openFlags.forEach((f) => {
      L.push(`- **[${f.severity.toUpperCase()}] ${f.title}**`);
      L.push(`  - 说明：${f.description}`);
      L.push(`  - 当前值：${f.current_values || '—'}`);
      L.push(`  - 建议：${f.recommendation}`);
      if (f.status === 'accepted') L.push(`  - 用户选择保留${f.accepted_reason ? `，理由：${f.accepted_reason}` : ''}。`);
    });
  }
  L.push('');

  L.push('## 第十一章 用户确认');
  L.push('');
  L.push('本计划中的所有规则均由用户本人选择。用户理解交易存在重大亏损风险，并承担执行、验证和修改本计划的全部责任。');
  L.push('');

  return L.join('\n');
}

export function generateDeskCard(ctx) {
  const { plan, answers } = ctx;
  const ptr = pctVal(ctx, 's5_per_trade_risk');
  const L = [];
  L.push(`# ${plan?.plan_name || '我的交易计划'} · 核心规则卡`);
  L.push('');
  L.push(`- 主要市场：${txt(A(ctx, 's3_primary_market'))}`);
  L.push(`- 允许交易时段：${list(arr(ctx, 's3_time_ranges'))}`);
  L.push(`- 主要策略：${list(arr(ctx, 's4_strategies'))}`);
  L.push(`- 合格 Setup 核心：${txt(A(ctx, 's4_setup_conditions'))}`);
  L.push(`- 单笔最大风险：${ptr || '—'}`);
  L.push(`- 单日最大亏损：${pctVal(ctx, 's5_daily_loss') || '—'}`);
  L.push(`- 单周最大亏损：${pctVal(ctx, 's5_weekly_loss') || '—'}`);
  L.push(`- 最大回撤：${pctVal(ctx, 's5_max_drawdown') || '—'}`);
  L.push(`- 最大同时持仓风险：${pctVal(ctx, 's5_max_total_risk') || '—'}`);
  L.push(`- 最大持仓数量：${txt(A(ctx, 's5_max_positions'))}`);
  L.push(`- 杠杆上限：${A(ctx, 's5_leverage_allowed') === '允许' ? txt(A(ctx, 's5_max_leverage')) + ' 倍' : '不使用杠杆'}`);
  L.push(`- 最低盈亏比：${(() => { const v = A(ctx, 's4_min_rr'); return v === '自定义' ? C(ctx, 's4_min_rr') || '—' : txt(v); })()}`);
  L.push(`- 止损规则：${A(ctx, 's6_widen_stop') === '完全禁止' ? '不得扩大止损' : txt(A(ctx, 's6_widen_stop'))}`);
  L.push(`- TP1 后处理：${(() => { const v = A(ctx, 's6_tp1_handling'); return v === '自定义' ? C(ctx, 's6_tp1_handling') || '—' : txt(v); })()}`);
  L.push(`- 加仓规则：${(() => { const v = A(ctx, 's6_add_position'); return v === '自定义' ? C(ctx, 's6_add_position') || '—' : txt(v); })()}`);
  L.push(`- DCA 规则：${txt(A(ctx, 's6_dca_allowed'))}`);
  L.push(`- 连续亏损暂停：${(() => { const v = A(ctx, 's7_consecutive_pause'); return v === '自定义' ? `${C(ctx, 's7_consecutive_pause')} 次` : txt(v); })()}`);
  L.push(`- 每日最大交易次数：${txt(A(ctx, 's7_max_daily_trades'))}`);
  L.push(`- 重大新闻规则：${txt(A(ctx, 's3_news_policy'))}`);
  L.push(`- 禁止事项：${list(arr(ctx, 's4_forbidden_env'))}；${txt(A(ctx, 's3_forbidden'))}`);
  const highOpen = (ctx.flags || []).filter((f) => f.status === 'open' && f.severity === 'high').length;
  L.push(`- 当前未解决高风险冲突：${highOpen}`);
  L.push('');
  return L.join('\n');
}

export function generateChecklist(ctx) {
  const L = [];
  L.push('# 交易前检查清单');
  L.push('');
  const base = [
    '当前标的属于允许交易范围',
    '当前标的位于观察名单内，或符合计划外交易规则',
    '当前处于允许交易时段',
    '当前市场环境适合该策略',
    '当前 Setup 满足计划定义',
    '入场触发条件已经出现',
    '交易失效条件明确',
    '止损位置明确',
    '仓位规模已经按照风险规则计算',
    '单笔风险未超过限制',
    '当前总持仓风险未超过限制',
    '盈亏比符合计划要求',
    '未触发单日亏损上限',
    '未触发单周亏损上限',
    '未触发账户暂停状态',
    '未超过每日最大交易次数',
    '当前不存在重大新闻或事件风险',
    '当前没有报复性交易冲动',
    '当前没有 FOMO 追价',
    '交易理由不是单纯来自群聊、KOL 或朋友',
    '已准备完成交易记录和截图',
  ];
  base.forEach((b, i) => L.push(`- [ ] ${i + 1}. ${b}`));
  const mk = arr(ctx, 's3_markets');
  if (mk.includes('加密货币')) {
    L.push('');
    L.push('**加密货币附加检查：**');
    L.push('- [ ] 资金费率水平可接受');
    if (A(ctx, 's5_leverage_allowed') === '允许') L.push('- [ ] 永续合约强平安全距离充足');
  }
  if (A(ctx, 's6_dca_allowed') && A(ctx, 's6_dca_allowed') !== '完全禁止') L.push('- [ ] 符合 DCA 计划规则');
  L.push('- [ ] 隔夜持仓符合计划');
  if (mk.includes('美股')) L.push('- [ ] 财报风险已评估');
  L.push('- [ ] 周末持仓符合计划');
  if (A(ctx, 's5_correlation') !== '不考虑相关性') L.push('- [ ] 相关仓位总风险未超限');
  L.push('');
  return L.join('\n');
}

export function buildExportPayload(ctx) {
  const { plan, profile, answers, watchlist, psychRules, flags } = ctx;
  return {
    plan_version: plan?.version || 'v1.0',
    export_date: new Date().toISOString(),
    trading_plan: plan || null,
    plan_profile: profile || null,
    answers: answers || {},
    watchlist: watchlist || [],
    psychology_rules: psychRules || [],
    coherence_flags: flags || [],
  };
}