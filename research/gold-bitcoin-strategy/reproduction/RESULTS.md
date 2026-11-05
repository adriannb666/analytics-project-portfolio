# Reproduction: gold and Bitcoin EMA trading strategy (2022 MCM Problem C)

**Status: reproduced. Every reported figure matches to the cent.**

The archived script [`ema_var_cvar_backtest.py`](../archive/ema_var_cvar_backtest.py) was run **unchanged** on the official COMAP data files `LBMA-GOLD.csv` and `BCHAIN-MKPRU.csv`. These files are not included in this repository; a public copy is in [lsilencej/MCM-2022](https://github.com/lsilencej/MCM-2022) at commit `bc6bed8`. To rerun, put the two CSV files in the working directory and run `MPLBACKEND=Agg python3 ../archive/ema_var_cvar_backtest.py`. The full output is in [`output.txt`](output.txt).

| Quantity | Original report (MATH 347, Dec 2024) | Reproduction |
| --- | --- | --- |
| Gold 95% VaR / CVaR | 1.46% / 1.82% | 1.46% / 1.82% |
| Bitcoin 95% VaR / CVaR | 7.15% / 8.88% | 7.15% / 8.88% |
| Optimized weights (gold / Bitcoin) | 34.71% / 65.29% | 34.71% / 65.29% |
| Portfolio 95% VaR / CVaR | 5.00% / 6.22% | 5.00% / 6.22% |
| Final value, 30-day EMA strategy ($1,000 start) | $13,236.05 | $13,236.05 |
| Final value, buy-and-hold | $48,178.87 | $48,178.88 |
| Maximum drawdown, EMA vs buy-and-hold | about 47% vs about 81% | 47.4% vs 81.4% |

## Reading the result

The EMA strategy cut the maximum drawdown from 81% to 47%. It also ended with about 3.6 times less money than simply holding the optimized portfolio. The report presents this as a risk-return trade-off. A reader should not take $13,236 as a claim that the strategy beat the market. The limitations listed in the strategy README still apply: parametric normal VaR, in-sample choice of EMA window and weights, and no execution delay.

Team project: Gavin Pang, Yitian Zhang and Peiyan Huang.
