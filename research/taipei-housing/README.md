# New Taipei Housing Price Regression (NHPA)

**Question:** What drives house price per unit area in Sindian District, New Taipei City? The predictors are transaction date, house age, distance to the MRT, nearby convenience stores and location.

**Result:** The final model explains **72.5%** of the variation in log price. Each year of house age lowers price by about 0.66%. Distance to the MRT has the strongest effect, and convenience stores add less value the farther a home is from a station (significant interaction, p = 0.003). Longitude adds nothing once latitude is included (p = 0.94).

**Methods:** Multiple regression with a square-root transformation of distance and a log transformation of price, an interaction term, nested F-tests, VIF checks and residual diagnostics (R).

**Reproduced:** ✅ Rerun on the public UCI dataset. The rerun confirms every modeling decision noted in the script and found one bug: m3 referred to an undefined variable `Longitude_sqr`. See [reproduction results](reproduction/RESULTS.md).

Files: `archive/recovered_05.R` is the main analysis. The others are diagnostics and plotting snippets that need the fitted model ([SOURCE_INDEX.md](SOURCE_INDEX.md)). `NHPA.csv` is the UCI Real Estate Valuation dataset with renamed columns.
