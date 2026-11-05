# Reproduction: optimal seeds for the square-root averaging algorithm

**Status: reproduced. All 12 optimal seeds match the report. The rerun also found a point the original report missed.**

The final R script for this project was not recovered. `sqrt_mc.py` therefore reimplements the Monte Carlo procedure from Appendix A of the Math 336 report (Fall 2025) as written. It draws N = 200,000 samples X ~ Exponential(λ) with a fixed random seed, runs y_{k+1} = (y_k + X / y_k) / 2 for n steps, and estimates M_n = E[(y_n − √X)²]. It then searches a grid and refines the result with bounded scalar minimization. Run it with `python3 sqrt_mc.py`. The full output is in [`output.txt`](output.txt).

| E[X] | Seed | n | Optimal parameter (report) | Optimal parameter (rerun) | M_n (report) | M_n (rerun) |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | fixed c | 1 | 3.42 | 3.419 | 0.325 | 0.320 |
| 10 | proportional α | 1 | 0.293 | 0.2925 | 0.320 | 0.320 |
| 250 | fixed c | 1 | 17.1 | 17.11 | 8.08 | 8.16 |
| 250 | proportional α | 1 | 0.0586 | 0.0584 | 8.04 | 8.16 |
| 10 | fixed c | 2 | 3.00 | 2.990 | 0.0147 | 0.0147 |
| 10 | proportional α | 2 | 0.332 | 0.3345 | 0.0150 | 0.0147 |
| 250 | fixed c | 2 | 15.0 | 14.95 | 0.367 | 0.367 |
| 250 | proportional α | 2 | 0.0664 | 0.0669 | 0.372 | 0.367 |
| 10 | fixed c | 3 | 2.41 | 2.405 | 3.95e-4 | 3.97e-4 |
| 10 | proportional α | 3 | 0.417 | 0.4159 | 3.88e-4 | 3.97e-4 |
| 250 | fixed c | 3 | 12.1 | 12.06 | 1.03e-2 | 1.04e-2 |
| 250 | proportional α | 3 | 0.0827 | 0.0829 | 1.01e-2 | 1.04e-2 |

## Correction: the two seed families are equivalent

With a fixed seed y₀ = c, the first iterate is y₁ = (c + X/c) / 2. With a proportional seed y₀ = αX, it is y₁ = (αX + 1/α) / 2. When α = 1/c these two expressions are identical for every X, so every later iterate is identical as well. The two families therefore have **exactly the same** expected error, and the optimal values satisfy α* = 1/c*: for example, 1/3.42 = 0.292 and 1/17.1 = 0.0585.

The small gaps in the original report between the two families (0.325 vs 0.320, and 8.08 vs 8.04) are Monte Carlo noise, not a real advantage for proportional seeds. Under common random numbers the rerun gives identical values for both families. The report's statement that the families give "almost identical performance" should read "identical performance". Its Table 4, which uses "the better of the two families", is choosing between two equal values.

The report's standard-error bound assumes Var[(y_n − √X)²] < 20. That assumption does not hold for E[X] = 250 and n = 1, where M₁ is about 8. This explains why different Monte Carlo runs disagree in the second significant digit there (8.08 in the report, 8.16 here).

Team project: Jiangnan Ni, Xiaoran Pu and Yitian Zhang.
