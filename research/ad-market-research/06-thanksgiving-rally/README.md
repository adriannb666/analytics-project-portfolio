# 06 · Is the Thanksgiving / Santa Claus rally real? (S&P 500, 1950–2025)

**Question.** Wall Street lore says the stretch from Thanksgiving to year-end is the best of the year, and that "if Santa Claus should fail to call, bears may come to Broad and Wall." I tested both on 76 years of S&P 500 daily closes.

## Findings

| Window | Real avg | Random avg (same length) | Up years | p (mean) |
|---|---|---|---|---|
| Wed before Thanksgiving → last trading day of Dec (~24 days) | **+1.73%** | +0.88% | 53/76 | 0.04 |
| Santa rally: last 5 trading days + first 2 of January (Hirsch) | **+1.25%** | +0.26% | 58/76 | 0.0003 |

- The excess return is concentrated in the **Santa rally's 7 days** (avg +0.18%/day vs +0.036% for an ordinary day) and in the **Wednesday before Thanksgiving / Black Friday** (+0.33% / +0.28%). The Monday after Thanksgiving gives back about half (−0.29%, up only 38% of years).
- **It is fading.** By decade, the Santa rally beat an ordinary 7-day window by a wide margin in 1950s–1980s and 2000s, but not in the 2010s (+0.30% vs +0.32%) or 2020–25 (+0.28% vs +0.40%). It failed three years running (Dec 2023, 2024, 2025).
- **"Santa fails → bear market" doesn't hold.** After the 17 failed Santa rallies, the next year was still up 12 times (avg +6.7%, vs +10.2% after the 58 successful ones). Big drops followed only 3 times (1969, 2000, 2008).
- **Real but tiny.** Holding only the 7 Santa days each year turned $1 into $2.52 over 1950–2025; buy-and-hold turned it into $411 (price only). The 7 days are 2.8% of trading days but ~15% of the index's log return.

## Method

- Data: Yahoo Finance `^GSPC` daily close (price index, no dividends), 1950-01-03 → 2026-11-17.
- Thanksgiving = 4th Thursday of November. Window starts at the prior trading day's close.
- Random control: 10,000 runs; in each run, pick one random start day inside each year and hold the same number of trading days; compare the 76-year average and number of up years with the real windows.
- Caveat: several windows were tested, so treat p ≈ 0.04 with caution (multiple comparisons). Not investment advice.

## Files

- `rally.mjs` – fetches the data and computes the window returns and Monte Carlo tests (Node 18+).
- `data/plot_data.json` – per-year results, day-by-day averages and simulation histograms used for the figures.
- `plot_rally.py` – makes the 7 figures in `figures/` (Chinese labels).
- `article_zh.md` – the Zhihu article.
