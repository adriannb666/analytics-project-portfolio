# Gold and Bitcoin Trading Strategy

Three-person project using EMA rules, VaR/CVaR portfolio constraints, and transaction costs in a 2016-2021 simulation. Historical return figures are not current or independently reproduced here.

**Archive status:** The full historical Python EMA/VaR/CVaR backtest has now been recovered, alongside MATLAB indicator/backtest fragments and LaTeX report fragments.

See [SOURCE_INDEX.md](SOURCE_INDEX.md) for recovered files. Numbering reflects extraction, not a verified release sequence. Team work and AI-assisted source are preserved as historical material.

## Recovered Python backtest

[ema_var_cvar_backtest.py](archive/ema_var_cvar_backtest.py) is the original 412-line script pasted into an earlier message of the project conversation. It includes normal-model risk calculations, constrained portfolio-weight optimization, a holding comparator, EMA trading with commissions, plots, and maximum drawdown. Recovery changed line endings only; it did not rewrite the algorithm.

Install the root Python requirements. From this project folder, supply your own `LBMA-GOLD.csv` (`Date`, `USD (PM)`) and `BCHAIN-MKPRU.csv` (`Date`, `Value`), then run:

```sh
python archive/ema_var_cvar_backtest.py
```

Dates use `%m/%d/%y`. The original loop assumes each retained gold date exists in the Bitcoin series. These data files are not bundled.

## Reuse and limits

Python syntax has been checked; the historical data experiment has not been rerun. The original implementation uses full-sample return estimates, maximizes the Bitcoin weight, and uses hard-coded EMA allocation weights rather than directly taking the optimizer output. Its normal-model VaR/CVaR expressions use the upper return tail, so they require review before interpretation as downside loss measures. The EMA trades use same-date prices/signals, and the plotted value series precedes final liquidation commissions. Comparator and strategy evaluation periods also differ because of EMA warm-up. These original choices are retained for archival accuracy; performance claims are not revalidated here.

The MATLAB fragments cover data loading, moving averages, crossover signals, RSI/StochRSI, and small portfolio simulations. Historical report prose is a draft, not independently verified evidence of performance.
