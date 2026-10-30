// 仓位计算器纯函数：公共计算、方向校验、输入校验、复制格式化

export const CURRENCIES = ['USDT', 'USD', 'CNY', 'HKD'];

function num(v) {
  if (v === null || v === undefined || v === '') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

// 解析交易计划单笔风险（来自 PlanAnswer）
// answers: { s5_per_trade_risk: '1%' | '自定义', s5_per_trade_risk_custom: number }
export function parsePerTradeRisk(answers) {
  if (!answers) return null;
  const v = answers['s5_per_trade_risk'];
  if (v == null) return null;
  if (v === '自定义') {
    const n = num(answers['s5_per_trade_risk_custom']);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const m = String(v).match(/([\d.]+)\s*%/);
  if (m) {
    const n = num(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

// 计算最大允许亏损（公共）
export function computeMaxLoss(account, riskMode, riskPercent, maxLossAmount) {
  const acc = num(account);
  if (!Number.isFinite(acc) || acc <= 0) return null;
  if (riskMode === 'amount') {
    const m = num(maxLossAmount);
    if (!Number.isFinite(m) || m <= 0) return null;
    return m;
  }
  const r = num(riskPercent);
  if (!Number.isFinite(r) || r <= 0) return null;
  return acc * r / 100;
}

// DCA 分批汇总：解析批次，计算加权平均价与相对权重
export function computeDcaSummary(dcaBatches) {
  if (!Array.isArray(dcaBatches) || dcaBatches.length === 0) return null;
  const parsed = dcaBatches.map((b) => ({ price: num(b.price), ratio: num(b.ratio) }));
  const valid = parsed.filter((p) => Number.isFinite(p.price) && p.price > 0 && Number.isFinite(p.ratio) && p.ratio > 0);
  if (valid.length === 0) return null;
  const totalRatio = valid.reduce((s, p) => s + p.ratio, 0);
  if (totalRatio <= 0) return null;
  const avgPrice = valid.reduce((s, p) => s + p.price * p.ratio, 0) / totalRatio;
  return { avgPrice, totalRatio, count: valid.length, valid };
}

// DCA 校验
export function validateDca(dcaBatches) {
  const errors = {};
  if (!Array.isArray(dcaBatches) || dcaBatches.length < 2) { errors.dca = '请至少添加 2 个分批'; return errors; }
  let validCount = 0;
  dcaBatches.forEach((b) => {
    const p = num(b.price), r = num(b.ratio);
    if (Number.isFinite(p) && p > 0 && Number.isFinite(r) && r > 0) validCount++;
  });
  if (validCount < 2) errors.dca = '至少需要 2 个有效分批（价格与比例均大于 0）';
  return errors;
}

// 方向校验：做多止损须低于开仓价；做空止损须高于开仓价
export function validateStopDirection(direction, entry, stop) {
  const e = num(entry), s = num(stop);
  if (!Number.isFinite(e) || !Number.isFinite(s)) return null;
  if (direction === 'long' && s >= e) return '做多交易的止损价必须低于开仓价。';
  if (direction === 'short' && s <= e) return '做空交易的止损价必须高于开仓价。';
  return null;
}

// 模板一：按止损计算仓位
export function calcByStop(input) {
  const { account, riskMode, riskPercent, maxLossAmount, direction, entry, stop, dcaEnabled, dcaBatches } = input;
  const maxLoss = computeMaxLoss(account, riskMode, riskPercent, maxLossAmount);
  const s = num(stop), acc = num(account);
  if (maxLoss == null || !Number.isFinite(s) || s <= 0) return null;

  let e, dca = null;
  if (dcaEnabled) {
    dca = computeDcaSummary(dcaBatches);
    if (!dca) return null;
    e = dca.avgPrice;
  } else {
    e = num(entry);
    if (!Number.isFinite(e) || e <= 0) return null;
  }

  const dirErr = validateStopDirection(direction, e, s);
  if (dirErr) return { error: dirErr };
  const priceRisk = Math.abs(e - s);
  if (priceRisk === 0) return { error: '开仓价与止损价不能相同。' };
  const positionSize = maxLoss / priceRisk;
  const notionalValue = positionSize * e;
  const stopDistancePct = Math.abs(e - s) / e * 100;
  const actualRiskPct = maxLoss / acc * 100;
  if (!Number.isFinite(positionSize) || !Number.isFinite(notionalValue)) return null;
  const result = { maxLoss, positionSize, notionalValue, stopDistancePct, actualRiskPct, direction, entry: e, stop: s, account: acc };
  if (dcaEnabled && dca) {
    result.dca = buildDcaBreakdown(dca, positionSize);
  }
  return result;
}

// 根据 DCA 汇总与总仓位生成分批明细
export function buildDcaBreakdown(dcaSummary, totalPosition) {
  const batches = dcaSummary.valid.map((p) => {
    const weight = p.ratio / dcaSummary.totalRatio;
    const position = totalPosition * weight;
    return { price: p.price, ratio: p.ratio, weight, position, notional: position * p.price };
  });
  return { avgPrice: dcaSummary.avgPrice, totalRatio: dcaSummary.totalRatio, batches };
}

// 模板二：按仓位计算止损
export function calcBySize(input) {
  const { account, riskMode, riskPercent, maxLossAmount, direction, entry, sizeMode, size, notional, dcaEnabled, dcaBatches } = input;
  const maxLoss = computeMaxLoss(account, riskMode, riskPercent, maxLossAmount);
  const acc = num(account);
  if (maxLoss == null) return null;

  let e, dca = null;
  if (dcaEnabled) {
    dca = computeDcaSummary(dcaBatches);
    if (!dca) return null;
    e = dca.avgPrice;
  } else {
    e = num(entry);
    if (!Number.isFinite(e) || e <= 0) return null;
  }

  let positionSize, notionalValue;
  if (sizeMode === 'size') {
    const sz = num(size);
    if (!Number.isFinite(sz) || sz <= 0) return null;
    positionSize = sz;
    notionalValue = sz * e;
  } else {
    const no = num(notional);
    if (!Number.isFinite(no) || no <= 0) return null;
    positionSize = no / e;
    notionalValue = no;
  }
  if (!Number.isFinite(positionSize) || positionSize <= 0) return null;
  const priceDistance = maxLoss / positionSize;
  if (!Number.isFinite(priceDistance)) return null;
  const stopPrice = direction === 'long' ? e - priceDistance : e + priceDistance;
  if (direction === 'long' && stopPrice <= 0) {
    return { error: '当前仓位过小或风险预算过高，计算出的止损价无效，请调整仓位或风险参数。' };
  }
  if (!Number.isFinite(stopPrice) || stopPrice <= 0) return null;
  const stopDistancePct = priceDistance / e * 100;
  const actualRiskPct = maxLoss / acc * 100;
  const result = { maxLoss, positionSize, notionalValue, priceDistance, stopPrice, stopDistancePct, actualRiskPct, direction, entry: e, account: acc };
  if (dcaEnabled && dca) {
    result.dca = buildDcaBreakdown(dca, positionSize);
  }
  return result;
}

// 公共输入校验
export function validateCommon(input) {
  const errors = {};
  const acc = num(input.account);
  if (!Number.isFinite(acc) || acc <= 0) errors.account = '账户总资金必须大于 0';
  const e = num(input.entry);
  if (!Number.isFinite(e) || e <= 0) errors.entry = '开仓价必须大于 0';
  if (input.riskMode === 'percent') {
    const r = num(input.riskPercent);
    if (!Number.isFinite(r) || r <= 0) errors.riskPercent = '风险比例必须大于 0';
  } else {
    const m = num(input.maxLossAmount);
    if (!Number.isFinite(m) || m <= 0) errors.maxLossAmount = '最大亏损金额必须大于 0';
    else if (Number.isFinite(acc) && acc > 0 && m > acc) errors.maxLossAmount = '最大亏损金额不得超过账户总资金';
  }
  return errors;
}

export function validateByStop(input) {
  const errors = { ...validateCommon(input) };
  if (input.dcaEnabled) delete errors.entry;
  const s = num(input.stop);
  if (!Number.isFinite(s) || s <= 0) errors.stop = '止损价必须大于 0';
  if (input.dcaEnabled) {
    Object.assign(errors, validateDca(input.dcaBatches));
    if (!errors.dca && !errors.stop) {
      const dca = computeDcaSummary(input.dcaBatches);
      const dirErr = validateStopDirection(input.direction, dca.avgPrice, s);
      if (dirErr) errors.stop = dirErr;
    }
  } else if (!errors.stop) {
    const dirErr = validateStopDirection(input.direction, input.entry, input.stop);
    if (dirErr) errors.stop = dirErr;
  }
  return errors;
}

export function validateBySize(input) {
  const errors = { ...validateCommon(input) };
  if (input.dcaEnabled) delete errors.entry;
  if (input.sizeMode === 'size') {
    const sz = num(input.size);
    if (!Number.isFinite(sz) || sz <= 0) errors.size = '仓位数量必须大于 0';
  } else {
    const no = num(input.notional);
    if (!Number.isFinite(no) || no <= 0) errors.notional = '名义仓位价值必须大于 0';
  }
  if (input.dcaEnabled) Object.assign(errors, validateDca(input.dcaBatches));
  return errors;
}

export function fmt(n) {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 8 });
}

export function fmtPct(n) {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 }) + '%';
}

function dcaLines(r, currency) {
  if (!r.dca) return [];
  const lines = [`平均开仓价：${fmt(r.dca.avgPrice)}`, `分批数量：${r.dca.batches.length}`];
  r.dca.batches.forEach((b, i) => {
    lines.push(`分批${i + 1}：价格 ${fmt(b.price)} / 比例 ${fmtPct(b.weight * 100)} / 仓位 ${fmt(b.position)} / 名义 ${fmt(b.notional)} ${currency}`);
  });
  return lines;
}

export function copyByStop(input, r, currency) {
  const dir = r.direction === 'long' ? '做多' : '做空';
  const riskLine = input.riskMode === 'percent'
    ? `风险比例：${fmtPct(num(input.riskPercent))}`
    : `最大亏损金额：${fmt(num(input.maxLossAmount))} ${currency}`;
  return [
    '仓位计算结果',
    `方向：${dir}`,
    `账户总资金：${fmt(num(input.account))} ${currency}`,
    riskLine,
    `最大允许亏损：${fmt(r.maxLoss)} ${currency}`,
    `开仓价：${fmt(r.entry)}`,
    `止损价：${fmt(r.stop)}`,
    `止损距离：${fmtPct(r.stopDistancePct)}`,
    `建议仓位数量：${fmt(r.positionSize)}`,
    `建议名义仓位：${fmt(r.notionalValue)} ${currency}`,
    ...dcaLines(r, currency),
  ].join('\n');
}

// 解析仓位计算器复制的结果文本，返回可填入交易前检查表单的字段
export function parseCopiedResult(text) {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const title = lines[0] || '';
  if (!title.includes('仓位计算结果') && !title.includes('止损计算结果')) return null;

  const map = {};
  for (const line of lines) {
    const idx = line.indexOf('：');
    if (idx === -1) continue;
    map[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }

  const strip = (s) => {
    if (s == null) return NaN;
    const t = String(s).replace(/[^\d.\-]/g, '');
    return Number(t);
  };
  const fin = (n) => Number.isFinite(n);

  const patch = {};
  const dir = map['方向'];
  if (dir === '做多') patch.direction = 'long';
  else if (dir === '做空') patch.direction = 'short';

  const acc = strip(map['账户总资金']);
  if (fin(acc)) patch.account_equity = acc;
  const entry = strip(map['开仓价']);
  if (fin(entry)) patch.planned_entry_price = entry;
  const stop = strip(map['止损价'] || map['建议止损价']);
  if (fin(stop)) patch.planned_stop_price = stop;

  const qty = strip(map['建议仓位数量'] || map['仓位数量']);
  const notional = strip(map['建议名义仓位'] || map['名义仓位']);
  if (fin(qty)) {
    patch.position_input_type = 'quantity';
    patch.planned_position_size = qty;
  } else if (fin(notional)) {
    patch.position_input_type = 'notional';
    patch.planned_position_size = notional;
  }

  // DCA 分批解析：若复制结果包含「平均开仓价」与「分批N」行，则重建 dca_batches
  const avg = strip(map['平均开仓价']);
  const batchLines = lines.filter((l) => /^分批\d+：/.test(l));
  if (fin(avg) && batchLines.length >= 2) {
    const batches = [];
    batchLines.forEach((l) => {
      const idx = l.indexOf('：');
      if (idx === -1) return;
      const body = l.slice(idx + 1);
      const priceM = body.match(/价格\s*([\d.]+)/);
      const ratioM = body.match(/比例\s*([\d.]+)/);
      const p = priceM ? Number(priceM[1]) : NaN;
      const r = ratioM ? Number(ratioM[1]) : NaN;
      if (Number.isFinite(p) && Number.isFinite(r)) batches.push({ price: String(p), ratio: String(r) });
    });
    if (batches.length >= 2) {
      patch.dca_enabled = true;
      patch.dca_batches = batches;
      patch.planned_entry_price = avg;
    }
  }
  return patch;
}

export function copyBySize(input, r, currency) {
  const dir = r.direction === 'long' ? '做多' : '做空';
  const riskLine = input.riskMode === 'percent'
    ? `风险比例：${fmtPct(num(input.riskPercent))}`
    : `最大亏损金额：${fmt(num(input.maxLossAmount))} ${currency}`;
  return [
    '止损计算结果',
    `方向：${dir}`,
    `账户总资金：${fmt(num(input.account))} ${currency}`,
    riskLine,
    `最大允许亏损：${fmt(r.maxLoss)} ${currency}`,
    `开仓价：${fmt(r.entry)}`,
    `名义仓位：${fmt(r.notionalValue)} ${currency}`,
    `仓位数量：${fmt(r.positionSize)}`,
    `建议止损价：${fmt(r.stopPrice)}`,
    `止损距离：${fmtPct(r.stopDistancePct)}`,
    ...dcaLines(r, currency),
  ].join('\n');
}