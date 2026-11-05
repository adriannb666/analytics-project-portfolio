# Reproduction: Murray Hill property sales

**Status: reproduced. Every figure in the submitted assignment matches.**

`nyc_property.py` is a line-for-line Python port of [`analysis.R`](../analysis.R). It applies the same filters: Murray Hill, tax class 1 or 2, no condos, sale price above $10,000, and gross square feet above 100. It uses R's `fivenum` hinges, `scale()` with n − 1, k-means with k = 3 and 25 starts, and Welch t-tests. It was run on the original 150 MB `all_nyc_data.csv`, which is not included here. Run `python3 nyc_property.py all_nyc_data.csv`. The full output is in [`output.txt`](output.txt).

| Quantity | Submitted assignment (AD 571, Oct 2026) | Reproduction |
| --- | --- | --- |
| Sales from 2020 onward | 88 | 88 (60 before 2020) |
| Mean sale price, before 2020 / from 2020 | $10,354,870.95 / $11,999,096.10 | $10,354,870.95 / $11,999,096.10 |
| Mean gross sq ft, before 2020 / from 2020 | 13,587.72 / 16,345.89 | 13,587.72 / 16,345.89 |
| Median price, before 2020 / from 2020 | $5,171,250 / $4,400,050 | $5,171,250 / $4,400,050 |
| Median gross sq ft, before 2020 / from 2020 | 5,671.50 / 4,956.50 | 5,671.5 / 4,956.5 |
| SD of sale price, before 2020 / from 2020 | $17,632,710.92 / $41,553,083.59 | $17,632,710.92 / $41,553,083.59 |
| Correlation of price and sq ft, before 2020 / from 2020 | 0.7239 / 0.8537 | 0.7239 / 0.8537 |
| k-means cluster sizes | 1 / 136 / 11 | 1 / 136 / 11 |
| Cluster means | $380.6M & 407,555 sq ft; $7.26M & 5,863; $28.17M & 95,340 | Same |
| Most common building classes | C5 (25), A4 (19) | C5 (25), A4 (19) |
| Welch t-test on price, C5 vs A4 | $10.81M vs $4.26M, p = 0.07451 | p = 0.07451 |
| Welch t-test on sq ft, C5 vs A4 | 5,734.76 vs 3,139.63, p = 2.616 × 10⁻⁷ | p = 2.616 × 10⁻⁷ |

R's k-means uses Hartigan–Wong and its own random stream, so cluster numbering can differ between runs. The partition and its means are the same.
