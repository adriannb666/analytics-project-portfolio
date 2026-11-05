# Reproduction check

**Status: reproduced on the original organizer data (November 2026). All aggregate outputs match the saved competition outputs exactly.**

`analysis.py` was run without changes on the five authorized organizer CSV files. The only addition was a small local stand-in for `IPython.display`, because IPython could not be installed in the run environment; it prints tables instead of rendering them and does not affect any calculation. Each new output table was then compared row by row with the outputs saved during the competition.

| Output | Result |
| --- | --- |
| `sample_scope.csv` (Accenture 157, Booz Allen Hamilton 217, Capgemini 131 postings) | Identical |
| `job_candidate_counts.csv`, `job_candidate_percent.csv` | Identical |
| `job_unique_text_sensitivity_percent.csv` | Identical |
| `review_subrating_summary.csv` | Identical |
| `review_theme_mentions_SCREENING.csv` | Identical |
| `role_link_counts.csv` | Identical |
| `onboarding_exclusion_sensitivity.csv` | Identical |
| Five figures (`01`–`05`) | Regenerated without errors |

The organizer data, row-level outputs and figures are not published here, in line with the [data policy](../../DATA_POLICY.md). The human-validation audit remains incomplete (0 of 30 records checked), so no classification accuracy is reported.
