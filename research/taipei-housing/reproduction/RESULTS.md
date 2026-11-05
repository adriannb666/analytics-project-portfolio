# Reproduction: NHPA housing regression models

**Status: rerun. The main script contains a bug that would stop it in R; with that fixed, every modeling decision in the script's comments is confirmed.**

`nhpa_lm.py` ports the main analysis script [`recovered_05.R`](../archive/recovered_05.R) to Python. It includes a small R-style `lm()` helper that reports coefficients, standard errors, p-values, R², adjusted R², F-tests, nested F-tests and VIFs. `NHPA.csv` is the UCI [Real Estate Valuation](https://archive.ics.uci.edu/dataset/477) dataset (414 sales in Sindian District, New Taipei City; CC BY 4.0) with renamed columns. The copy used is from [OLAMIDE100/House_Price_Prediction](https://github.com/OLAMIDE100/House_Price_Prediction) at commit `6c565c1`. Run `python3 nhpa_lm.py "Real estate valuation data set.xlsx"`. The full output is in [`output.txt`](output.txt).

## Bug in the original

The formula for model m3 uses `Longitude_sqr`. That variable is never created, so `lm()` stops with "object 'Longitude_sqr' not found", and m3, the nested F-test, m4 and the final model never run. The port uses `Longitude`, as m4 does, because that matches the rest of the script.

## Results

| Model | R² | Adjusted R² |
| --- | --- | --- |
| m1: full linear model | 0.5824 | 0.5762 |
| m2: √Dist2MRT | 0.6315 | 0.6261 |
| m3: + √Dist2MRT × NumConvenStores | 0.6561 | 0.6502 |
| m4: log(Price) | 0.7247 | 0.7199 |
| m4_reduced (final, Longitude dropped) | 0.7247 | 0.7206 |

| Comment in the original script | Rerun |
| --- | --- |
| "Dist2MRT … highest VIF (close to 5)" | VIF = 4.32, the highest |
| m2: "r^2 is better than the full model" | 0.6315 vs 0.5824 |
| m3: "a significant improvement when adding the interaction term" | Nested F = 29.06, p = 1.2 × 10⁻⁷ |
| "Longitude does not contribute significantly" | Nested F = 0.006, p = 0.94 |

In the final model, an extra year of house age lowers expected log price by 0.0066, which is about 0.66% per year (p < 10⁻¹¹). The negative interaction term (p = 0.003) means that convenience stores add less value the farther a home is from an MRT station.
