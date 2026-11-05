# Reproduction: Auto MPG, OLS vs Tikhonov/ridge

**Status: reproduced exactly. All seven test RMSEs and all coefficients match the presentation source.**

`auto_mpg.py` is a line-for-line Python port of [`analysis.m`](../analysis.m). It drops rows with missing horsepower, z-scores the five predictors, and adds an unpenalized intercept. It uses an 80/20 split with MATLAB's `rng(325)` + `randperm`, which the port reproduces exactly as NumPy's legacy MT19937 with `argsort(rand)`. It then fits OLS and ridge for λ ∈ {0.001, 0.01, 0.1, 1, 10, 100}.

The data is the UCI Auto MPG dataset (398 rows; 392 after dropping missing horsepower). The copy used is `mpg.csv` from [mwaskom/seaborn-data](https://github.com/mwaskom/seaborn-data) at commit `71e2436`. Run `python3 auto_mpg.py mpg.csv`. The full output is in [`output.txt`](output.txt).

| Model | Test RMSE: original slides | Test RMSE: reproduction |
| --- | --- | --- |
| OLS | 4.1424 | 4.1424 |
| Ridge λ = 0.001 / 0.01 | 4.1424 / 4.1424 | 4.1424 / 4.1424 |
| Ridge λ = 0.1 / 1 | 4.1425 / 4.1428 | 4.1425 / 4.1428 |
| Ridge λ = 10 / 100 | 4.1484 / 4.2347 | 4.1484 / 4.2347 |

The coefficients also match: intercept 23.486; cylinders −0.62675; displacement −0.015291 (OLS) and −0.015426 (ridge); horsepower −2.1755; weight −4.1397; acceleration −0.46348.

As the project README notes, λ is chosen on the test split and scaling uses all rows. Ridge's "best" λ = 0.001 is therefore practically identical to OLS, and the comparison does not show that regularization helps on this data.

## Check with the original course copy

The `AUTOMPG.csv` used for the course project (398 rows with a pandas index column) was later found on Adrian's laptop. Running `auto_mpg.py` on that file gives output identical to [`output.txt`](output.txt), line for line.
