// 杠杆仓位能活多久：随机时间、随机方向开仓，统计多久被强平
// 数据：币安 BTCUSDT 5 分钟，2020-01-01 ~ 2026-11-11（UTC）
// 假设：逐仓、不补保证金、维持保证金率 0.4%，爆仓距离 = 1/杠杆 − 0.4%；不计手续费和资金费率
// 运行：node leverage_survival.mjs   输出 results.json
import fs from "node:fs";
import { getKlines } from "../common/binance.mjs";

const START = Date.UTC(2020, 0, 1), END = Date.UTC(2026, 10, 12), STEP = 300000;
const K = await getKlines("BTCUSDT", "5m", START, END);
const N = (END - START) / STEP;
const O = new Float32Array(N).fill(NaN), H = new Float32Array(N).fill(NaN), L = new Float32Array(N).fill(NaN), C = new Float32Array(N).fill(NaN);
for (const k of K) { const i = (k.t - START) / STEP; O[i] = k.o; H[i] = k.h; L[i] = k.l; C[i] = k.c; }
for (let i = 1; i < N; i++) if (Number.isNaN(C[i])) O[i] = H[i] = L[i] = C[i] = C[i - 1];   // 交易所停机的缺口：按上一根收盘价补平

// 小时级高低点，用来加速扫描
const NH = Math.floor(N / 12), HH = new Float32Array(NH), HL = new Float32Array(NH);
for (let h = 0; h < NH; h++) { let a = -Infinity, b = Infinity; for (let k = h * 12; k < h * 12 + 12; k++) { if (H[k] > a) a = H[k]; if (L[k] < b) b = L[k]; } HH[h] = a; HL[h] = b; }

const LEV = [2, 3, 5, 10, 20, 50, 100], MMR = 0.004, D = LEV.map(l => 1 / l - MMR);
const order = LEV.map((_, i) => i).sort((a, b) => D[a] - D[b]), nT = LEV.length;
const HZ = 105120 /* 365 天 */, NE = 150000, maxStart = N - HZ;
let seed = 20261112;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const ent = new Int32Array(NE), dir = new Int8Array(NE), life = LEV.map(() => new Int32Array(NE));   // life = 0 表示一年内没爆
const fav7 = new Int8Array(NE), fav30 = new Int8Array(NE);
for (let e = 0; e < NE; e++) {
  const i = Math.floor(rnd() * maxStart), d = rnd() < 0.5 ? 1 : -1; ent[e] = i; dir[e] = d;
  const p = O[i]; let idx = 0, k = i; const end = i + HZ;
  while (k < end && idx < nT) {
    if (k % 12 === 0 && k + 12 <= end) { const h = k / 12; const adv = d === 1 ? (p - HL[h]) / p : (HH[h] - p) / p; if (adv < D[order[idx]]) { k += 12; continue; } }
    const adv = d === 1 ? (p - L[k]) / p : (H[k] - p) / p;
    while (idx < nT && adv >= D[order[idx]]) { life[order[idx]][e] = k - i + 1; idx++; }
    k++;
  }
  fav7[e] = (C[i + 2015] - p) * d > 0 ? 1 : 0; fav30[e] = (C[i + 8639] - p) * d > 0 ? 1 : 0;
}

const CP = { "1h": 12, "1d": 288, "7d": 2016, "30d": 8640, "90d": 25920, "365d": 105120 };
const surv = (a, T, mask) => { let s = 0, n = 0; for (let e = 0; e < NE; e++) { if (mask && !mask(e)) continue; n++; if (a[e] === 0 || a[e] > T) s++; } return +(s / n * 100).toFixed(2); };
const quant = (a, p, mask) => { const v = []; for (let e = 0; e < NE; e++) { if (mask && !mask(e)) continue; v.push(a[e] === 0 ? Infinity : a[e]); } v.sort((x, y) => x - y); const x = v[Math.floor(v.length * p)]; return x === Infinity ? null : x * 5; };
const year = e => new Date(START + ent[e] * STEP).getUTCFullYear();
const right = (a, Hh, f) => { let fav = 0, favLiq = 0; for (let e = 0; e < NE; e++) if (f[e]) { fav++; if (a[e] > 0 && a[e] <= Hh) favLiq++; } return +(favLiq / fav * 100).toFixed(2); };

const results = { bars: N, entries: NE, leverages: {} };
LEV.forEach((l, j) => {
  const a = life[j];
  results.leverages[l] = {
    liqDistancePct: +(D[j] * 100).toFixed(2), medianMinutes: quant(a, 0.5), q25Minutes: quant(a, 0.25),
    survivalPct: Object.fromEntries(Object.entries(CP).map(([k, T]) => [k, surv(a, T)])),
    long365: surv(a, HZ, e => dir[e] === 1), short365: surv(a, HZ, e => dir[e] === -1),
    rightButLiquidatedPct: { "7d": right(a, 2016, fav7), "30d": right(a, 8640, fav30) },
    medianMinutesByYear: Object.fromEntries([2020, 2021, 2022, 2023, 2024, 2025].map(y => [y, quant(a, 0.5, e => year(e) === y)])),
  };
});
fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
console.table(Object.fromEntries(LEV.map(l => [l + "x", { 中位寿命_分钟: results.leverages[l].medianMinutes, ...results.leverages[l].survivalPct }])));
