# Bitcoin Dynamic Portfolio Allocation

Finite-horizon Markov decision process, 11 portfolio weights, 60-day rolling return estimates, backward Bellman recursion, risk and transaction costs.

**Archive status:** Two related historical R scripts have been recovered: training/validation grid search and visualization for a constant-weight Bitcoin/cash strategy. The final finite-horizon Bellman implementation described above remains unrecovered.

## Recovered supporting source

- [constant_weight_train_validation.R](archive/constant_weight_train_validation.R): selects a constant target weight using training-period Sharpe, evaluates the held-out period, and compares full-BTC/cash benchmarks.
- [constant_weight_visualization.R](archive/constant_weight_visualization.R): plots the split, Sharpe comparisons, risk/return points, and a validation equity curve using its own simplified simulator.

Both were recovered from an October 2025 training/validation discussion. The public copies replace the personal CSV path with the `BTC_DATA_FILE` environment variable and an explicit missing-path check. Supply your own CSV with `date` (ISO date) and `close` columns. The first script uses base R; the second also requires `ggplot2`, `dplyr`, and `scales`. Run the scripts in separate R sessions because they define different helper functions with the same names.

These scripts are supporting experiments. Neither implements 60-day rolling estimates, a transition model, or backward Bellman recursion. The variable `lambda` is a target portfolio weight in these files, rather than a risk-aversion parameter.

## Historical limitations

The training script keeps the weight fixed between observations without modeling weight drift, so subsequent scheduled rebalances produce no turnover after the initial trade. The visualization simulator uses `abs(w - w)`, which makes its transaction-cost term zero, and skips the first return in each period. They therefore should not be assumed to produce identical results. Both annualize the arithmetic mean daily return rather than computing a realized geometric CAGR. Validation curves across all weights are exploratory diagnostics and should not be used for repeated tuning while still claiming an untouched validation set.

The recovered files have been checked for R syntax. The historical market-data experiment has not been reproduced; no return claim is inferred here. Newly written replacements will not be presented as recovered originals.
