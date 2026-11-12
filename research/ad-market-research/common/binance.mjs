// 从币安公开行情接口下载 K 线，并缓存到 data/ 目录。
// 用的是 data-api.binance.vision（只读行情镜像，在美国等地区也能访问）。
// 需要 Node.js 18+（内置 fetch）。
import fs from "node:fs";
import path from "node:path";

const BASE = "https://data-api.binance.vision/api/v3/klines";
const STEP = { "5m": 5 * 60e3, "15m": 15 * 60e3, "1h": 60 * 60e3, "4h": 4 * 60 * 60e3 };

/**
 * 返回 [{t, o, h, l, c, qv}]，t 为开盘时间（UTC 毫秒），qv 为成交额（USDT）。
 * 区间为 [startMs, endMs)。
 */
export async function getKlines(symbol, interval, startMs, endMs, cacheDir = path.join(process.cwd(), "data")) {
  const file = path.join(cacheDir, `${symbol}_${interval}_${startMs}_${endMs}.csv`);
  if (fs.existsSync(file)) return readCsv(file);

  const rows = [];
  let t = startMs;
  while (t < endMs) {
    const url = `${BASE}?symbol=${symbol}&interval=${interval}&startTime=${t}&limit=1000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const batch = await res.json();
    if (!batch.length) break;
    for (const k of batch) {
      if (k[0] >= endMs) break;
      rows.push({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], qv: +k[7] });
    }
    t = batch[batch.length - 1][0] + STEP[interval];
  }
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(file, "t,o,h,l,c,qv\n" + rows.map(r => [r.t, r.o, r.h, r.l, r.c, r.qv].join(",")).join("\n"));
  return rows;
}

export function readCsv(file) {
  const [, ...lines] = fs.readFileSync(file, "utf8").trim().split("\n");
  return lines.map(line => {
    const [t, o, h, l, c, qv] = line.split(",").map(Number);
    return { t, o, h, l, c, qv };
  });
}
