# Yitian (Adrian) Zhang | Analytics & Quantitative Research Portfolio

M.S. Applied Business Analytics (in progress), Boston University · B.A. Applied Mathematics, Kenyon College

Projects in business analytics, optimization, statistics and quantitative finance. **12 of the projects below have been rerun from source and match their originally reported results** ([reproduction summary](REPRODUCTION.md)).

[All 15 projects](PROJECTS.md) · [Reproduction results](REPRODUCTION.md) · [Data and attribution](DATA_POLICY.md) · [中文简介](README.zh-CN.md)

## Featured projects

| Project | Question → result | Tools |
| --- | --- | --- |
| [Early-career talent benchmarking](projects/early-career-talent) 🏆 | How can Accenture improve its offer and recruiting message to early-career talent? Benchmarked 505 postings and employee reviews against Booz Allen and Capgemini, then proposed two pilot programs. **2026 BU ABA Hackathon champion team.** | Python, text screening, evidence review |
| [Gold & Bitcoin trading strategy](research/gold-bitcoin-strategy) | 2022 MCM Problem C: a VaR/CVaR-constrained portfolio with EMA signals grows $1,000 to $13,236 (2016–2021) and cuts the maximum drawdown from 81% to 47%. | Python, SciPy optimization, risk metrics |
| [Murray Hill property sales](projects/nyc-property-analysis) | NYC sales before and from 2020: the median price fell while the mean rose; k-means isolates outliers; Welch t-tests compare building classes. | R, k-means, hypothesis testing |
| [Airline fleet optimization](research/airline-optimization) | Integer program choosing aircraft and routes under a $160M budget: 6 + 4 aircraft, $163,600 daily profit. | MATLAB, LP / MILP |
| [Loan approval prediction](research/loan-approval) | A least-squares classifier reaches 0.89 accuracy against a 0.73 baseline; removing credit score drops it to 0.82. | MATLAB, linear algebra |
| [Trading research & risk terminal](projects/trading-terminal) | A web app for trading plans, position sizing, pre-trade checks, journals and DEX account risk monitoring. | React, TypeScript, Base44 |

## Optimization, statistics and modeling

| Project | Result | Reproduced |
| --- | --- | --- |
| [Biogas plant scheduling (CPM)](research/construction-scheduling) | 38-week schedule; corrected a published paper's four critical paths to two | ✅ |
| [Fish-tank inventory DP](research/fish-tank-dp) | Optimal 7-day ordering policy; robust to demand shifts (about 2.5% loss) | ✅ |
| [Square-root algorithm Monte Carlo](research/sqrt-monte-carlo) | Optimal starting seeds for 1–3 iterations; showed the two seed families are equivalent | ✅ |
| [Auto MPG: OLS vs ridge](research/auto-mpg) | Regularization gives no gain on this data (RMSE 4.14) | ✅ |
| [New Taipei housing regression](research/taipei-housing) | Log-price model with R² = 0.725; MRT access dominates | ✅ |
| [Celonis employer analysis](projects/celonis-employer-analysis) | Non-destructive preprocessing of 758 postings and 933 reviews with data-quality flags | ✅ |
| [Bitcoin dynamic allocation (capstone)](research/bitcoin-dynamic-allocation) | MDP / Bellman rebalancing policy; supporting experiments rerun, final DP code not yet recovered | Partly |

## Crypto market research (AD市场研究)

| Study | Result |
| --- | --- |
| [ICT strategy backtest](research/ad-market-research/02-ict-backtest) | 473 rule-based trades on two years of BTC 15m data: −57R after fees; before fees it performs no better than on random-walk prices |
| [Bitcoin hour-of-day effect](research/ad-market-research/03-btc-hour-of-day) | US Eastern 5–6 pm carries about two-thirds of BTC's 2020–2026 log return (t = 4.97), but fees erase it as a trade |
| [Leverage survival simulation](research/ad-market-research/04-leverage-survival) | 1.05 million random BTC positions: median life is 4.6 hours at 100x; 85% of 100x positions with the right 7-day direction are liquidated first |

All four studies, with code that re-downloads Binance public data, are in [`research/ad-market-research`](research/ad-market-research).

Also included: the [TVEM Bands](projects/tvem-bands) TradingView indicator, a [B-SIM marketing case](projects/bsim-marketing), and supporting code ([Python](practice/python-fundamentals), [R regression](practice/r-regression), [indicator conversions](practice/indicator-conversions), [MATLAB](practice/matlab-image-arithmetic), a [résumé generator](tools/resume-generator)).

## Running the code

Python dependencies are listed in `requirements.txt`. Each `reproduction/` folder has a script, its full output, and a RESULTS page that compares the rerun with the original report and names the public dataset used. Restricted competition data and the NYC sales file are not distributed.

Team projects credit their members. AI assistance in coding and documentation is disclosed in the project pages. Historical simulations are research exercises, not claims of live trading performance. The archive-preparation records are kept in [`docs/`](docs).
