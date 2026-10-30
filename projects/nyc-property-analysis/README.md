# Murray Hill Property Sales Analysis

Historical R analysis of NYC property sales, focusing on Murray Hill. It compares pre-2020 sales with sales from 2020 onward, clusters observations using standardized price and gross square footage, and compares selected building classes with two-sample t-tests.

**Methods:** tidyverse cleaning, descriptive summaries, correlation, k-means with three clusters, scatterplots/boxplots, and Welch two-sample t-tests.

Run `analysis.R` in RStudio with `tidyverse` installed and choose your authorized `all_nyc_data.csv` when prompted. The original script uses `file.choose()` and preserves the historical filters and class choices. The 150 MB source dataset and address-level records are not included.

This is the recovered coursework script. It has not been rerun in R during archive preparation. Missing-value handling and the suitability of the selected building classes should be reviewed before reusing the analysis.
