# Murray Hill Property Sales Analysis

R analysis of NYC property sales, focusing on Murray Hill. It compares pre-2020 sales with sales from 2020 onward, clusters observations using standardized price and gross square footage, and compares selected building classes with two-sample t-tests.

**Methods:** tidyverse cleaning, descriptive summaries, correlation, k-means with three clusters, scatterplots/boxplots, and Welch two-sample t-tests.

Run `analysis.R` in RStudio with `tidyverse` installed and choose your authorized `all_nyc_data.csv` when prompted. The original script uses `file.choose()` and preserves the historical filters and class choices. The 150 MB source dataset and address-level records are not included.

**Key findings (AD 571):** There were 88 qualifying sales from 2020 onward. The mean price rose from $10.35M to $12.00M, but the median fell from $5.17M to $4.40M because of a few very large deals. The correlation between price and size strengthened from 0.72 to 0.85. k-means separates one $380.6M outlier, 11 large buildings and 136 typical sales. C5 buildings are significantly larger than A4 buildings (p = 2.6 × 10⁻⁷), but their prices are not significantly different (p = 0.075).

**Reproduced:** ✅ Every figure in the submitted assignment matches. See [reproduction results](reproduction/RESULTS.md). Missing-value handling and the choice of building classes should be reviewed before reusing the analysis.
