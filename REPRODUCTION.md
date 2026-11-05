# Reproduction pass (November 2026)

Twelve projects were rerun. Each result was compared with the original report, slides, submitted assignment or saved outputs.

| Project | Data | Method | Result |
| --- | --- | --- | --- |
| [Early-career talent benchmarking](projects/early-career-talent/REPRODUCTION.md) | Organizer data (not published) | Original script | Exact match on all 8 aggregate tables |
| [Celonis employer analysis](projects/celonis-employer-analysis/REPRODUCTION.md) | Organizer data (not published) | Original script | Built-in checks pass; exact match |
| [NYC property analysis](projects/nyc-property-analysis/reproduction/RESULTS.md) | NYC sales, 150 MB (not published) | Python port of the R script | Exact match: 88 sales, all means, SDs, correlations, clusters (1/136/11) and t-test p-values |
| [Gold/Bitcoin trading strategy](research/gold-bitcoin-strategy/reproduction/RESULTS.md) | MCM 2022 Problem C (public) | Original script, unchanged | Exact match: $13,236.05, weights 34.71% / 65.29%, VaR/CVaR, drawdowns |
| [Loan approval prediction](research/loan-approval/reproduction/RESULTS.md) | Kaggle loan approval (public) | Python port, MATLAB RNG reproduced | Exact match: accuracy 0.89 / 0.82, both confusion matrices |
| [Auto MPG regularization](research/auto-mpg/reproduction/RESULTS.md) | UCI Auto MPG (public) | Python port, MATLAB RNG reproduced | Exact match: all 7 RMSEs and coefficients |
| [Airline fleet optimization](research/airline-optimization/reproduction/RESULTS.md) | Model coefficients in the report | Python port of the MATLAB appendix | Exact match: $163,600/day, 6 + 4 aircraft |
| [Construction scheduling (CPM)](research/construction-scheduling/reproduction/RESULTS.md) | Zareei (2018) Table 1 | Python port of the MATLAB model | Exact match: 38 weeks, 2 critical paths |
| [Fish-tank inventory DP](research/fish-tank-dp/reproduction/RESULTS.md) | Model parameters in the script | Python port of the MATLAB script | Both optimal policies match the tables saved in the original |
| [Square-root Monte Carlo](research/sqrt-monte-carlo/reproduction/RESULTS.md) | Simulation | Reimplementation of the report's Appendix A | All 12 optimal seeds match; shows that the two seed families are exactly equivalent |
| [NHPA housing regression](research/taipei-housing/reproduction/RESULTS.md) | UCI Real Estate Valuation (public) | Python port of the R script | Found and fixed an undefined-variable bug; all modeling decisions in the script confirmed (final R² = 0.725) |
| [Bitcoin constant-weight experiments](research/bitcoin-dynamic-allocation/reproduction/RESULTS.md) | BTCUSD daily prices | Python port of both R scripts | λ* = 1 (buy-and-hold); explains why this design cannot select any other weight |

MATLAB and R were not available in the run environment. The ports keep the original coefficients, data handling and logic line for line, including known issues when the goal is to check historical results. Where the original used MATLAB's `rng` + `randperm`, the port reproduces the same random split exactly. No datasets are committed; each results page names the public source and commit used.

## Not reproduced

| Project | Reason |
| --- | --- |
| Bitcoin dynamic programming (capstone) | The final Bellman implementation (`expected_reward()`) has not been recovered |
| TVEM Bands | Pine Script indicator; runs only inside TradingView |
| Trading research terminal | Requires a private Base44 backend |
