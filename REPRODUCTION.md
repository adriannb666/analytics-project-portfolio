# Reproduction pass (November 2026)

Six projects were rerun and their results were compared with the original reports or saved outputs.

| Project | Method | Result |
| --- | --- | --- |
| [Early-career talent benchmarking](projects/early-career-talent/REPRODUCTION.md) | Original script on original organizer data | Exact match on all 8 aggregate tables |
| [Celonis employer analysis](projects/celonis-employer-analysis/REPRODUCTION.md) | Original script on original organizer data | Built-in checks pass; exact match |
| [Airline fleet optimization](research/airline-optimization/reproduction/RESULTS.md) | Python port of the MATLAB appendix | Exact match: $163,600/day, 6 + 4 aircraft |
| [Construction scheduling (CPM)](research/construction-scheduling/reproduction/RESULTS.md) | Python port of the MATLAB model | Exact match: 38 weeks, 2 critical paths |
| [Square-root Monte Carlo](research/sqrt-monte-carlo/reproduction/RESULTS.md) | Reimplementation of the report's Appendix A procedure | All 12 optimal seeds match; identified that the two seed families are exactly equivalent |
| [Bitcoin constant-weight experiments](research/bitcoin-dynamic-allocation/reproduction/RESULTS.md) | Python port of both R scripts on BTCUSD daily data | λ* = 1 (buy-and-hold); explains why this experiment cannot select any other weight |

MATLAB and R were not available in the run environment. The ports therefore keep the original coefficients, data and logic line for line, including known bugs where the goal is to check historical results.

## Not yet reproduced

| Project | Missing input |
| --- | --- |
| Gold/Bitcoin trading strategy | MCM 2022 Problem C data (`LBMA-GOLD.csv`, `BCHAIN-MKPRU.csv`) |
| Loan approval prediction | `loanapproval.csv` |
| NYC property analysis | R script not yet ported; data available locally |
| Bitcoin dynamic programming (capstone) | Final Bellman implementation not recovered |
| Auto MPG, fish-tank DP, TVEM Bands, NHPA housing | MATLAB, TradingView or the original datasets |
