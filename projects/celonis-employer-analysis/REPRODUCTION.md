# Reproduction check

**Status: reproduced on the original organizer data (November 2026). The script's built-in checks pass, and the preprocessed tables match the saved outputs exactly.**

`preprocess.py` was run without changes on the five authorized organizer CSV files.

| Output | Result |
| --- | --- |
| Built-in check: exported counts, original fields, unique IDs, linked employers, 180-day flags | PASS |
| `job_postings_preprocessed.csv` (758 rows × 47 columns) | Identical to saved output |
| `reviews_preprocessed.csv` (933 rows × 48 columns) | Identical to saved output |
| `sample_summary.csv` (Celonis 262 / 345, Anaplan 230 / 302, AlphaSense 266 / 286 postings / reviews) | Identical |
| `missingness_by_company.csv` | Identical |

No rows are removed during preprocessing. The organizer data and row-level outputs are not published here, in line with the [data policy](../../DATA_POLICY.md).
