// Thanksgiving / Santa Claus rally study — S&P 500 (^GSPC), 1950–2025.
// Runs in Node 18+ (global fetch). Fetches Yahoo Finance daily closes and writes data/plot_data.json-style stats to stdout.
// Usage: node rally.mjs > data/stats.json
const URL = "https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?period1=-631152000&period2=1795000000&interval=1d";
const j = await (await fetch(URL, { headers: { "User-Agent": "Mozilla/5.0" } })).json();
const r = j.chart.result[0];
const D = r.timestamp.map((t) => new Date((t + r.meta.gmtoffset) * 1000).toISOString().slice(0, 10));
const C = r.indicators.quote[0].close;

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const pos = (a) => a.filter((x) => x > 0).length / a.length;
const yr = {};
D.forEach((d, i) => { const y = +d.slice(0, 4); if (!(y in yr)) yr[y] = [i, i]; yr[y][1] = i; });

// 4th Thursday of November
const tgDate = (Y) => { const d = new Date(Date.UTC(Y, 10, 1)); let n = 0; for (;;) { if (d.getUTCDay() === 4 && ++n === 4) return d.toISOString().slice(0, 10); d.setUTCDate(d.getUTCDate() + 1); } };

const rows = [];
for (let Y = 1950; Y <= 2025; Y++) {
  const tg = tgDate(Y);
  let w = -1; for (let i = 0; i < D.length && D[i] < tg; i++) w = i; // Wednesday before Thanksgiving
  const e = yr[Y][1]; // last trading day of Y
  rows.push({
    Y, n: e - w,
    tgRet: C[e] / C[w] - 1,                 // Wed before Thanksgiving close -> year-end close
    santaRet: C[e + 2] / C[e - 5] - 1,      // last 5 trading days + first 2 of next year (Hirsch)
    nextYr: yr[Y + 1] && Y + 1 <= 2025 ? C[yr[Y + 1][1]] / C[e] - 1 : null,
    ytdToWed: Y > 1950 ? C[w] / C[yr[Y - 1][1]] - 1 : null,
  });
}

// Monte Carlo control: each run picks one random start day in each year, same holding length
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const sim = (key, nOf, S = 10000) => {
  const real = rows.map((x) => x[key]); const rm = mean(real), rp = pos(real);
  let ge = 0, gp = 0; const ms = [];
  for (let s = 0; s < S; s++) {
    const v = rows.map((x) => { const [a, b] = yr[x.Y]; const i = a + Math.floor(rnd() * (b - a + 1)); return C[Math.min(i + nOf(x), C.length - 1)] / C[i] - 1; });
    const m = mean(v); ms.push(m); if (m >= rm) ge++; if (pos(v) >= rp) gp++;
  }
  return { realMean: rm, realUp: rp, simMean: mean(ms), pMean: ge / S, pUp: gp / S };
};

const fail = rows.filter((x) => x.nextYr !== null && x.santaRet <= 0);
const ok = rows.filter((x) => x.nextYr !== null && x.santaRet > 0);
console.log(JSON.stringify({
  range: [D[0], D[D.length - 1]],
  thanksgiving: sim("tgRet", (x) => x.n),
  santa: sim("santaRet", () => 7),
  santaFailNextYear: { n: fail.length, mean: mean(fail.map((x) => x.nextYr)), up: fail.filter((x) => x.nextYr > 0).length },
  santaOkNextYear: { n: ok.length, mean: mean(ok.map((x) => x.nextYr)), up: ok.filter((x) => x.nextYr > 0).length },
  rows,
}, null, 1));
