// ICT「扫流动性 + 结构转变 + FVG 入场」回测
// 数据：币安 BTCUSDT 15 分钟，2024-11-09 ~ 2026-11-08（UTC）
// 运行：node backtest.mjs        （首次运行会下载约 7 万根 K 线并缓存到 data/）
// 输出：results.json，以及终端里的汇总表
import fs from "node:fs";
import { getKlines } from "../common/binance.mjs";

const START = Date.UTC(2024, 10, 9), END = Date.UTC(2026, 10, 9);
const K = await getKlines("BTCUSDT", "15m", START, END);
const n = K.length;
const T = K.map(k => k.t), O = K.map(k => k.o), H = K.map(k => k.h), L = K.map(k => k.l), C = K.map(k => k.c);

// ---------- 摆动点（fractal）：左边严格、右边允许相等 ----------
function swings(W) {
  const hi = new Uint8Array(n), lo = new Uint8Array(n);
  for (let i = W; i < n - W; i++) {
    let a = 1, b = 1;
    for (let k = 1; k <= W; k++) {
      if (!(H[i] > H[i - k] && H[i] >= H[i + k])) a = 0;
      if (!(L[i] < L[i - k] && L[i] <= L[i + k])) b = 0;
      if (!a && !b) break;
    }
    hi[i] = a; lo[i] = b;
  }
  return { hi, lo };
}
const S5 = swings(5), S2 = swings(2), S1 = swings(1);

// ---------- 过去 5 天（480 根）高低点，不含当前 K 线 ----------
const RW = 480, rmax = new Float64Array(n), rmin = new Float64Array(n);
{
  const dq = [], dq2 = [];
  for (let i = 0; i < n; i++) {
    while (dq.length && dq[0] < i - RW) dq.shift();
    while (dq2.length && dq2[0] < i - RW) dq2.shift();
    rmax[i] = dq.length ? H[dq[0]] : NaN;
    rmin[i] = dq2.length ? L[dq2[0]] : NaN;
    while (dq.length && H[dq[dq.length - 1]] <= H[i]) dq.pop(); dq.push(i);
    while (dq2.length && L[dq2[dq2.length - 1]] >= L[i]) dq2.pop(); dq2.push(i);
  }
}

// 做空 = 把价格取负后按做多处理
const ARR = {
  1: { O, H, L, C, liq: S5.lo, ih2: S2.hi, ih1: S1.hi },
  [-1]: { O: O.map(v => -v), H: L.map(v => -v), L: H.map(v => -v), C: C.map(v => -v), liq: S5.hi, ih2: S2.lo, ih1: S1.lo },
};

function runDir(dir, P) {
  const { O, H, L, C, liq, ih2, ih1 } = ARR[dir]; const W = 5;
  const trades = []; const stats = { sweeps: 0, mss: 0, fvg: 0, filled: 0, cancelRun: 0, cancelExp: 0 };
  let active = []; let i = 600;
  for (let s = 0; s < i - W; s++) if (liq[s]) active.push(s);
  let nextAdd = i - W;
  while (i < n - 200) {
    while (nextAdd <= i - 1 - W) { if (liq[nextAdd]) active.push(nextAdd); nextAdd++; }
    active = active.filter(s => i - s <= P.liqAge);
    const swept = active.filter(s => L[s] > L[i]);
    if (!swept.length) { i++; continue; }
    active = active.filter(s => !(L[s] > L[i]));
    const lvl = Math.min(...swept.map(s => L[s])); const absP = Math.abs(C[i]);
    // 1) 扫流动性：reclaim 根 K 线内收盘收回，刺破深度 ≤ maxDepth
    let sweepLow = Infinity, lowBar = i, sb = -1, ok = false;
    for (let q = i; q <= i + P.reclaim && q < n - 2; q++) {
      if (L[q] < sweepLow) { sweepLow = L[q]; lowBar = q; }
      if ((lvl - sweepLow) / absP > P.maxDepth) break;
      if (C[q] > lvl) { ok = true; sb = q; break; }
    }
    if (!ok) { i++; continue; }
    const startScan = sb + 1; stats.sweeps++;
    // 2) 位置过滤：折价区才做多
    if (P.filter === "pd") {
      const hi = dir === 1 ? rmax[lowBar] : -rmin[lowBar], lo = dir === 1 ? rmin[lowBar] : -rmax[lowBar];
      if (!(C[sb] < (hi + lo) / 2)) { i = startScan; continue; }
    }
    // 3) 结构转变
    let consLvl = null; for (let h = lowBar - 1; h >= lowBar - 200; h--) { if (ih2[h] && H[h] > C[sb]) { consLvl = H[h]; break; } }
    let aggLvl = null; for (let h = lowBar + 1; h + 1 <= sb; h++) { if (ih1[h]) { aggLvl = H[h]; break; } }
    let m = -1;
    for (let j = sb; j <= lowBar + P.mssWin && j < n - 2; j++) {
      if (j > sb && L[j] < sweepLow) break;
      if (j > sb && aggLvl === null) { const h = j - 1; if (h > lowBar && ih1[h]) aggLvl = H[h]; }
      const lv = P.mode === "aggr"
        ? (aggLvl !== null && consLvl !== null ? Math.min(aggLvl, consLvl) : (aggLvl !== null ? aggLvl : consLvl))
        : consLvl;
      if (lv !== null && C[j] > lv) { m = j; break; }
    }
    if (m < 0) { i = startScan; continue; }
    stats.mss++;
    // 4) FVG：突破过程中最近的一个
    let fk = -1;
    for (let k = m; k >= lowBar + 1; k--) {
      if (L[k + 1] > H[k - 1] && (L[k + 1] - H[k - 1]) / absP >= P.minGap && H[k - 1] > sweepLow) { fk = k; break; }
    }
    if (fk < 0) { i = m + 1; continue; }
    stats.fvg++;
    const top = L[fk + 1], bot = H[fk - 1]; const entry = P.entry === "ce" ? (top + bot) / 2 : top;
    const stop = sweepLow - P.buf * absP; const risk = entry - stop;
    if (risk / absP < P.minRisk || risk / absP > P.maxRisk) { i = m + 1; continue; }
    const target = entry + P.R * risk;
    let f = -1; const f0 = Math.max(fk + 2, m + 1); let j = f0;
    for (; j <= m + 1 + P.fillWin && j < n - 1; j++) {
      if (L[j] <= entry) { f = j; break; }
      if (H[j] >= target) { stats.cancelRun++; break; }
    }
    if (f < 0) { if (j > m + 1 + P.fillWin) stats.cancelExp++; i = Math.max(j, m + 1); continue; }
    stats.filled++;
    // 5) 持仓管理：同一根 K 线同时碰止损和止盈 → 按止损算
    const fill = Math.min(entry, O[f]); const rk = fill - stop;
    let exit = null, ex = -1, how = "";
    if (L[f] <= stop) { exit = stop; ex = f; how = "stop"; }
    else {
      for (let k = f + 1; k < n && k <= f + P.maxHold; k++) {
        if (L[k] <= stop) { exit = Math.min(stop, O[k]); ex = k; how = "stop"; break; }
        if (H[k] >= target) { exit = target; ex = k; how = "tp"; break; }
      }
      if (exit === null) { ex = Math.min(f + P.maxHold, n - 1); exit = C[ex]; how = "time"; }
    }
    const Rg = (exit - fill) / rk; const price = Math.abs(fill);
    const feeR = (0.0002 * price + (how === "tp" ? 0.0002 : 0.0005) * Math.abs(exit)) / rk;
    trades.push({ t: T[f], sweepT: T[lowBar], dir, Rg, Rn: Rg - feeR, how, riskPct: rk / price,
      entry: Math.abs(entry), stop: Math.abs(stop), target: Math.abs(target) });
    i = ex + 1;
  }
  return { trades, stats };
}

function summ(tr) {
  tr = tr.slice().sort((a, b) => a.t - b.t); const N = tr.length; if (!N) return { N };
  const w = tr.filter(t => t.Rn > 0).length; let eq = 0, pk = 0, dd = 0, cl = 0, mcl = 0;
  for (const t of tr) { eq += t.Rn; pk = Math.max(pk, eq); dd = Math.max(dd, pk - eq); if (t.Rn < 0) { cl++; mcl = Math.max(mcl, cl); } else cl = 0; }
  const gp = tr.filter(t => t.Rn > 0).reduce((a, t) => a + t.Rn, 0), gl = -tr.filter(t => t.Rn < 0).reduce((a, t) => a + t.Rn, 0);
  const r = x => +x.toFixed(3);
  return { N, win: r(w / N), avgRg: r(tr.reduce((a, t) => a + t.Rg, 0) / N), avgRn: r(eq / N), totRn: r(eq), maxDD: r(dd), maxCL: mcl,
    PF: r(gp / gl), medRiskPct: r(tr.map(t => t.riskPct).sort((a, b) => a - b)[N >> 1] * 100),
    tp: tr.filter(t => t.how === "tp").length, stop: tr.filter(t => t.how === "stop").length, time: tr.filter(t => t.how === "time").length };
}

const BASE = { mode: "aggr", R: 2, filter: "pd", liqAge: 384, maxDepth: 0.01, reclaim: 4, mssWin: 24, minGap: 0.0003,
  entry: "top", buf: 0.0005, minRisk: 0.0015, maxRisk: 0.03, fillWin: 24, maxHold: 96 };
const run = P => { P = { ...BASE, ...P }; const a = runDir(1, P), b = runDir(-1, P); return { tr: a.trades.concat(b.trades), st: [a.stats, b.stats] }; };

// ---------- 变体 ----------
const VARIANTS = {
  "基础版（激进 + 过滤 + 2R）": {}, "保守版 MSS": { mode: "cons" }, "不做溢价/折价过滤": { filter: "none" },
  "保守版 + 不过滤": { mode: "cons", filter: "none" }, "入场改在 FVG 中线（CE）": { entry: "ce" },
  "收回时间 1 根": { reclaim: 1 }, "收回时间 2 根": { reclaim: 2 }, "收回时间 8 根": { reclaim: 8 },
  "只做 ≥0.1% 的 FVG": { minGap: 0.001 }, "止盈 1R": { R: 1 }, "止盈 1.5R": { R: 1.5 }, "止盈 3R": { R: 3 },
};
const variants = {};
for (const [k, p] of Object.entries(VARIANTS)) variants[k] = summ(run(p).tr);

// ---------- 基础版拆解 ----------
const base = run({}); const MAIN = base.tr.sort((a, b) => a.t - b.t);
const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false });
const hrET = t => +fmt.format(new Date(t)) % 24;
const sess = t => { const h = hrET(t); return (h >= 19 || h < 2) ? "亚洲盘 19-02" : (h < 8) ? "伦敦盘 02-08" : (h < 16) ? "纽约盘 08-16" : "收盘后 16-19"; };
const wk = t => { const d = new Date(t).getUTCDay(); return (d === 0 || d === 6) ? "周末" : "工作日"; };
const group = (arr, f) => { const o = {}; for (const t of arr) (o[f(t)] ||= []).push(t); return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, summ(v)])); };

const CUT = Date.UTC(2025, 10, 9); // 第一年 / 第二年分界
const y1 = MAIN.filter(t => t.t < CUT), y2 = MAIN.filter(t => t.t >= CUT);
const FILT = t => wk(t.t) === "工作日" && !sess(t.sweepT).startsWith("亚洲") && t.riskPct >= 0.005;

const results = {
  params: BASE, bars: n, funnel: base.st,
  base: summ(MAIN), byDirection: group(MAIN, t => (t.dir === 1 ? "做多" : "做空")),
  variants,
  year1: { all: summ(y1), bySession: group(y1, t => sess(t.sweepT)), byWeekday: group(y1, t => wk(t.t)),
    byRisk: group(y1, t => (t.riskPct < 0.005 ? "<0.5%" : ">=0.5%")), filtered: summ(y1.filter(FILT)) },
  year2: { all: summ(y2), bySession: group(y2, t => sess(t.sweepT)), byWeekday: group(y2, t => wk(t.t)),
    byRisk: group(y2, t => (t.riskPct < 0.005 ? "<0.5%" : ">=0.5%")), filtered: summ(y2.filter(FILT)) },
  bothYearsFiltered: summ(MAIN.filter(FILT)),
};
fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
fs.writeFileSync("trades.csv", "fill_time_utc,sweep_time_utc,direction,entry,stop,target,exit_type,R_gross,R_net\n" +
  MAIN.map(t => [new Date(t.t).toISOString(), new Date(t.sweepT).toISOString(), t.dir === 1 ? "long" : "short",
    t.entry.toFixed(2), t.stop.toFixed(2), t.target.toFixed(2), t.how, t.Rg.toFixed(4), t.Rn.toFixed(4)].join(",")).join("\n"));
console.table(Object.fromEntries(Object.entries(variants).map(([k, v]) => [k, { 笔数: v.N, 胜率: v.win, 扣费前: v.avgRg, 扣费后: v.avgRn }])));
console.log("第二年加过滤：", results.year2.filtered);
