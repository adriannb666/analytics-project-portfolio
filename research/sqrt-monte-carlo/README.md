# Square-Root Algorithm Monte Carlo Study

**Question:** For the averaging algorithm y ← (y + x/y)/2 with exponentially distributed inputs, which starting guess minimizes the expected squared error after 1–3 iterations?

**Result:** For E[X] = 10 the optimal fixed seed falls from 3.42 at one step to 3.00 at two and 2.41 at three. Each extra iteration cuts the error 20–40×. The rerun also showed that the two seed families studied are **mathematically equivalent**: a proportional seed αX with α = 1/c gives exactly the same iterates as a fixed seed c. The small differences in the original report were Monte Carlo noise.

**Methods:** Monte Carlo estimation with N = 200,000 draws, grid search plus bounded refinement, and a first-order Taylor approximation (R).

**Reproduced:** ✅ All 12 optimal seeds match the report. See [reproduction results](reproduction/RESULTS.md). The final R script was not recovered, so the reproduction reimplements the procedure in the report's Appendix A. The recovered R fragments are in `archive/` ([SOURCE_INDEX.md](SOURCE_INDEX.md)).

Team project: Jiangnan Ni, Xiaoran Pu and Yitian Zhang (Math 336 Applied Probability, Kenyon College, 2025).
