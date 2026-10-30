export const STEP_WEIGHTS = { '0': 5, '1': 5, '2': 10, '3': 10, '4': 15, '5': 20, '6': 15, '7': 10, '8': 10 };

export const STEP_TITLES = {
  '2': '目标与预期',
  '3': '市场范围与观察名单',
  '4': '策略与交易优势',
  '5': '风险与资金管理',
  '6': '交易执行与持仓管理',
  '7': '心理与纪律协议',
  '8': '记录、复盘与计划修改',
  'C': '规则冲突检查',
  'E': '生成交易计划',
};

export const STEP_DESC = {
  '2': '明确交易的目的、衡量成功的方式，以及什么时候必须暂停整个交易计划。收益目标只能作为参考，不能成为强迫交易的理由。',
  '3': '规定你允许交易的市场、标的和时间范围。计划之外的机会，默认不属于可执行交易。',
  '4': '定义什么样的市场条件构成机会，以及什么情况证明交易逻辑已经失效。',
  '5': '风险比例指初始止损触发后的计划亏损，占当前账户权益的比例，不是名义仓位大小，也不是保证金占用比例。',
  '6': '规定从发现机会、提交订单、管理止损到退出交易的具体操作流程。',
  '7': '提前识别最常见的行为风险，并为每个风险制定明确的"如果发生，那么执行"规则。',
  '8': '建立交易记录和计划修改制度，避免根据短期盈亏频繁改变策略。',
};

export function depMet(dep, answers) {
  if (!dep) return true;
  const v = answers[dep.key];
  if (dep.mode === 'includes') return Array.isArray(v) && v.some((x) => dep.values.includes(x));
  return dep.values.includes(v);
}

export const PROFILE_REQUIRED = ['trading_experience', 'daily_screen_time', 'days_per_week', 'preferred_currency', 'capital_bracket', 'income_dependency'];

export function profileComplete(p) {
  if (!p) return false;
  if (PROFILE_REQUIRED.some((f) => !p[f])) return false;
  if (!p.available_sessions || p.available_sessions.length === 0) return false;
  if (!p.account_types || p.account_types.length === 0) return false;
  if (p.account_types.includes('其他') && !(p.other_account_type || '').trim()) return false;
  return true;
}

function isAnswered(q, ctx) {
  const v = ctx.answers[q.key];
  if (q.type === 'single') {
    if (!v) return false;
    if (q.custom && v === q.customOption && !(ctx.answers[`${q.key}_custom`] || '').toString().trim()) return false;
    return true;
  }
  if (q.type === 'multi') {
    const a = Array.isArray(v) ? v : [];
    if (a.length < (q.multiMin || 1)) return false;
    if (q.other && a.includes(q.otherOption) && !(ctx.answers[`${q.key}_other`] || '').trim()) return false;
    return true;
  }
  if (q.type === 'textarea' || q.type === 'text') return !!(v || '').trim();
  if (q.type === 'number') return v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
  if (q.type === 'custom') {
    if (q.customKey === 'watchlist') return true;
    if (q.customKey === 'primaryMarket') return !!ctx.answers['s3_primary_market'];
    if (q.customKey === 'psychCards') {
      const issues = (ctx.answers['s7_issues'] || []).filter((i) => i !== '目前没有明显问题' && i !== '其他');
      return issues.every((i) => {
        const r = (ctx.psychRules || []).find((p) => p.issue_key === i);
        return r && !!(r.final_rule || '').trim();
      });
    }
    return true;
  }
  return false;
}

export function validateStep(stepKey, ctx) {
  const qs = STEP_QUESTIONS[stepKey];
  if (!qs) return { ok: false, missing: [] };
  const missing = [];
  qs.forEach((q) => {
    if (!depMet(q.depends, ctx.answers)) return;
    if (q.required && !isAnswered(q, ctx)) missing.push(q.key);
  });
  return { ok: missing.length === 0, missing };
}

export const PSYCH_ISSUES = {
  'FOMO 追单': { recommended: '如果价格已经离开计划入场区域，我不得追价。我必须等待下一次完整结构或新的独立交易机会。' },
  '报复性交易': { recommended: '如果我因亏损产生立即回本的冲动，我必须离开屏幕至少 30 分钟，并在重新交易前完成一次交易检查。' },
  '连续盈利后放大仓位': { recommended: '如果出现连续盈利后放大仓位的冲动，我必须保持原定单笔风险比例，不得因盈利提高风险。' },
  '过度交易': { recommended: '如果我发现自己频繁开仓，我必须回到计划检查清单，未通过检查不得交易。' },
  '提前止盈': { recommended: '如果我有提前止盈的冲动，我必须按计划止盈规则执行，不得因恐惧提前退出盈利仓位。' },
  '扩大止损': { recommended: '如果原始交易逻辑失效，我必须按照计划止损退出，不得通过扩大止损延迟承认错误。' },
  '取消止损': { recommended: '如果我有取消止损的冲动，我必须保持止损有效，止损被触发后立即退出。' },
  '亏损加仓': { recommended: '如果仓位处于浮亏，我不得加仓，除非符合预先定义的 DCA 计划。' },
  '因群聊或 KOL 改变计划': { recommended: '如果交易观点来自群聊、博主或朋友，我必须独立完成自己的交易检查，否则不得开仓。' },
  '为了回本降低入场标准': { recommended: '如果我有回本冲动，我必须等待完全符合计划的 Setup，不得降低入场标准。' },
  '错过行情后追价': { recommended: '如果我错过了一次行情，我必须放弃该机会，等待下一次独立 Setup，不得追价。' },
  '长时间盯盘导致疲劳': { recommended: '如果我感到疲劳，我必须停止交易，休息后再重新评估。' },
  '因害怕亏损错过合格机会': { recommended: '如果 Setup 完全符合计划，我必须按规则执行，不得因害怕亏损而错过合格机会。' },
  '连续亏损后频繁更换策略': { recommended: '如果出现连续亏损，我必须按计划暂停并复盘，不得在亏损中频繁更换策略。' },
};

export function psychRecommended(issue) {
  return (PSYCH_ISSUES[issue] && PSYCH_ISSUES[issue].recommended) || `如果出现"${issue}"的倾向，我必须暂停交易、完成交易前检查，并严格执行计划规则，不得在情绪驱动下改变仓位。`;
}

export const STEP_QUESTIONS = {
  '2': [
    { key: 's2_purpose', n: 1, label: '你的主要交易目的是什么？', type: 'multi', options: ['积累长期资本', '获得额外收入', '建立可持续的专业交易系统', '最终依靠交易生活', '提升执行纪律', '验证自己的策略优势', '管理现有资产', '其他'], other: true, otherOption: '其他', otherPlaceholder: '请说明其他目的', required: true, multiMin: 1 },
    { key: 's2_success', n: 2, label: '未来 12 个月，你如何定义交易上的成功？', hint: '请同时考虑收益、风险、执行纪律和过程目标。不要只填写一个收益率数字。', type: 'textarea', required: true, placeholder: '例如：在单笔风险不超过1%的前提下，全年执行率不低于80%，最大回撤不超过15%……' },
    { key: 's2_process_goals', n: 3, label: '你的核心过程目标是什么？', type: 'multi', options: ['连续完成 20 笔符合计划的交易', '连续完成 30 笔符合计划的交易', '连续完成 50 笔符合计划的交易', '每笔交易都完成记录', '每周完成一次复盘', '每月完成一次深度复盘', '每笔交易都严格执行止损', '不进行计划外交易', '不因连续亏损放大仓位', '自定义目标'], other: true, otherOption: '自定义目标', otherPlaceholder: '请描述自定义过程目标', required: true, multiMin: 1 },
    { key: 's2_sample_size', n: 4, label: '在正式评价策略表现之前，至少需要多少笔交易样本？', type: 'single', options: ['20 笔', '30 笔', '50 笔', '100 笔', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '笔数', required: true },
    { key: 's2_stop_drawdown', n: 5, label: '账户总回撤达到多少时，必须暂停整个交易计划并重新评估？', hint: '这里是账户级停止线，不是单笔止损。', type: 'single', options: ['10%', '15%', '20%', '25%', '30%', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '百分比', required: true },
    { key: 's2_return_target_type', n: 6, label: '是否设置年度收益目标？', hint: '收益目标不是市场承诺，不得为了达到目标降低交易标准或增加风险。', type: 'single', options: ['不设置固定收益目标', '设置收益区间', '设置具体收益目标'], required: true },
    { key: 's2_return_low', n: '6a', label: '最低目标百分比', type: 'number', placeholder: '%', depends: { key: 's2_return_target_type', values: ['设置收益区间'] } },
    { key: 's2_return_high', n: '6b', label: '最高目标百分比', type: 'number', placeholder: '%', depends: { key: 's2_return_target_type', values: ['设置收益区间'] } },
    { key: 's2_return_target', n: '6c', label: '目标收益百分比', type: 'number', placeholder: '%', depends: { key: 's2_return_target_type', values: ['设置具体收益目标'] } },
    { key: 's2_withdrawal', n: 7, label: '是否计划从交易账户中定期提款？', type: 'single', options: ['不提款', '每月提款', '每季度提款', '达到特定盈利后提款', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's2_withdrawal_rule', n: '7a', label: '提款规则', type: 'textarea', placeholder: '说明提款比例、条件与纪律', depends: { key: 's2_withdrawal', values: ['每月提款', '每季度提款', '达到特定盈利后提款', '自定义'] } },
  ],
  '3': [
    { key: 's3_markets', n: 1, label: '你允许交易哪些市场？', type: 'multi', options: ['A 股', '港股', '美股', '加密货币', '外汇', '国内期货', '海外期货', '期权', '指数', '商品', '其他'], other: true, otherOption: '其他', required: true, multiMin: 1 },
    { key: 's3_primary_market', n: 2, label: '你的主要交易市场是什么？', hint: '选项来自上方已选择的市场。', type: 'custom', customKey: 'primaryMarket', required: true },
    { key: 's3_watchlist', n: 3, label: '你允许交易哪些具体标的？', hint: '添加你的观察名单，可重复添加多个标的。', type: 'custom', customKey: 'watchlist' },
    { key: 's3_max_watchlist', n: 4, label: '观察名单最多允许多少个标的？', type: 'single', options: ['5 个', '8 个', '10 个', '20 个', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '数量', required: true },
    { key: 's3_adjust_freq', n: 5, label: '观察名单多久调整一次？', type: 'single', options: ['每周', '每两周', '每月', '每季度', '仅在策略发生变化时'], required: true },
    { key: 's3_offlist_policy', n: 6, label: '是否允许交易观察名单以外的标的？', type: 'single', options: ['完全禁止', '完成完整检查后允许', '允许，但必须记录原因'], required: true },
    { key: 's3_forbidden', n: 7, label: '哪些标的或市场类别禁止交易？', hint: '例如：低流动性代币、ST 股票、次新股、小盘股、重大事件前后的标的。', type: 'textarea', required: true },
    { key: 's3_news_policy', n: 8, label: '是否允许在重大新闻、财报或经济数据公布前后交易？', type: 'single', options: ['完全禁止', '只允许减仓或平仓', '允许，但风险降低 50%', '正常交易', '根据策略单独规定'], required: true },
    { key: 's3_time_ranges', n: 9, label: '允许交易的时间范围是什么？', hint: '可根据 Step 1 可参与时段预填，并可进一步限制。', type: 'multi', options: ['A 股早盘', 'A 股午盘', '港股时段', '亚洲时段', '欧洲时段', '美股盘前', '美股正常交易时段', '美股盘后', '24 小时加密市场'], required: true, multiMin: 1 },
    { key: 's3_crypto_weekend', n: '9a', label: '加密货币：是否允许周末交易？', type: 'single', options: ['不允许', '允许', '只允许 BTC 和 ETH', '只允许预先定义的标的'], required: true, depends: { key: 's3_markets', values: ['加密货币'], mode: 'includes' } },
    { key: 's3_crypto_lowliq', n: '9b', label: '加密货币：是否允许低流动性代币？', type: 'single', options: ['禁止', '允许，但降低风险', '允许'], required: true, depends: { key: 's3_markets', values: ['加密货币'], mode: 'includes' } },
    { key: 's3_crypto_newtoken', n: '9c', label: '加密货币：是否允许交易新上线代币？', type: 'single', options: ['禁止', '上线 7 天后', '上线 30 天后', '允许'], required: true, depends: { key: 's3_markets', values: ['加密货币'], mode: 'includes' } },
    { key: 's3_crypto_funding', n: '9d', label: '加密货币：是否允许在高资金费率环境交易永续合约？', type: 'single', options: ['禁止', '降低风险', '正常交易', '根据方向决定'], required: true, depends: { key: 's3_markets', values: ['加密货币'], mode: 'includes' } },
    { key: 's3_a_st', n: '9e', label: 'A 股：是否交易 ST 股票？', type: 'single', options: ['是', '否'], required: true, depends: { key: 's3_markets', values: ['A 股'], mode: 'includes' } },
    { key: 's3_a_new', n: '9f', label: 'A 股：是否交易次新股？', type: 'single', options: ['是', '否'], required: true, depends: { key: 's3_markets', values: ['A 股'], mode: 'includes' } },
    { key: 's3_a_limit', n: '9g', label: 'A 股：是否参与涨停板附近交易？', type: 'single', options: ['是', '否'], required: true, depends: { key: 's3_markets', values: ['A 股'], mode: 'includes' } },
    { key: 's3_a_t1', n: '9h', label: 'A 股：是否接受 T+1 隔夜风险？', type: 'single', options: ['是', '否'], required: true, depends: { key: 's3_markets', values: ['A 股'], mode: 'includes' } },
    { key: 's3_us_premarket', n: '9i', label: '美股：是否交易盘前？', type: 'single', options: ['是', '否'], required: true, depends: { key: 's3_markets', values: ['美股'], mode: 'includes' } },
    { key: 's3_us_postmarket', n: '9j', label: '美股：是否交易盘后？', type: 'single', options: ['是', '否'], required: true, depends: { key: 's3_markets', values: ['美股'], mode: 'includes' } },
    { key: 's3_us_earnings', n: '9k', label: '美股：是否持仓跨财报？', type: 'single', options: ['是', '否'], required: true, depends: { key: 's3_markets', values: ['美股'], mode: 'includes' } },
    { key: 's3_us_smallcap', n: '9l', label: '美股：是否交易低流动性小盘股？', type: 'single', options: ['是', '否'], required: true, depends: { key: 's3_markets', values: ['美股'], mode: 'includes' } },
  ],
  '4': [
    { key: 's4_style', n: 1, label: '你的主要交易风格是什么？', type: 'single', options: ['超短线', '日内交易', '波段交易', '中长期持仓', '多种风格组合'], required: true },
    { key: 's4_strategies', n: 2, label: '你主要使用哪些策略类型？', type: 'multi', options: ['趋势跟随', '突破交易', '均值回归', '关键区域交易', '动量交易', '市场结构', '事件驱动', '套利', '基本面分析', '量化策略', '订单流', '流动性交易', '自定义'], other: true, otherOption: '自定义', required: true, multiMin: 1 },
    { key: 's4_trend_tf', n: 3, label: '用于判断大方向的主要时间周期是什么？', type: 'single', options: ['月线', '周线', '日线', '4 小时', '1 小时', '不使用方向过滤'], required: true },
    { key: 's4_structure_tf', n: 4, label: '用于分析市场结构的主要时间周期是什么？', type: 'single', options: ['周线', '日线', '4 小时', '1 小时', '15 分钟'], required: true },
    { key: 's4_entry_tf', n: 5, label: '用于入场触发的主要时间周期是什么？', type: 'single', options: ['4 小时', '1 小时', '15 分钟', '5 分钟', '1 分钟', '根据策略变化'], required: true },
    { key: 's4_setup_conditions', n: 6, label: '一个合格的交易 Setup 必须满足哪些条件？', hint: '请写出能够被检查的具体条件，例如趋势、结构、位置、成交量和触发信号。', type: 'textarea', required: true },
    { key: 's4_invalidation', n: 7, label: '哪些情况会使交易逻辑失效？', hint: '描述价格、结构或基本面发生什么变化时，应当放弃交易。', type: 'textarea', required: true },
    { key: 's4_min_rr', n: 8, label: '你的最低计划盈亏比是多少？', type: 'single', options: ['1:1', '1.5:1', '2:1', '2.5:1', '3:1', '不使用固定盈亏比', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '如 2.2:1', required: true },
    { key: 's4_best_env', n: 9, label: '策略最适合哪些市场环境？', type: 'multi', options: ['明确上涨趋势', '明确下跌趋势', '区间震荡', '高波动', '低波动', '重大事件后', '流动性充足', '趋势初期', '趋势延续阶段', '自定义'], other: true, otherOption: '自定义' },
    { key: 's4_forbidden_env', n: 10, label: '哪些市场环境下禁止使用该策略？', type: 'multi', options: ['极低流动性', '极端消息行情', '无明确结构', '波动率过高', '波动率过低', '重大数据公布前', '连续大幅跳空后', '自定义'], other: true, otherOption: '自定义' },
    { key: 's4_edge_source', n: 11, label: '你的交易优势来自哪里？', type: 'multi', options: ['更好的市场结构识别', '更好的风险控制', '更好的执行纪律', '特定市场经验', '信息处理能力', '数据或量化模型', '事件研究', '订单流分析', '尚未验证', '自定义'], other: true, otherOption: '自定义' },
    { key: 's4_edge_verified', n: 12, label: '你的交易优势是否经过验证？', type: 'single', options: ['已完成充分回测和实盘验证', '已回测但实盘样本不足', '有实盘经验但缺少正式统计', '仍在验证阶段', '尚未验证'], required: true },
  ],
  '5': [
    { key: 's5_intro', n: 0, label: '风险比例指初始止损触发后的计划亏损，占当前账户权益的比例，不是名义仓位大小，也不是保证金占用比例。', type: 'custom', customKey: 'riskIntro' },
    { key: 's5_per_trade_risk', n: 1, label: '每笔交易最多允许损失账户权益的多少比例？', type: 'single', options: ['0.25%', '0.5%', '0.75%', '1%', '1.5%', '2%', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '%', required: true },
    { key: 's5_daily_loss', n: 2, label: '单日最大亏损是多少？', hint: '达到该限制后，当天不得继续开仓。', type: 'single', options: ['1%', '2%', '3%', '4%', '5%', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '%', required: true },
    { key: 's5_weekly_loss', n: 3, label: '单周最大亏损是多少？', type: 'single', options: ['3%', '5%', '8%', '10%', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '%', required: true },
    { key: 's5_max_drawdown', n: 4, label: '最大账户回撤是多少？', type: 'single', options: ['10%', '15%', '20%', '25%', '30%', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '%', required: true },
    { key: 's5_max_total_risk', n: 5, label: '最大同时持仓总风险是多少？', type: 'single', options: ['1%', '2%', '3%', '5%', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '%', required: true },
    { key: 's5_max_positions', n: 6, label: '最多允许同时持有多少个仓位？', type: 'number', min: 1, max: 50, placeholder: '1–50', required: true },
    { key: 's5_sizing_method', n: 7, label: '仓位规模如何计算？', type: 'single', options: ['固定账户风险比例', '固定亏损金额', '根据波动率调整', '根据策略等级调整', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's5_leverage_allowed', n: 8, label: '是否允许使用杠杆？', type: 'single', options: ['不允许', '允许'], required: true },
    { key: 's5_max_leverage', n: '8a', label: '最大杠杆倍数', type: 'number', placeholder: '倍数', required: true, depends: { key: 's5_leverage_allowed', values: ['允许'] } },
    { key: 's5_margin_mode', n: '8b', label: '默认保证金模式', type: 'single', options: ['逐仓', '全仓', '根据策略决定'], required: true, depends: { key: 's5_leverage_allowed', values: ['允许'] } },
    { key: 's5_cross_margin', n: '8c', label: '是否允许交叉保证金？', type: 'single', options: ['禁止', '允许', '仅在特定账户允许'], required: true, depends: { key: 's5_leverage_allowed', values: ['允许'] } },
    { key: 's5_liquidation_distance', n: '8d', label: '止损与预计强平价格之间至少保留多少安全距离？', type: 'single', options: ['5%', '10%', '15%', '20%', '自定义', '不适用'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '%', required: true, depends: { key: 's5_leverage_allowed', values: ['允许'] } },
    { key: 's5_consecutive_loss', n: 9, label: '连续亏损后如何调整风险？', type: 'single', options: ['不调整', '连续 2 次亏损后，单笔风险减半', '连续 3 次亏损后，单笔风险减半', '达到特定回撤后降低风险', '直接暂停交易', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's5_risk_cautious', n: '10a', label: '谨慎状态（风险降低 50%）触发条件', type: 'textarea', required: true },
    { key: 's5_risk_recovery', n: '10b', label: '恢复状态（风险降低 75%）触发条件', type: 'textarea', required: true },
    { key: 's5_risk_pause', n: '10c', label: '暂停状态（禁止新开仓）触发条件', type: 'textarea', required: true },
    { key: 's5_risk_resume', n: '10d', label: '恢复正常状态需要满足的条件', type: 'textarea', required: true },
    { key: 's5_correlation', n: 11, label: '不同仓位之间是否存在相关性限制？', type: 'single', options: ['不考虑相关性', '同方向高度相关仓位按一个风险组计算', '限制同一行业或币种类别的总风险', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's5_add_funds', n: 12, label: '是否允许在亏损状态下增加账户资金？', type: 'single', options: ['禁止为掩盖亏损临时补充资金', '允许按固定周期补充资金', '允许，但必须作为独立申购记录', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
  ],
  '6': [
    { key: 's6_order_types', n: 1, label: '你允许使用哪些订单类型？', type: 'multi', options: ['市价单', '限价单', '止损市价单', '止损限价单', '条件单', 'TWAP', '分批订单', '其他'], other: true, otherOption: '其他', required: true, multiMin: 1 },
    { key: 's6_stop_with_entry', n: 2, label: '止损是否必须在开仓时同时设置？', type: 'single', options: ['必须同时设置', '可以在成交后立即补充', '不强制'], required: true },
    { key: 's6_widen_stop', n: 3, label: '是否允许扩大止损？', type: 'single', options: ['完全禁止', '只有在仓位同步缩小时允许', '只有市场结构改变且重新计算风险后允许', '允许，但必须记录原因'], required: true },
    { key: 's6_tp_methods', n: 4, label: '你使用哪些止盈方式？', type: 'multi', options: ['固定盈亏比', '分批止盈', '移动止损', '市场结构止盈', '时间止盈', '技术指标止盈', '手动判断', '自定义'], other: true, otherOption: '自定义', required: true, multiMin: 1 },
    { key: 's6_tp1_handling', n: 5, label: '达到第一个止盈目标后如何处理？', type: 'single', options: ['止损移动至开仓价', '止损移动至最近有效结构', '减仓但不移动止损', '继续保持原计划', '根据策略决定', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's6_add_position', n: 6, label: '是否允许加仓？', type: 'single', options: ['不允许', '只允许浮盈加仓', '允许按计划分批建仓', '允许突破确认后加仓', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's6_dca_allowed', n: 7, label: '是否允许亏损加仓或 DCA？', type: 'single', options: ['完全禁止', '仅在开仓前定义的 DCA 计划内允许', '允许，但总风险不得增加', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's6_dca_max_adds', n: '7a', label: '最大加仓次数', type: 'number', placeholder: '次数', required: true, depends: { key: 's6_dca_allowed', values: ['仅在开仓前定义的 DCA 计划内允许', '允许，但总风险不得增加', '自定义'] } },
    { key: 's6_dca_proportion', n: '7b', label: '每次加仓比例', type: 'text', placeholder: '如 50%', depends: { key: 's6_dca_allowed', values: ['仅在开仓前定义的 DCA 计划内允许', '允许，但总风险不得增加', '自定义'] } },
    { key: 's6_dca_stop', n: '7c', label: '最终统一止损规则', type: 'textarea', required: true, depends: { key: 's6_dca_allowed', values: ['仅在开仓前定义的 DCA 计划内允许', '允许，但总风险不得增加', '自定义'] } },
    { key: 's6_dca_max_risk', n: '7d', label: '最大总风险', type: 'text', placeholder: '如 2%', depends: { key: 's6_dca_allowed', values: ['仅在开仓前定义的 DCA 计划内允许', '允许，但总风险不得增加', '自定义'] } },
    { key: 's6_dca_invalidation', n: '7e', label: '失效条件', type: 'textarea', required: true, depends: { key: 's6_dca_allowed', values: ['仅在开仓前定义的 DCA 计划内允许', '允许，但总风险不得增加', '自定义'] } },
    { key: 's6_max_slippage', n: 8, label: '滑点超过多少时必须放弃交易？', type: 'single', options: ['0.1%', '0.25%', '0.5%', '1%', '根据市场决定', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '如 0.3%', required: true },
    { key: 's6_overnight', n: 9, label: '是否允许隔夜持仓？', type: 'single', options: ['不允许', '允许', '仅波段策略允许', '仅风险降低后允许', '根据市场决定'], required: true },
    { key: 's6_weekend', n: 10, label: '是否允许周末持仓？', type: 'single', options: ['不允许', '允许', '仅加密货币允许', '仅风险降低后允许', '根据策略决定'], required: true },
    { key: 's6_news_existing', n: 11, label: '重大消息公布前如何处理已有仓位？', type: 'single', options: ['全部平仓', '减仓', '收紧止损', '保持原计划', '根据策略决定'], required: true },
    { key: 's6_emergency', n: 12, label: '出现交易所故障、断网、数据异常或极端行情时如何处理？', type: 'textarea', required: true },
    { key: 's6_manual_close', n: 13, label: '是否允许手动提前平仓？', type: 'single', options: ['不允许，除非触发计划条件', '允许，但必须记录原因', '允许根据市场结构判断', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
  ],
  '7': [
    { key: 's7_issues', n: 1, label: '哪些心理或行为问题曾影响你的交易？', hint: '至少选择一项，也允许选择"目前没有明显问题"。', type: 'multi', options: ['FOMO 追单', '报复性交易', '连续盈利后放大仓位', '过度交易', '提前止盈', '扩大止损', '取消止损', '亏损加仓', '因群聊或 KOL 改变计划', '为了回本降低入场标准', '错过行情后追价', '长时间盯盘导致疲劳', '因害怕亏损错过合格机会', '连续亏损后频繁更换策略', '目前没有明显问题', '其他'], other: true, otherOption: '其他', required: true, multiMin: 1 },
    { key: 's7_psych_cards', n: 2, label: '为每个已识别问题制定 If–Then 纪律规则', hint: '每张卡片可使用系统推荐规则，也可编辑为最终规则。', type: 'custom', customKey: 'psychCards', required: true },
    { key: 's7_consecutive_pause', n: 3, label: '连续亏损多少次后必须暂停交易？', type: 'single', options: ['2 次', '3 次', '4 次', '5 次', '不按连续次数暂停', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '次数', required: true },
    { key: 's7_pause_duration', n: 4, label: '暂停交易多久？', type: 'single', options: ['30 分钟', '当天剩余时间', '24 小时', '直到下一个交易日', '直到完成复盘', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's7_resume_requirements', n: 5, label: '恢复交易前必须完成什么？', type: 'multi', options: ['离开屏幕并休息', '完成亏损交易复盘', '重新阅读核心规则卡', '重新完成交易前检查', '单笔风险减半', '等到下一个交易日', '与交易伙伴或教练讨论', '自定义'], other: true, otherOption: '自定义', required: true, multiMin: 1 },
    { key: 's7_max_daily_trades', n: 6, label: '每天最多允许多少笔新交易？', type: 'number', min: 1, max: 50, placeholder: '笔数', required: true },
    { key: 's7_winrisk', n: 7, label: '连续盈利后是否需要限制风险增长？', type: 'single', options: ['风险保持不变', '连续盈利后也不得提高风险', '只有月度复盘后才允许提高风险', '自定义'], custom: true, customOption: '自定义', customType: 'text', customPlaceholder: '请说明', required: true },
    { key: 's7_fatigue', n: 8, label: '出现明显疲劳、情绪波动或生活事件时如何处理？', type: 'textarea', required: true },
  ],
  '8': [
    { key: 's8_record_fields', n: 1, label: '每笔交易必须记录哪些内容？', type: 'multi', options: ['标的', '多空方向', '入场时间', '入场价', '止损价', '止盈价', '仓位大小', '风险金额', '风险比例', 'R 倍数', 'Setup 类型', '交易理由', '交易前截图', '持仓中截图', '交易后截图', '情绪状态', '是否遵守计划', '违规行为', '复盘备注'], required: true, multiMin: 1 },
    { key: 's8_daily_review', n: 2, label: '什么时候做日复盘？', type: 'single', options: ['每个交易日结束后', '只在有交易时', '第二天交易前', '不做日复盘'], required: true },
    { key: 's8_weekly_day', n: 3, label: '每周什么时候做周复盘？', type: 'single', options: ['周一', '周二', '周三', '周四', '周五', '周六', '周日', '不固定', '不做周复盘'], required: true },
    { key: 's8_weekly_time', n: '3a', label: '周复盘时间', type: 'text', placeholder: '如 20:00', depends: { key: 's8_weekly_day', values: ['周一', '周二', '周三', '周四', '周五', '周六', '周日', '不固定'] } },
    { key: 's8_monthly_mode', n: 4, label: '每月什么时候做月度复盘？', type: 'single', options: ['每月固定日期', '每月最后一个交易日', '不固定', '不做月度复盘'], required: true },
    { key: 's8_monthly_day', n: '4a', label: '月度复盘日期', type: 'number', min: 1, max: 31, placeholder: '日期', depends: { key: 's8_monthly_mode', values: ['每月固定日期'] } },
    { key: 's8_monthly_time', n: '4b', label: '月度复盘时间', type: 'text', placeholder: '如 20:00', depends: { key: 's8_monthly_mode', values: ['每月固定日期', '每月最后一个交易日', '不固定'] } },
    { key: 's8_review_metrics', n: 5, label: '复盘时重点查看哪些指标？', type: 'multi', options: ['胜率', '平均盈利 R', '平均亏损 R', '平均盈亏比', 'Profit Factor', 'Expectancy', '最大回撤', '连续亏损次数', '计划执行率', '违规交易损失', '不同 Setup 表现', '不同市场表现', '不同时段表现', '不同交易来源表现'], required: true, multiMin: 1 },
    { key: 's8_min_sample_modify', n: 6, label: '修改策略前至少需要多少笔交易样本？', type: 'single', options: ['20 笔', '30 笔', '50 笔', '100 笔', '根据策略决定', '自定义'], custom: true, customOption: '自定义', customType: 'number', customPlaceholder: '笔数', required: true },
    { key: 's8_modify_timing', n: 7, label: '交易计划可以在什么时候修改？', type: 'multi', options: ['只在周度复盘时', '只在月度复盘时', '达到最低样本量后', '发生重大市场结构变化时', '触发账户停止线后', '自定义'], other: true, otherOption: '自定义', required: true, multiMin: 1 },
    { key: 's8_modify_rules', n: 8, label: '修改计划时必须遵守哪些规则？', type: 'multi', options: ['每次只修改一个主要变量', '必须记录修改原因', '必须保留旧版本', '修改后重新开始样本统计', '不得因少数亏损交易立即修改', '修改后先进行模拟或小仓位测试', '自定义'], other: true, otherOption: '自定义', required: true, multiMin: 1 },
    { key: 's8_trade_eval', n: 9, label: '如何评价一笔交易？', hint: '盈利交易不一定是好交易，亏损交易也不一定是坏交易。是否遵守计划应单独评价。', type: 'multi', options: ['根据最终盈亏', '根据是否遵守计划', '根据入场质量', '根据风险控制', '根据执行质量', '根据复盘结果'], required: true, multiMin: 1 },
  ],
};