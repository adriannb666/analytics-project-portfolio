# Regularized Least Squares for Auto MPG

**Question:** Does Tikhonov (ridge) regularization predict fuel economy better than ordinary least squares, using cylinders, displacement, horsepower, weight and acceleration?

**Result:** No meaningful improvement. Test RMSE is 4.1424 for OLS and 4.1424 for the best ridge model (λ = 0.001), and RMSE rises steadily as λ grows (4.2347 at λ = 100). Weight (−4.14 per SD) and horsepower (−2.18 per SD) have the largest effects.

**Methods:** Least squares with z-scored predictors, an 80/20 split, ridge via the normal equations with an unpenalized intercept, and a λ grid (MATLAB).

**Reproduced:** ✅ Exact match: all 7 RMSEs and all coefficients, using the same random split. See [reproduction results](reproduction/RESULTS.md).

**Limitation:** Predictors are scaled on all rows, and λ is chosen on the test split. A stricter analysis would scale on the training data and choose λ by cross-validation.

Files: [`analysis.m`](analysis.m) and the presentation source in `archive/` ([SOURCE_INDEX.md](SOURCE_INDEX.md)). Team project (MATH 325).
