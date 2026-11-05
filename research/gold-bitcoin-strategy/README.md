# Gold and Bitcoin Trading Strategy

**Question (2022 MCM Problem C):** Starting with $1,000 on 9/11/2016, how should a trader move between cash, gold and Bitcoin each day, using only past prices, to grow wealth while controlling risk?

**Result:** A VaR/CVaR-constrained allocation (34.71% gold, 65.29% Bitcoin; portfolio 95% VaR 5.00%) combined with 30-day EMA trading signals grows $1,000 to **$13,236** by 9/10/2021. It also cuts the maximum drawdown from 81% (buy-and-hold) to 47%. Buy-and-hold ends higher, at $48,179, so the strategy trades return for much lower drawdown.

**Methods:** Parametric VaR/CVaR, constrained weight optimization (SciPy), EMA crossover signals with commissions, and drawdown analysis (Python).

**Reproduced:** ✅ The original script, run unchanged on the official COMAP data, matches every reported figure. See [reproduction results](reproduction/RESULTS.md).

See [SOURCE_INDEX.md](SOURCE_INDEX.md) for recovered files. Numbering reflects extraction, not a verified release sequence. Team work and AI-assisted source are preserved as historical material.

## Python backtest

[ema_var_cvar_backtest.py](archive/ema_var_cvar_backtest.py) is the original 412-line script from the report appendix. It includes normal-model risk calculations, constrained portfolio-weight optimization, a holding comparator, EMA trading with commissions, plots, and maximum drawdown. Recovery changed line endings only; it did not rewrite the algorithm.

Install the root Python requirements. From this project folder, supply the official `LBMA-GOLD.csv` (`Date`, `USD (PM)`) and `BCHAIN-MKPRU.csv` (`Date`, `Value`), then run:

```sh
python archive/ema_var_cvar_backtest.py
```

Dates use `%m/%d/%y`. The original loop assumes each retained gold date exists in the Bitcoin series. These data files are not bundled.

## Reuse and limits

The original implementation uses full-sample return estimates, maximizes the Bitcoin weight, and uses hard-coded EMA allocation weights rather than directly taking the optimizer output. Its normal-model VaR/CVaR expressions use the upper return tail, so they require review before interpretation as downside loss measures. The EMA trades use same-date prices/signals, and the plotted value series precedes final liquidation commissions. Comparator and strategy evaluation periods also differ because of EMA warm-up. These original choices are kept for accuracy; the reproduction confirms the historical numbers, not their out-of-sample validity.

The MATLAB fragments cover data loading, moving averages, crossover signals, RSI/StochRSI, and small portfolio simulations. Historical report prose is a draft, not independently verified evidence of performance.
