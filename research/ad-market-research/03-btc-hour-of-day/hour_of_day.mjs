// 比特币分时统计：每个小时 / 每个星期几的平均涨跌、上涨概率、t 值、波动和成交额占比
// 数据：币安 BTCUSDT 1 小时，2020-01-01 ~ 2026-11-08（UTC）
// 运行：node hour_of_day.mjs     输出 results.json
import fs from "node:fs";
import { getKlines } from "../common/binance.mjs";

const START = Date.UTC(2020, 0, 1), END = Date.UTC(2026, 10, 9);
const K = await getKlines("BTCUSDT", "1h", START, END);

const fET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", weekday: "short", hour12: false });
const rows = K.map(k => {
  const bj = new Date(k.t + 8 * 3600e3);                       // 北京时间（无夏令时）
  const p = fET.formatToParts(new Date(k.t));
  return {
    t: k.t, y: new Date(k.t).getUTCFullYear(),
    bh: bj.getUTCHours(), bw: bj.getUTCDay(),                  // 北京小时、北京星期（0 = 周日）
    eh: +p.find(x => x.type === "hour").value % 24,            // 美东小时（自动处理夏令时）
    ew: p.find(x => x.type === "weekday").value,               // 美东星期
    r: Math.log(k.c / k.o) * 1e4,                              // 本小时开盘到收盘的对数收益，单位：基点
    v: k.qv,
  };
});

function stats(a) {
  const n = a.length, m = a.reduce((s, x) => s + x.r, 0) / n;
  const sd = Math.sqrt(a.reduce((s, x) => s + (x.r - m) ** 2, 0) / (n - 1));
  return { n, meanBp: +m.toFixed(2), t: +(m / (sd / Math.sqrt(n))).toFixed(2),
    upPct: +(a.filter(x => x.r > 0).length / n * 100).toFixed(1),
    absBp: +(a.reduce((s, x) => s + Math.abs(x.r), 0) / n).toFixed(1), vol: a.reduce((s, x) => s + x.v, 0) };
}
function by(key, filter = () => true) {
  const g = {};
  for (const x of rows) if (filter(x)) (g[key(x)] ||= []).push(x);
  const out = Object.fromEntries(Object.entries(g).map(([k, a]) => [k, stats(a)]));
  const tv = Object.values(out).reduce((s, o) => s + o.vol, 0);
  for (const o of Object.values(out)) { o.volSharePct = +(o.vol / tv * 100).toFixed(2); delete o.vol; }
  return out;
}

const ETF = Date.UTC(2024, 0, 11);     // 美国现货比特币 ETF 上市
const CME247 = Date.UTC(2026, 4, 29, 22);  // CME 加密期货改为 7×24（2026-05-29 起）
const sum = f => rows.filter(f).reduce((s, x) => s + x.r, 0);

const results = {
  bars: rows.length, firstOpen: K[0].o, lastClose: K[K.length - 1].c,
  byBeijingHour: by(x => x.bh), byEasternHour: by(x => x.eh), byBeijingWeekday: by(x => x.bw),
  byYearEasternHour: Object.fromEntries([2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => [y, by(x => x.eh, x => x.y === y)])),
  preEtfEasternHour: by(x => x.eh, x => x.t < ETF), postEtfEasternHour: by(x => x.eh, x => x.t >= ETF),
  et17ByEasternWeekday: by(x => x.ew, x => x.eh === 17),
  et17AfterCme247: by(x => x.eh, x => x.t >= CME247)["17"],
  heatmapBeijing: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(w => [w, by(x => x.bh, x => x.bw === w)])),
  totalLogBp: +sum(() => true).toFixed(0), et17LogBp: +sum(x => x.eh === 17).toFixed(0),
};
fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
const e = results.byEasternHour["17"];
console.log(`美东 17 点：平均 ${e.meanBp} 基点，t = ${e.t}，上涨概率 ${e.upPct}%`);
console.log(`这一小时占全部对数收益：${(results.et17LogBp / results.totalLogBp * 100).toFixed(1)}%`);
