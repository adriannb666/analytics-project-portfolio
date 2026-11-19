// 「CME 缺口必补」检验：周末缺口的回补率、随机对照线、以及缺口位与反方向位谁先被碰到
// 数据：币安 BTCUSDT 1 小时，2018-01-01 ~ 2026-11-18（UTC）；用现货近似 CME 期货
// 缺口 = 周日 18:00 ET 开盘价 − 周五 17:00 ET 收盘价；只统计 2026-05-29 CME 改为 7×24 之前的周末
// 运行：node cme_gap.mjs     输出 results.json、gaps.csv
import fs from "node:fs";
import { getKlines } from "../common/binance.mjs";

const START = Date.UTC(2018, 0, 1), END = Date.UTC(2026, 10, 19), STEP = 3600000, CUT = Date.UTC(2026, 4, 29);
const K = await getKlines("BTCUSDT", "1h", START, END);
const N = (END - START) / STEP;
const O = new Float64Array(N).fill(NaN), H = new Float64Array(N).fill(NaN), L = new Float64Array(N).fill(NaN), C = new Float64Array(N).fill(NaN);
for (const k of K) { const i = (k.t - START) / STEP; O[i] = k.o; H[i] = k.h; L[i] = k.l; C[i] = k.c; }
for (let i = 1; i < N; i++) if (Number.isNaN(C[i])) O[i] = H[i] = L[i] = C[i] = C[i - 1];

const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hour12: false });
const et = i => { const p = fmt.formatToParts(new Date(START + i * STEP)); return { w: p.find(x => x.type === "weekday").value, h: +p.find(x => x.type === "hour").value % 24 }; };

// 找周末：周五 16:00–17:00 这根的收盘 = 周五 17:00 价格；周日 18:00 这根的开盘 = 周日开盘价
const W = []; let fri = -1;
for (let i = 0; i < N; i++) {
  const p = et(i);
  if (p.w === "Fri" && p.h === 16) fri = i;
  if (p.w === "Sun" && p.h === 18 && fri >= 0 && i - fri < 60) { if (START + fri * STEP < CUT) W.push([fri, i]); fri = -1; }
}
// 从 si 开始，价格第一次碰到 level 用了几小时（0 = 开盘这一小时内），没碰到返回 null
const hit = (si, level, above) => { for (let k = si; k < N; k++) if (above ? H[k] >= level : L[k] <= level) return k - si; return null; };

const rows = W.map(([fi, si]) => {
  const fc = C[fi], so = O[si], gap = so - fc;
  return { t: START + fi * STEP, fc, so, gapPct: gap / fc * 100, tFill: hit(si, fc, gap < 0), tMirror: hit(si, so + gap, gap > 0) };
});

// 随机对照：随机时刻、随机方向，距离从真实缺口里抽
let seed = 11;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ctrl = [], last = W[W.length - 1][1];
for (let e = 0; e < 20000; e++) {
  const i = Math.floor(rnd() * last), g = Math.abs(rows[Math.floor(rnd() * rows.length)].gapPct) / 100, up = rnd() < 0.5;
  ctrl.push({ tFill: hit(i, O[i] * (1 + (up ? g : -g)), up) });
}

const CP = { "1h": 0, "4h": 3, "24h": 23, "1w": 167, "1m": 719, "3m": 2159, ever: Infinity };
const rate = (a, k, h) => +(a.filter(r => r[k] !== null && r[k] <= h).length / a.length * 100).toFixed(1);
const race = a => { let fill = 0, mirror = 0, same = 0; for (const r of a) { if (r.tMirror === null || (r.tFill !== null && r.tFill < r.tMirror)) fill++; else if (r.tFill === null || r.tMirror < r.tFill) mirror++; else same++; } return { fillFirst: fill, mirrorFirst: mirror, sameHour: same }; };
const med = a => { const v = a.filter(x => x !== null).sort((x, y) => x - y); return v[v.length >> 1]; };

const results = {
  weekends: rows.length,
  fillRatePct: Object.fromEntries(Object.entries(CP).map(([k, h]) => [k, rate(rows, "tFill", h)])),
  mirrorRatePct: Object.fromEntries(Object.entries(CP).map(([k, h]) => [k, rate(rows, "tMirror", h)])),
  randomLineRatePct: Object.fromEntries(Object.entries(CP).map(([k, h]) => [k, rate(ctrl, "tFill", h)])),
  race: race(rows), medianHours: { fill: med(rows.map(r => r.tFill)), mirror: med(rows.map(r => r.tMirror)) },
  raceBySize: Object.fromEntries([[0, 0.5], [0.5, 1], [1, 2], [2, 5], [5, 100]].map(([a, b]) => [`${a}-${b}%`, race(rows.filter(r => Math.abs(r.gapPct) >= a && Math.abs(r.gapPct) < b))])),
  raceByYear: Object.fromEntries([2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => [y, race(rows.filter(r => new Date(r.t).getUTCFullYear() === y))])),
  unfilled: rows.filter(r => r.tFill === null).map(r => ({ friday: new Date(r.t).toISOString().slice(0, 10), gapPct: +r.gapPct.toFixed(2), level: +r.fc.toFixed(2) })),
};
fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
fs.writeFileSync("gaps.csv", "friday_utc,friday_close,sunday_open,gap_pct,hours_to_fill,hours_to_mirror\n" +
  rows.map(r => [new Date(r.t).toISOString(), r.fc, r.so, r.gapPct.toFixed(3), r.tFill ?? "", r.tMirror ?? ""].join(",")).join("\n"));
console.log(results.fillRatePct, results.randomLineRatePct, results.race);
