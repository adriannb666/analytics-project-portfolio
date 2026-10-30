// 交易绩效统计引擎：纯函数，基于已实现盈亏的交易记录计算各项指标。
// 「已实现交易」= pnl_amount 为有限数值的记录（已完成 / 已平仓 / 自动同步带盈亏）。

function std(arr, mean) {
  if (arr.length < 2) return 0;
  const v = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(v);
}

export function parseCloseTime(j) {
  const t = j.closed_at || j.fill_time || j.opened_at || j.created_date;
  if (!t) return null;
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

export function getRealizedTrades(journals) {
  return journals
    .map((j) => {
      const pnl = Number(j.pnl_amount);
      if (!Number.isFinite(pnl)) return null;
      const time = parseCloseTime(j);
      const src = j.source || 'manual';
      const isAuto = src === 'position_monitor' || src === 'exchange_fill' || src === 'automatic';
      return { id: j.id, pnl, time, isAuto, source: src, symbol: j.symbol || '—' };
    })
    .filter(Boolean)
    .sort((a, b) => (a.time?.getTime() || 0) - (b.time?.getTime() || 0));
}

export function computeOverview(trades) {
  const n = trades.length;
  const empty = {
    n: 0, totalPnl: 0, winners: 0, losers: 0, winRate: 0, avgPnl: 0, profitFactor: 0,
    avgWin: 0, avgLoss: 0, expectancy: 0, best: 0, worst: 0, maxDrawdownAbs: 0,
    maxDrawdownPct: 0, sharpe: 0, grossProfit: 0, grossLoss: 0, maxWinStreak: 0, maxLossStreak: 0,
  };
  if (n === 0) return empty;
  const pnls = trades.map((t) => t.pnl);
  const totalPnl = pnls.reduce((s, x) => s + x, 0);
  const wins = pnls.filter((x) => x > 0);
  const losses = pnls.filter((x) => x < 0);
  const grossProfit = wins.reduce((s, x) => s + x, 0);
  const grossLoss = Math.abs(losses.reduce((s, x) => s + x, 0));
  const avgPnl = totalPnl / n;
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const winRate = (wins.length / n) * 100;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
  const best = Math.max(...pnls);
  const worst = Math.min(...pnls);

  // 累计盈亏曲线与最大回撤（绝对值与相对峰值百分比）
  let cum = 0, peak = 0, maxDDAbs = 0, maxDDPct = 0;
  for (const p of pnls) {
    cum += p;
    if (cum > peak) peak = cum;
    if (peak > 0) {
      const dd = peak - cum;
      if (dd > maxDDAbs) maxDDAbs = dd;
      const ddpct = (dd / peak) * 100;
      if (ddpct > maxDDPct) maxDDPct = ddpct;
    } else if (cum < 0 && Math.abs(cum) > maxDDAbs) {
      maxDDAbs = Math.abs(cum);
    }
  }

  // 夏普比率（每笔）：均值 / 标准差，标准差为 0 时记 0
  const sd = std(pnls, avgPnl);
  const sharpe = sd > 0 ? avgPnl / sd : 0;

  // 连胜 / 连败
  let curW = 0, curL = 0, maxW = 0, maxL = 0;
  for (const p of pnls) {
    if (p > 0) { curW++; curL = 0; maxW = Math.max(maxW, curW); }
    else if (p < 0) { curL++; curW = 0; maxL = Math.max(maxL, curL); }
    else { curW = 0; curL = 0; }
  }

  return {
    n, totalPnl, winners: wins.length, losers: losses.length, winRate, avgPnl,
    profitFactor, avgWin, avgLoss, expectancy: avgPnl, best, worst,
    maxDrawdownAbs: maxDDAbs, maxDrawdownPct: maxDDPct, sharpe,
    grossProfit, grossLoss, maxWinStreak: maxW, maxLossStreak: maxL,
  };
}

export function groupByMonth(trades) {
  const map = new Map();
  for (const t of trades) {
    if (!t.time) continue;
    const key = `${t.time.getFullYear()}-${String(t.time.getMonth() + 1).padStart(2, '0')}`;
    const e = map.get(key) || { month: key, count: 0, pnl: 0, winners: 0, losers: 0 };
    e.count++; e.pnl += t.pnl;
    if (t.pnl > 0) e.winners++; else if (t.pnl < 0) e.losers++;
    map.set(key, e);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function cumulativeCurve(trades) {
  let cum = 0, peak = 0;
  const arr = [];
  trades.forEach((t, i) => {
    cum += t.pnl;
    if (cum > peak) peak = cum;
    const dd = peak > 0 ? peak - cum : 0;
    arr.push({
      idx: i + 1,
      label: t.time ? `${t.time.getMonth() + 1}/${t.time.getDate()}` : `#${i + 1}`,
      cum: Math.round(cum * 100) / 100,
      peak: Math.round(peak * 100) / 100,
      drawdown: Math.round(dd * 100) / 100,
    });
  });
  return arr;
}

export function splitBySource(trades) {
  const manual = trades.filter((t) => !t.isAuto);
  const auto = trades.filter((t) => t.isAuto);
  return { manual: computeOverview(manual), auto: computeOverview(auto) };
}