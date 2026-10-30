// DEX 风险监控后端：统一适配层（Hyperliquid + Lighter）+ 风险规则引擎
// 仅读取公开账户与市场数据，不接触任何私钥/助记词/API Secret。

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const HL_BASE = 'https://api.hyperliquid.xyz/info';
const LIGHTER_BASE = 'https://mainnet.zklighter.elliot.ai';

// 账户发现缓存：同一钱包地址在 TTL 内复用结果，避免重复调用 accountsByL1Address
// Deno Deploy 同一 isolate 内 module-level 状态跨请求保留，可减少限频压力
const accountCache = new Map();
const ACCOUNT_CACHE_TTL = 5 * 60 * 1000; // 5 分钟

// ---------- helpers ----------
function num(v) {
  if (v === null || v === undefined || v === '') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function round(v, d = 2) { if (!Number.isFinite(v)) return null; const p = Math.pow(10, d); return Math.round(v * p) / p; }
// 价格按有效数字保留精度（10 位有效数字），避免 0.07431 被截断为 0.07；内部计算仍使用完整精度的原始变量。
function roundPrice(v) { if (!Number.isFinite(v)) return null; if (v === 0) return 0; return Number(Number(v).toPrecision(10)); }
function isAddr(s) { return typeof s === 'string' && /^0x[a-fA-F0-9]{40}$/.test(s.trim()); }
function isoNow() { return new Date().toISOString(); }

async function hlPost(type, user) {
  const r = await fetch(HL_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, user }),
  });
  if (!r.ok) throw new Error(`Hyperliquid ${type} 请求失败 (${r.status})`);
  return r.json();
}
function maskQuery(path) {
  // 仅记录接口路径与脱敏后的查询键，不记录完整钱包地址等用户隐私数据
  return path.replace(/(l1_address|value)=([^&]+)/gi, (_m, k, v) => `${k}=${String(v).slice(0, 6)}…${String(v).slice(-4)}`);
}
async function lighterGet(path, ctx) {
  const method = 'GET';
  const seq = ctx ? (++ctx.count) : 0;
  // 单次验证请求预算：超出上限直接拒绝，不发送请求、不循环
  if (ctx && ctx.count > ctx.max) {
    console.log(`[dexMonitor] Lighter request budget exceeded (count=${ctx.count}, max=${ctx.max}) — 不再发送请求`);
    throw Object.assign(new Error('Lighter 单次验证请求次数超出上限。'), { code: 'BUDGET_EXCEEDED' });
  }
  console.log(`[dexMonitor] Lighter endpoint called #${seq} ${method} ${maskQuery(path)}`);
  const url = LIGHTER_BASE + path;
  const t0 = Date.now();
  let r;
  try {
    r = await fetch(url, { method, headers: { accept: 'application/json' } });
  } catch (e) {
    console.log(`[dexMonitor] Lighter response status #${seq} → network_error (${Date.now() - t0}ms) — 不自动重试`);
    throw Object.assign(new Error('Lighter 网络请求失败'), { code: 'NETWORK_ERROR' });
  }
  const ms = Date.now() - t0;
  console.log(`[dexMonitor] Lighter response status #${seq} → ${r.status} (${ms}ms)`);
  // 仅在错误时读取响应体片段用于调试（不含用户地址等隐私数据）
  let bodySnippet = '';
  if (r.status === 429 || !r.ok) {
    try { bodySnippet = (await r.text()).slice(0, 300); } catch (_) {}
    console.log(`[dexMonitor] Lighter response body #${seq}: ${bodySnippet || '(empty)'}`);
  }
  if (r.status === 429) {
    // 429 不自动重试，直接抛出并附带调试信息
    throw Object.assign(new Error('Lighter API 当前请求过于频繁，请稍后重试。'), {
      code: 'RATE_LIMITED', status: 429,
      debug: { endpoint: maskQuery(path), method, status: 429, request_seq: seq, request_count: ctx ? ctx.count : 1, body: bodySnippet },
    });
  }
  if (!r.ok) {
    throw Object.assign(new Error(`Lighter 请求失败 (${r.status})`), {
      code: 'HTTP_ERROR', status: r.status,
      debug: { endpoint: maskQuery(path), method, status: r.status, request_seq: seq, body: bodySnippet },
    });
  }
  return r.json();
}

// ---------- Hyperliquid adapter ----------
async function hyperliquidFetch(user) {
  const [clearing, openOrders, frontendOrders, mids] = await Promise.all([
    hlPost('clearinghouseState', user),
    hlPost('openOrders', user),
    hlPost('frontendOpenOrders', user),
    hlPost('allMids', user).catch(() => ({})),
  ]);
  return { clearing, openOrders, frontendOrders, mids };
}

function normalizeHyperliquid(raw, user) {
  const { clearing, frontendOrders, mids } = raw;
  const margin = clearing.marginSummary || {};
  const equity = num(margin.accountValue);
  const marginUsed = num(margin.totalMarginUsed);
  const available = num(margin.availableToWithdraw);
  const positions = [];
  let longNtl = 0, shortNtl = 0, grossNtl = 0, totalUpnl = 0;
  const assetPositions = Array.isArray(clearing.assetPositions) ? clearing.assetPositions : [];
  for (const ap of assetPositions) {
    const p = ap.position || ap;
    const coin = p.coin;
    const szi = num(p.szi);
    if (!coin || !Number.isFinite(szi) || szi === 0) continue;
    const entry = num(p.entryPx);
    const mark = num(mids[coin]) || (Number.isFinite(entry) ? entry : NaN);
    const liq = num(p.liquidationPx);
    const qty = Math.abs(szi);
    const notional = Number.isFinite(mark) ? qty * mark : NaN;
    const dir = szi > 0 ? 'long' : 'short';
    const upnl = Number.isFinite(mark) && Number.isFinite(entry)
      ? (dir === 'long' ? (mark - entry) : (entry - mark)) * qty : NaN;
    const upnlPct = Number.isFinite(entry) && entry !== 0 ? (upnl / (entry * qty)) * 100 : NaN;
    const liqDist = Number.isFinite(mark) && Number.isFinite(liq) && liq > 0
      ? Math.abs(mark - liq) / mark * 100 : null;
    const lev = p.leverage && (p.leverage.value || p.leverage.value === 0) ? num(p.leverage.value) : NaN;
    const marginMode = p.leverage && p.leverage.type ? p.leverage.type : null;
    if (Number.isFinite(notional)) { grossNtl += notional; if (dir === 'long') longNtl += notional; else shortNtl += notional; }
    if (Number.isFinite(upnl)) totalUpnl += upnl;
    positions.push({
      symbol: coin, direction: dir, quantity: round(qty, 6), entry_price: roundPrice(entry),
      mark_price: roundPrice(mark), notional_value: round(notional), leverage: Number.isFinite(lev) ? round(lev) : null,
      margin_mode: marginMode, unrealized_pnl: round(upnl), unrealized_pnl_percent: round(upnlPct),
      liquidation_price: Number.isFinite(liq) && liq > 0 ? roundPrice(liq) : null,
      liquidation_distance_percent: liqDist !== null ? round(liqDist) : null,
      account_equity_percent: Number.isFinite(notional) && Number.isFinite(equity) && equity > 0 ? round(notional / equity * 100) : null,
      _raw: { szi, coin },
    });
  }
  // stop detection
  const stops = matchHyperliquidStops(positions, frontendOrders || []);
  for (const pos of positions) {
    const s = stops[pos.symbol] || { status: 'none', price: null };
    pos.stop_coverage_status = s.status;
    pos.detected_stop_price = s.price;
    delete pos._raw;
  }
  const effectiveLev = Number.isFinite(equity) && equity > 0 ? grossNtl / equity : NaN;
  const largestPct = positions.reduce((m, p) => Math.max(m, p.account_equity_percent || 0), 0);
  return {
    overview: {
      account_equity: round(equity), available_balance: round(available), margin_used: round(marginUsed),
      unrealized_pnl: round(totalUpnl), positions_count: positions.length,
      gross_notional: round(grossNtl), long_notional: round(longNtl), short_notional: round(shortNtl),
      effective_leverage: round(effectiveLev), largest_position_percent: round(largestPct),
      updated_at: isoNow(),
    },
    positions,
    stopReadable: true,
  };
}

function matchHyperliquidStops(positions, frontendOrders) {
  const map = {};
  for (const pos of positions) {
    const isLong = pos.direction === 'long';
    const wantSide = isLong ? 'A' : 'B'; // reduce side
    const slOrders = [];
    const reduceOnlyResting = [];
    for (const o of frontendOrders) {
      if (!o || o.coin !== pos.symbol) continue;
      if (o.side !== wantSide) continue;
      const isTrigger = o.isTrigger === true;
      const isTpsl = o.isPositionTpsl === true;
      const reduceOnly = o.reduceOnly === true;
      const sz = num(o.sz) || num(o.origSz) || 0;
      if (!Number.isFinite(sz) || sz === 0) continue;
      if (isTrigger || isTpsl) {
        // determine loss side via triggerCondition
        const cond = o.triggerCondition || '';
        const lossSide = isLong ? cond === '<=' : cond === '>=';
        if (lossSide) slOrders.push({ sz, price: num(o.triggerPx) || num(o.limitPx) });
      } else if (reduceOnly) {
        reduceOnlyResting.push({ sz, price: num(o.limitPx) });
      }
    }
    const slSum = slOrders.reduce((a, b) => a + b.sz, 0);
    const posQty = Math.abs(pos.quantity);
    let status, price;
    if (slSum >= posQty && slSum > 0) { status = 'full'; price = slOrders[0].price; }
    else if (slSum > 0) { status = 'partial'; price = slOrders[0].price; }
    else if (reduceOnlyResting.length > 0) { status = 'unknown'; price = reduceOnlyResting[0].price; }
    else { status = 'none'; price = null; }
    map[pos.symbol] = { status, price: roundPrice(price) };
  }
  return map;
}

// ---------- Lighter adapter ----------
async function lighterListAccounts(wallet, ctx) {
  // 缓存命中则直接返回，不发起请求
  const cached = accountCache.get(wallet);
  if (cached && (Date.now() - cached.ts) < ACCOUNT_CACHE_TTL) {
    console.log(`[dexMonitor] Lighter accountsByL1Address cache hit (age=${Math.round((Date.now() - cached.ts) / 1000)}s) — 跳过 API 调用`);
    return cached.accounts;
  }
  let data;
  try {
    data = await lighterGet(`/api/v1/accountsByL1Address?l1_address=${wallet}`, ctx);
  } catch (e) {
    // Lighter 对未注册地址返回 400 + code 21100 "account not found"，视为无账户而非接口故障
    if (e && e.code === 'HTTP_ERROR' && e.status === 400 && /account not found|21100/.test((e.debug && e.debug.body) || '')) {
      console.log('[dexMonitor] Lighter account not found (400 / 21100) — 视为无账户');
      accountCache.set(wallet, { ts: Date.now(), accounts: [] });
      return [];
    }
    throw e;
  }
  // accountsByL1Address 返回 { code, total, accounts: [...] }（与 account 接口同构）
  const subs = Array.isArray(data && data.accounts) ? data.accounts : (Array.isArray(data && data.sub_accounts) ? data.sub_accounts : []);
  const accounts = subs.map((a) => ({
    index: a.index, status: a.status, collateral: num(a.collateral),
    available_balance: num(a.available_balance), account_type: a.account_type,
    account_trading_mode: a.account_trading_mode, pending_order_count: a.pending_order_count,
  }));
  accountCache.set(wallet, { ts: Date.now(), accounts });
  return accounts;
}

// 解析 Lighter /api/v1/account 响应：实际结构为 { code, total, accounts: [...] }，
// 账户对象在 accounts[0]，所有数值为十进制字符串。
async function lighterFetchAccount(index, ctx) {
  const data = await lighterGet(`/api/v1/account?by=index&value=${index}&active_only=false`, ctx);
  const accounts = data && Array.isArray(data.accounts) ? data.accounts : null;
  const acc = accounts && accounts.length > 0 ? accounts[0] : null;
  console.log(`[dexMonitor] Lighter account response: code=${data && data.code}, total=${data && data.total}, accounts=${accounts ? accounts.length : 0}, has_account=${!!acc}, positions=${acc && Array.isArray(acc.positions) ? acc.positions.length : 0}, collateral=${acc ? acc.collateral : '—'}`);
  return acc;
}

function normalizeLighter(account) {
  // 账户不存在时返回空概览，由调用方判断是否阻断
  if (!account) {
    return {
      overview: { account_equity: null, available_balance: null, margin_used: null, unrealized_pnl: null,
        positions_count: 0, gross_notional: null, long_notional: null, short_notional: null,
        effective_leverage: null, largest_position_percent: null, updated_at: isoNow() },
      positions: [], stopReadable: false,
    };
  }
  const collateral = num(account.collateral);
  const available = num(account.available_balance);
  const totalAssetValue = num(account.total_asset_value);
  const crossImr = num(account.cross_initial_margin_requirement); // 全仓持仓初始保证金（账户级）
  let longNtl = 0, shortNtl = 0, grossNtl = 0, totalUpnl = 0, marginUsed = 0;
  const rawPositions = Array.isArray(account.positions) ? account.positions : [];
  const positions = [];
  for (const p of rawPositions) {
    const qty = num(p.position);
    if (!Number.isFinite(qty) || qty === 0) continue;
    const sign = num(p.sign);
    const dir = sign < 0 ? 'short' : 'long'; // 1 = long, -1 = short
    const absQty = Math.abs(qty);
    const entry = num(p.avg_entry_price);
    const value = num(p.position_value);
    const mark = Number.isFinite(value) && absQty > 0 ? value / absQty : entry;
    const upnl = num(p.unrealized_pnl);
    const liq = num(p.liquidation_price);
    const liqDist = Number.isFinite(mark) && Number.isFinite(liq) && liq > 0 ? Math.abs(mark - liq) / mark * 100 : null;
    const imf = num(p.initial_margin_fraction);
    const leverage = Number.isFinite(imf) && imf > 0 ? round(100 / imf) : null; // imf 为百分比（如 5.00）→ 杠杆
    const allocMargin = num(p.allocated_margin);
    const marginMode = num(p.margin_mode) === 1 ? 'isolated' : 'cross';
    if (Number.isFinite(allocMargin)) marginUsed += allocMargin;
    if (Number.isFinite(value)) { grossNtl += value; if (dir === 'long') longNtl += value; else shortNtl += value; }
    if (Number.isFinite(upnl)) totalUpnl += upnl;
    positions.push({
      symbol: p.symbol, direction: dir, quantity: round(absQty, 6), entry_price: roundPrice(entry),
      mark_price: roundPrice(mark), notional_value: round(value), leverage, margin_mode: marginMode,
      unrealized_pnl: round(upnl),
      liquidation_price: Number.isFinite(liq) && liq > 0 ? roundPrice(liq) : null,
      liquidation_distance_percent: liqDist !== null ? round(liqDist) : null,
      stop_coverage_status: 'unknown', detected_stop_price: null,
    });
  }
  // 账户权益：优先使用官方 total_asset_value，缺失时回退为 保证金 + 未实现盈亏
  const equity = Number.isFinite(totalAssetValue) ? totalAssetValue
    : (Number.isFinite(collateral) ? collateral + totalUpnl : (Number.isFinite(totalUpnl) ? totalUpnl : NaN));
  // 保证金占用 = 逐仓 allocated_margin 之和 + 全仓初始保证金（账户级）
  const totalMarginUsed = marginUsed + (Number.isFinite(crossImr) ? crossImr : 0);
  for (const p of positions) {
    p.unrealized_pnl_percent = Number.isFinite(p.entry_price) && p.entry_price !== 0 && Number.isFinite(p.unrealized_pnl) ? round((p.unrealized_pnl / (p.entry_price * p.quantity)) * 100) : null;
    p.account_equity_percent = Number.isFinite(p.notional_value) && Number.isFinite(equity) && equity > 0 ? round(p.notional_value / equity * 100) : null;
  }
  const effectiveLev = Number.isFinite(equity) && equity > 0 ? grossNtl / equity : NaN;
  const largestPct = positions.reduce((m, p) => Math.max(m, p.account_equity_percent || 0), 0);
  return {
    overview: {
      account_equity: round(equity), available_balance: round(available), margin_used: round(totalMarginUsed),
      unrealized_pnl: round(totalUpnl), positions_count: positions.length,
      gross_notional: round(grossNtl), long_notional: round(longNtl), short_notional: round(shortNtl),
      effective_leverage: round(effectiveLev), largest_position_percent: round(largestPct),
      updated_at: isoNow(),
    },
    positions, stopReadable: false,
  };
}

// ---------- plan parsing ----------
function parsePercent(v, answers, key) {
  if (v == null) return NaN;
  const s = String(v);
  if (s.includes('自定义')) return num(answers && answers[`${key}_custom`]);
  const m = s.match(/([\d.]+)/);
  return m ? num(m[1]) : NaN;
}

async function loadPlanContext(base44, tradingPlanId) {
  if (!tradingPlanId) return null;
  try {
    const plan = await base44.entities.TradingPlan.get(tradingPlanId).catch(() => null);
    if (!plan) return null;
    const [ansRecs, wl] = await Promise.all([
      base44.entities.PlanAnswer.filter({ trading_plan_id: tradingPlanId }, '-created_date', 300),
      base44.entities.WatchlistItem.filter({ trading_plan_id: tradingPlanId }, 'sort_order', 200),
    ]);
    const answers = {};
    ansRecs.forEach((r) => { try { answers[r.question_key] = JSON.parse(r.answer_value); } catch (e) { answers[r.question_key] = r.answer_value; } });
    return { plan, answers, watchlist: wl };
  } catch (e) { return null; }
}

// ---------- risk rule engine ----------
function norm(s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); }

function runRiskEngine(connection, normalized, planCtx, drawdownPercent) {
  const alerts = [];
  const ov = normalized.overview;
  const positions = normalized.positions;
  const hasPlan = !!planCtx && !!planCtx.answers;
  const answers = hasPlan ? planCtx.answers : {};
  const watchlist = (planCtx && planCtx.watchlist || []).map((w) => norm(w.symbol));
  const cryptoAllowed = Array.isArray(answers['s3_markets']) && answers['s3_markets'].some((m) => norm(m).includes('加密') || norm(m) === 'crypto');
  const maxLev = num(answers['s5_max_leverage']);
  const levAllowed = answers['s5_leverage_allowed'];
  const maxPositions = num(answers['s5_max_positions']);
  const requireStop = answers['s6_stop_with_entry'] === '必须同时设置';
  const offlistPolicy = answers['s3_offlist_policy'];
  const maxDrawdown = parsePercent(answers['s5_max_drawdown'], answers, 's5_max_drawdown');

  const addAlert = (symbol, key, severity, title, description, current, limit) => {
    alerts.push({ symbol: symbol || '', alert_key: key, severity, title, description, current_value: current, limit_value: limit });
  };

  // 1. 杠杆风险：账户有效杠杆 = 总名义敞口 / 账户权益，由计划最大杠杆限制（高风险违规）
  //    单个仓位按「名义价值 / 账户权益」衡量其有效杠杆贡献，超限仅作单仓提醒（warning）；
  //    不再用交易所返回的单仓杠杆倍数（如 15×）直接比对计划限制。
  const equity = num(ov.account_equity);
  if (levAllowed === '不允许' && Number.isFinite(ov.effective_leverage) && ov.effective_leverage > 1) {
    addAlert('', 'leverage_exceed', 'high', '账户有效杠杆超过计划限制', `计划不允许杠杆，但账户有效杠杆 ${ov.effective_leverage.toFixed(2)}×`, `${ov.effective_leverage.toFixed(2)}×`, '1× (不允许杠杆)');
  } else if (Number.isFinite(maxLev)) {
    if (Number.isFinite(ov.effective_leverage) && ov.effective_leverage > maxLev) {
      addAlert('', 'leverage_exceed', 'high', '账户有效杠杆超过计划限制', `当前有效杠杆 ${ov.effective_leverage.toFixed(2)}×（总名义敞口 / 账户权益）`, `${ov.effective_leverage.toFixed(2)}×`, `${maxLev}×`);
    }
    for (const p of positions) {
      const notional = num(p.notional_value);
      if (equity > 0 && Number.isFinite(notional)) {
        const posEff = notional / equity;
        if (posEff > maxLev) {
          addAlert(p.symbol, 'position_leverage_high', 'warning', `${p.symbol} 单仓杠杆较高`, `单仓有效杠杆 ${posEff.toFixed(2)}×（名义价值 / 账户权益）`, `${posEff.toFixed(2)}×`, `${maxLev}×`);
        }
      }
    }
  }
  // 2. 持仓数量超限
  if (Number.isFinite(maxPositions) && ov.positions_count > maxPositions) {
    addAlert('', 'positions_count_exceed', 'high', '持仓数量超过计划限制', `当前持仓 ${ov.positions_count} 个`, `${ov.positions_count}`, `${maxPositions}`);
  }
  // 3. 计划外市场
  if (hasPlan && Array.isArray(answers['s3_markets']) && answers['s3_markets'].length > 0 && !cryptoAllowed) {
    addAlert('', 'market_out_of_plan', 'warning', '市场不在计划允许范围', 'Hyperliquid / Lighter 属于加密货币永续市场', '加密货币永续', answers['s3_markets'].join('、'));
  }
  // 4. 计划外标的
  for (const p of positions) {
    if (!watchlist.includes(norm(p.symbol))) {
      if (offlistPolicy === '完全禁止') {
        addAlert(p.symbol, 'symbol_out_of_watchlist', 'high', `${p.symbol} 不在观察名单（计划禁止计划外交易）`, `标的 ${p.symbol} 不在观察名单`, p.symbol, '观察名单内');
      } else if (offlistPolicy === '允许，但必须记录原因') {
        addAlert(p.symbol, 'symbol_out_of_watchlist', 'warning', `${p.symbol} 不在观察名单（计划要求记录）`, `标的 ${p.symbol} 不在观察名单`, p.symbol, '观察名单内');
      }
    }
  }
  // 5 & 6. 止损
  if (requireStop) {
    for (const p of positions) {
      if (p.stop_coverage_status === 'none') {
        addAlert(p.symbol, 'no_stop_detected', 'high', `${p.symbol} 持仓未检测到有效止损`, '计划要求开仓必须设置止损，但未检测到有效止损订单', '未检测到止损', '需设置止损');
      } else if (p.stop_coverage_status === 'partial') {
        addAlert(p.symbol, 'stop_coverage_insufficient', 'high', `${p.symbol} 止损覆盖不足`, '止损订单数量低于当前仓位', '部分覆盖', '覆盖全部仓位');
      } else if (p.stop_coverage_status === 'unknown' && !normalized.stopReadable) {
        // 公开接口无法确认（Lighter）—仅提示不视为高风险违规
        addAlert(p.symbol, 'stop_unknown', 'info', `${p.symbol} 止损状态无法通过公开接口确认`, '当前公开接口无法读取止损订单信息', '无法确认', '需设置止损');
      }
    }
  }
  // 7. 清算距离过近
  for (const p of positions) {
    if (p.liquidation_distance_percent !== null && Number.isFinite(p.liquidation_distance_percent)) {
      const d = p.liquidation_distance_percent;
      if (d < 5) addAlert(p.symbol, 'liquidation_too_close', 'critical', `${p.symbol} 清算距离过近（严重）`, `清算距离 ${d.toFixed(2)}%，存在迫近强平风险`, `${d.toFixed(2)}%`, '≥ 5%');
      else if (d < 10) addAlert(p.symbol, 'liquidation_too_close', 'high', `${p.symbol} 清算距离较近`, `清算距离 ${d.toFixed(2)}%`, `${d.toFixed(2)}%`, '≥ 10%');
      else if (d < 20) addAlert(p.symbol, 'liquidation_too_close', 'warning', `${p.symbol} 清算距离提醒`, `清算距离 ${d.toFixed(2)}%`, `${d.toFixed(2)}%`, '≥ 20%');
    }
  }
  // 8. 单一仓位集中度
  for (const p of positions) {
    if (p.account_equity_percent != null && Number.isFinite(p.account_equity_percent)) {
      if (p.account_equity_percent > 300) addAlert(p.symbol, 'concentration_too_high', 'high', `${p.symbol} 单一仓位集中度过高`, `占账户权益 ${p.account_equity_percent.toFixed(1)}%`, `${p.account_equity_percent.toFixed(1)}%`, '≤ 300%');
      else if (p.account_equity_percent > 100) addAlert(p.symbol, 'concentration_too_high', 'warning', `${p.symbol} 单一仓位集中度提醒`, `占账户权益 ${p.account_equity_percent.toFixed(1)}%`, `${p.account_equity_percent.toFixed(1)}%`, '≤ 100%');
    }
  }
  // 9. 总敞口过大（有效杠杆）已并入杠杆检查；无计划时仅作信息
  if (!hasPlan && Number.isFinite(ov.effective_leverage) && ov.effective_leverage > 0) {
    addAlert('', 'total_exposure', 'info', '账户有效杠杆', `总名义敞口 / 权益 = ${ov.effective_leverage.toFixed(2)}×`, `${ov.effective_leverage.toFixed(2)}×`, '—');
  }
  // 10. 回撤
  if (drawdownPercent !== null && Number.isFinite(drawdownPercent) && Number.isFinite(maxDrawdown) && drawdownPercent >= maxDrawdown) {
    addAlert('', 'drawdown_exceed', 'high', '账户回撤达到或超过计划上限', `当前回撤 ${drawdownPercent.toFixed(2)}%`, `${drawdownPercent.toFixed(2)}%`, `${maxDrawdown}%`);
  }

  // overall risk status
  const sevRank = { info: 1, warning: 2, high: 3, critical: 4 };
  let maxSev = 0;
  for (const a of alerts) maxSev = Math.max(maxSev, sevRank[a.severity] || 0);
  let riskStatus = 'normal';
  if (maxSev >= 4) riskStatus = 'pause';
  else if (maxSev >= 3) riskStatus = 'high';
  else if (maxSev >= 2) riskStatus = 'cautious';

  // per-position compliance
  const bySymbol = {};
  for (const a of alerts) { if (a.symbol) { (bySymbol[a.symbol] = bySymbol[a.symbol] || []).push(a); } }
  for (const p of positions) {
    const pa = bySymbol[p.symbol] || [];
    let ps = 0;
    for (const a of pa) ps = Math.max(ps, sevRank[a.severity] || 0);
    p.compliance_status = ps >= 3 ? 'violation' : (ps >= 2 ? 'warning' : 'compliant');
  }
  return { alerts, risk_status: riskStatus };
}

// ---------- snapshot dedup & drawdown ----------
async function computeDrawdown(base44, connectionId, currentEquity) {
  const snaps = await base44.entities.DexAccountSnapshot.filter({ connection_id: connectionId }, '-captured_at', 30).catch(() => []);
  if (!snaps || snaps.length < 3) return null;
  let peak = -Infinity;
  for (const s of snaps) { const e = num(s.account_equity); if (Number.isFinite(e) && e > peak) peak = e; }
  if (!Number.isFinite(peak) || peak <= 0 || !Number.isFinite(currentEquity)) return null;
  if (currentEquity >= peak) return 0;
  return (peak - currentEquity) / peak * 100;
}

async function maybeSaveSnapshot(base44, connection, normalized, riskStatus, drawdownPercent) {
  const connId = connection.id;
  const latest = await base44.entities.DexAccountSnapshot.filter({ connection_id: connId }, '-captured_at', 1).catch(() => []);
  const now = Date.now();
  if (latest && latest[0] && latest[0].captured_at) {
    const age = now - new Date(latest[0].captured_at).getTime();
    if (age < 5 * 60 * 1000) return null; // 5 分钟内不重复写入
  }
  const ov = normalized.overview;
  const snap = await base44.entities.DexAccountSnapshot.create({
    connection_id: connId, platform: connection.platform,
    account_equity: ov.account_equity, available_balance: ov.available_balance, margin_used: ov.margin_used,
    unrealized_pnl: ov.unrealized_pnl, positions_count: ov.positions_count, gross_notional: ov.gross_notional,
    long_notional: ov.long_notional, short_notional: ov.short_notional, effective_leverage: ov.effective_leverage,
    largest_position_percent: ov.largest_position_percent, drawdown_percent: drawdownPercent !== null ? round(drawdownPercent) : null,
    risk_status: riskStatus, captured_at: new Date().toISOString(),
  });
  if (normalized.positions.length > 0) {
    const rows = normalized.positions.map((p) => ({
      connection_id: connId, account_snapshot_id: snap.id, symbol: p.symbol, direction: p.direction,
      quantity: p.quantity, entry_price: p.entry_price, mark_price: p.mark_price, notional_value: p.notional_value,
      leverage: p.leverage, margin_mode: p.margin_mode, unrealized_pnl: p.unrealized_pnl, unrealized_pnl_percent: p.unrealized_pnl_percent,
      liquidation_price: p.liquidation_price, liquidation_distance_percent: p.liquidation_distance_percent,
      detected_stop_price: p.detected_stop_price, stop_coverage_status: p.stop_coverage_status,
      account_equity_percent: p.account_equity_percent, compliance_status: p.compliance_status,
      captured_at: new Date().toISOString(),
    }));
    await base44.entities.DexPositionSnapshot.bulkCreate(rows).catch(() => {});
  }
  return snap.id;
}

// ---------- 成交历史同步 → 交易日志（Hyperliquid） ----------
// 通过公开 userFills 接口拉取账户成交记录，避免快照差分在"快进快出"场景下漏记。
// 仅记录平仓成交（Close 类，含 closedPnl）为已平仓交易日志；开仓成交不单独入库，避免记录堆积与重复。
function fillIsClose(f) {
  if (f && f.dir) return /close/i.test(String(f.dir));
  const pnl = num(f && f.closedPnl);
  return Number.isFinite(pnl) && pnl !== 0;
}
function fillDirection(f) {
  const d = String((f && f.dir) || '');
  if (/long/i.test(d)) return 'long';
  if (/short/i.test(d)) return 'short';
  return f && f.side === 'B' ? 'long' : 'short';
}
async function hlFills(user) {
  const r = await fetch(HL_BASE, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'userFills', user }),
  });
  if (!r.ok) throw new Error(`Hyperliquid userFills 请求失败 (${r.status})`);
  const data = await r.json();
  // userFills 直接返回成交数组（最新优先），兼容 { fills: [...] } 包装
  return Array.isArray(data) ? data : (Array.isArray(data && data.fills) ? data.fills : []);
}
async function upsertClosedFillsToJournal(base44, connection) {
  const user = connection.wallet_address;
  if (!user) return 0;
  // 增量基线：取该连接最近一条 exchange_fill 记录的 fill_time；返回按最新优先，遇到更早时间即停止
  const recent = await base44.entities.TradeJournal.filter(
    { connection_id: connection.id, source: 'exchange_fill' }, '-fill_time', 1
  ).catch(() => []);
  const newestExistingTime = recent && recent[0] && recent[0].fill_time ? new Date(recent[0].fill_time).getTime() : 0;
  let fills;
  try {
    fills = await hlFills(user);
  } catch (e) {
    console.log('[dexMonitor] hyperliquid userFills failed: ' + e.message);
    return 0;
  }
  if (!fills.length) return 0;
  const toCreate = [];
  for (const f of fills) {
    const t = num(f.time);
    if (!Number.isFinite(t)) continue;
    if (t <= newestExistingTime) break; // 增量截断：后续均为已同步的旧成交
    if (!fillIsClose(f)) continue;
    const tid = f.tid != null ? String(f.tid) : (f.hash ? String(f.hash) : null);
    if (!tid) continue;
    const px = num(f.px), sz = num(f.sz);
    toCreate.push({
      source: 'exchange_fill', platform: connection.platform, connection_id: connection.id,
      exchange_trade_id: `hl:${tid}`,
      symbol: f.coin, asset_name: f.coin, direction: fillDirection(f),
      fill_time: new Date(t).toISOString(),
      fill_price: Number.isFinite(px) ? roundPrice(px) : null,
      fill_quantity: Number.isFinite(sz) ? round(sz, 6) : null,
      trade_value: Number.isFinite(px) && Number.isFinite(sz) ? round(px * sz) : null,
      fees: Number.isFinite(num(f.fee)) ? round(num(f.fee)) : null,
      pnl_amount: Number.isFinite(num(f.closedPnl)) ? round(num(f.closedPnl)) : null,
      actual_exit_price: Number.isFinite(px) ? roundPrice(px) : null,
      actual_position_size: Number.isFinite(sz) ? round(sz, 6) : null,
      closed_at: new Date(t).toISOString(),
      status: 'closed',
    });
    if (toCreate.length >= 500) break;
  }
  if (!toCreate.length) return 0;
  await base44.entities.TradeJournal.bulkCreate(toCreate).catch((e) => { console.log('[dexMonitor] bulkCreate fills failed: ' + e.message); });
  return toCreate.length;
}

// ---------- 仓位变化检测 → 交易日志 ----------
// 基于公开持仓快照比较推断仓位变化（新开 / 加仓 / 减仓 / 平仓），生成 source=position_monitor 的交易记录。
// 不调用任何成交历史接口，不接触 API Key / 私钥 / 签名权限。
function estimatePnl(direction, entry, exit, qty) {
  const e = num(entry), x = num(exit), q = num(qty);
  if (!Number.isFinite(e) || !Number.isFinite(x) || !Number.isFinite(q)) return NaN;
  return direction === 'long' ? (x - e) * q : (e - x) * q;
}

async function findOpenJournal(base44, connId, symbol) {
  const open = await base44.entities.TradeJournal.filter(
    { connection_id: connId, source: 'position_monitor', symbol, status: 'open' }, '-opened_at', 1
  ).catch(() => []);
  return open && open[0] ? open[0] : null;
}

async function closeOpenJournal(base44, connId, symbol, prev, now) {
  const rec = await findOpenJournal(base44, connId, symbol);
  if (!rec) return;
  const exit = num(prev.mark_price) || num(prev.entry_price);
  const closedQty = num(rec.current_quantity) || num(prev.quantity) || 0;
  const realized = estimatePnl(rec.direction, rec.actual_entry_price, exit, closedQty);
  await base44.entities.TradeJournal.update(rec.id, {
    status: 'closed', closed_at: now,
    actual_exit_price: Number.isFinite(exit) ? roundPrice(exit) : null,
    current_quantity: 0, actual_position_size: 0,
    pnl_amount: Number.isFinite(realized) ? round(realized) : null,
  }).catch(() => {});
}

async function openNewJournal(base44, connection, symbol, cur, now) {
  const curQty = num(cur.quantity) || 0;
  await base44.entities.TradeJournal.create({
    source: 'position_monitor', platform: connection.platform, connection_id: connection.id,
    exchange_trade_id: `pm:${connection.id}:${symbol}:${cur.direction}`,
    symbol, direction: cur.direction, asset_name: symbol,
    actual_entry_price: cur.entry_price, actual_position_size: curQty,
    initial_quantity: curQty, current_quantity: curQty,
    fill_time: now, fill_price: cur.entry_price, fill_quantity: curQty, trade_value: cur.notional_value,
    opened_at: now, status: 'open',
  }).catch(() => {});
}

async function detectPositionChanges(base44, connection, currentPositions) {
  const connId = connection.id;
  const now = new Date().toISOString();
  // 取上一轮快照（按 captured_at 倒序，每个 symbol 取最新一条）作为"上次状态"
  const prevSnaps = await base44.entities.DexPositionSnapshot.filter({ connection_id: connId }, '-captured_at', 500).catch(() => []);
  const prevMap = {};
  for (const s of (prevSnaps || [])) { if (!prevMap[s.symbol]) prevMap[s.symbol] = s; }
  const curMap = {};
  for (const p of currentPositions) curMap[p.symbol] = p;

  let created = 0;
  const symbols = new Set([...Object.keys(prevMap), ...Object.keys(curMap)]);
  for (const symbol of symbols) {
    const prev = prevMap[symbol] || null;
    const cur = curMap[symbol] || null;
    const prevQty = prev ? (num(prev.quantity) || 0) : 0;
    const curQty = cur ? (num(cur.quantity) || 0) : 0;
    const prevDir = prev ? prev.direction : null;
    const curDir = cur ? cur.direction : null;
    const dirChanged = prevDir && curDir && prevDir !== curDir;

    if (dirChanged && prevQty > 0) {
      // 方向翻转：先平掉旧持仓，再开新方向
      await closeOpenJournal(base44, connId, symbol, prev, now);
      if (curQty > 0) { await openNewJournal(base44, connection, symbol, cur, now); created++; }
      continue;
    }
    if (prevQty === 0 && curQty > 0) {
      // 新开仓
      await openNewJournal(base44, connection, symbol, cur, now); created++;
    } else if (prevQty > 0 && curQty === 0) {
      // 平仓
      await closeOpenJournal(base44, connId, symbol, prev, now);
    } else if (curQty > prevQty && curQty > 0) {
      // 加仓：更新当前数量与平均成本
      const rec = await findOpenJournal(base44, connId, symbol);
      if (rec) {
        await base44.entities.TradeJournal.update(rec.id, {
          current_quantity: curQty, actual_position_size: curQty,
          actual_entry_price: cur.entry_price,
        }).catch(() => {});
      }
    } else if (curQty < prevQty && curQty > 0) {
      // 减仓：累计已实现盈亏（按标记价估算，无法获取实际成交价时为估算值）
      const rec = await findOpenJournal(base44, connId, symbol);
      if (rec) {
        const exit = num(cur.mark_price) || num(cur.entry_price);
        const reducedQty = prevQty - curQty;
        const realizedDelta = estimatePnl(rec.direction, rec.actual_entry_price, exit, reducedQty);
        const prevRealized = num(rec.pnl_amount) || 0;
        const newRealized = Number.isFinite(realizedDelta) ? prevRealized + realizedDelta : prevRealized;
        await base44.entities.TradeJournal.update(rec.id, {
          current_quantity: curQty, actual_position_size: curQty,
          actual_exit_price: Number.isFinite(exit) ? roundPrice(exit) : null,
          pnl_amount: Number.isFinite(newRealized) ? round(newRealized) : null,
        }).catch(() => {});
      }
    }
  }
  return created;
}

async function upsertAlerts(base44, connection, currentAlerts) {
  const connId = connection.id;
  const existing = await base44.entities.RiskAlert.filter({ connection_id: connId, status: 'active' }, '-last_detected_at', 200).catch(() => []);
  const now = new Date().toISOString();
  const keyOf = (a) => `${a.alert_key}|${a.symbol || ''}`;
  const existingMap = {};
  for (const e of existing) existingMap[keyOf(e)] = e;
  const toUpdate = [];
  const toCreate = [];
  for (const a of currentAlerts) {
    const k = keyOf(a);
    if (existingMap[k]) {
      toUpdate.push({ id: existingMap[k].id, last_detected_at: now });
      delete existingMap[k];
    } else {
      toCreate.push({
        connection_id: connId, platform: connection.platform, symbol: a.symbol || '',
        alert_key: a.alert_key, severity: a.severity, title: a.title, description: a.description,
        current_value: a.current_value || '', limit_value: a.limit_value || '',
        status: 'active', first_detected_at: now, last_detected_at: now,
      });
    }
  }
  // remaining existing not in current → resolve
  const toResolve = Object.values(existingMap).map((e) => ({ id: e.id, status: 'resolved', resolved_at: now }));
  if (toCreate.length) await base44.entities.RiskAlert.bulkCreate(toCreate).catch(() => {});
  if (toUpdate.length) await base44.entities.RiskAlert.bulkUpdate(toUpdate).catch(() => {});
  if (toResolve.length) await base44.entities.RiskAlert.bulkUpdate(toResolve).catch(() => {});
}

// ---------- handler ----------
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'validate') {
      const platform = body.platform;
      const wallet = (body.wallet_address || '').trim();
      const hasManualIndex = body.lighter_account_index != null && body.lighter_account_index !== '';
      if (platform === 'hyperliquid') {
        if (!isAddr(wallet)) return Response.json({ error: '地址格式错误：请输入合法的 Ethereum 0x 地址' }, { status: 400 });
        try {
          const raw = await hyperliquidFetch(wallet);
          const norm = normalizeHyperliquid(raw, wallet);
          const ov = norm.overview;
          const hasData = ov.positions_count > 0 || (Number.isFinite(ov.account_equity) && ov.account_equity > 0);
          if (!hasData) {
            return Response.json({
              valid: false, reason: 'agent_wallet',
              message: '未查询到该地址对应的 Hyperliquid 账户数据。请确认填写的是实际主账户或子账户地址，而不是 API Agent Wallet 地址。',
            });
          }
          return Response.json({
            valid: true, platform, wallet_address: wallet, account_type: 'perp',
            has_data: true, account_equity: ov.account_equity, positions_count: ov.positions_count,
          });
        } catch (e) {
          return Response.json({ error: 'Hyperliquid 当前无法返回账户数据，请稍后重试。' + ' (' + e.message + ')' }, { status: 502 });
        }
      } else if (platform === 'lighter') {
        // 单次验证请求预算：最多 3 个 Lighter API 请求；429 / 失败均不自动重试、不循环调用
        const ctx = { count: 0, max: 3 };
        try {
          if (hasManualIndex) {
            // 默认/推荐流程：手动 Account Index，直接查询账户详情，不调用 accountsByL1Address
            const idx = Number(body.lighter_account_index);
            if (!Number.isInteger(idx) || idx < 0) return Response.json({ error: 'Account Index 必须为非负整数' }, { status: 400 });
            console.log(`[dexMonitor] Lighter validation flow started (stage=account_detail, budget=${ctx.max})`);
            const acc = await lighterFetchAccount(idx, ctx);
            if (!acc) {
              console.log(`[dexMonitor] Lighter account_detail: no account for index=${idx}`);
              return Response.json({ valid: false, reason: 'no_account', message: '未找到该 Account Index 对应的 Lighter 账户，请确认 Index 正确。' });
            }
            const norm = normalizeLighter(acc);
            const ov = norm.overview;
            console.log(`[dexMonitor] Lighter validation flow completed (stage=account_detail, requests=${ctx.count}, equity=${ov.account_equity}, positions=${ov.positions_count})`);
            return Response.json({
              valid: true, platform, wallet_address: isAddr(wallet) ? wallet : '', lighter_account_index: idx,
              account_type: num(acc.account_type) === 1 ? 'main' : 'sub', has_data: true,
              account_equity: ov.account_equity, positions_count: ov.positions_count,
            });
          }
          // 方式一：自动发现账户，需 Ethereum L1 地址
          if (!isAddr(wallet)) return Response.json({ error: '地址格式错误：请输入合法的 Ethereum 0x 地址' }, { status: 400 });
          console.log(`[dexMonitor] Lighter validation flow started (stage=discovery, budget=${ctx.max})`);
          const accounts = await lighterListAccounts(wallet, ctx);
          console.log(`[dexMonitor] Lighter validation flow completed (stage=discovery, requests=${ctx.count}, accounts=${accounts.length})`);
          if (!accounts.length) {
            return Response.json({ valid: false, reason: 'no_account', allow_manual_index: true, message: '无法自动发现 Lighter 账户，请手动输入 Account Index。' });
          }
          if (accounts.length === 1) {
            return Response.json({ needs_selection: false, accounts });
          }
          return Response.json({ needs_selection: true, accounts, message: `检测到该地址关联 ${accounts.length} 个 Lighter 账户，请选择需要监控的 account index。` });
        } catch (e) {
          const stage = hasManualIndex ? 'account_detail' : 'discovery';
          console.log(`[dexMonitor] Lighter validation flow failed (stage=${stage}, requests=${ctx.count}, code=${e && e.code})`);
          if (e && e.code === 'RATE_LIMITED') {
            // 429 不阻塞用户：返回 200 + allow_manual_index；endpoint / status 仅记录在开发日志，不回传前端
            return Response.json({
              valid: false, reason: 'rate_limited', allow_manual_index: true,
              message: 'Lighter 自动发现暂时不可用，请使用 Account Index 连接。',
            });
          }
          return Response.json({ error: 'Lighter 当前无法返回账户数据，请确认 Account Index 正确后重试。' }, { status: 502 });
        }
      }
      return Response.json({ error: '未知平台' }, { status: 400 });
    }

    if (action === 'sync') {
      const connId = body.connection_id;
      if (!connId) return Response.json({ error: '缺少 connection_id' }, { status: 400 });
      const conns = await base44.entities.DexMonitorConnection.filter({ id: connId }, '-created_date', 1);
      const connection = conns && conns[0];
      if (!connection) return Response.json({ error: '未找到连接' }, { status: 404 });
      let normalized;
      try {
        if (connection.platform === 'hyperliquid') {
          const raw = await hyperliquidFetch(connection.wallet_address);
          normalized = normalizeHyperliquid(raw, connection.wallet_address);
        } else {
          const idx = connection.lighter_account_index;
          if (idx == null) return Response.json({ error: '该 Lighter 连接缺少 account index' }, { status: 400 });
          const ctx = { count: 0, max: 3 };
          const acc = await lighterFetchAccount(idx, ctx);
          if (!acc) throw Object.assign(new Error('未找到该 Account Index 对应的 Lighter 账户'), { code: 'NO_ACCOUNT' });
          normalized = normalizeLighter(acc);
        }
      } catch (e) {
        await base44.entities.DexMonitorConnection.update(connection.id, { status: 'error', last_error: e.message, last_synced_at: new Date().toISOString() });
        if (e && e.code === 'RATE_LIMITED') {
          return Response.json({ error: e.message, rate_limited: true }, { status: 429 });
        }
        return Response.json({ error: connection.platform === 'hyperliquid' ? 'Hyperliquid 当前无法返回账户数据，请稍后重试。' : 'Lighter 当前无法返回账户数据，请稍后重试。', detail: e.message }, { status: 502 });
      }
      const planCtx = await loadPlanContext(base44, connection.trading_plan_id);
      const drawdown = await computeDrawdown(base44, connection.id, normalized.overview.account_equity);
      const engine = runRiskEngine(connection, normalized, planCtx, drawdown);
      // 仓位变化检测需在写入本轮快照之前读取"上一轮快照"，确保对比的是历史状态
      const tradesCreated = connection.platform === 'hyperliquid'
        ? await upsertClosedFillsToJournal(base44, connection)
        : await detectPositionChanges(base44, connection, normalized.positions);
      await maybeSaveSnapshot(base44, connection, normalized, engine.risk_status, drawdown);
      await upsertAlerts(base44, connection, engine.alerts);
      await base44.entities.DexMonitorConnection.update(connection.id, { status: 'active', last_error: '', last_synced_at: new Date().toISOString() });
      const activeAlerts = await base44.entities.RiskAlert.filter({ connection_id: connection.id, status: 'active' }, '-last_detected_at', 200).catch(() => []);
      return Response.json({
        connection, overview: normalized.overview, positions: normalized.positions,
        alerts: activeAlerts, risk_status: engine.risk_status,
        stop_readable: normalized.stopReadable, plan_linked: !!planCtx,
        drawdown_percent: drawdown !== null ? round(drawdown) : null,
        trades_created: tradesCreated,
      });
    }

    if (action === 'list_lighter_accounts') {
      const wallet = (body.wallet_address || '').trim();
      if (!isAddr(wallet)) return Response.json({ error: '地址格式错误' }, { status: 400 });
      try {
        const ctx = { count: 0, max: 3 };
        const accounts = await lighterListAccounts(wallet, ctx);
        return Response.json({ accounts });
      } catch (e) {
        if (e && e.code === 'RATE_LIMITED') {
          return Response.json({ error: e.message, rate_limited: true, debug: e.debug || {} }, { status: 429 });
        }
        return Response.json({ error: 'Lighter 当前无法返回账户数据，请稍后重试。' + ' (' + e.message + ')', debug: (e && e.debug) || {} }, { status: 502 });
      }
    }

    return Response.json({ error: '未知 action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});