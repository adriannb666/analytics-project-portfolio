# Celonis, Anaplan, and AlphaSense Employer Analysis

An exploratory predecessor case for the hackathon workflow, using Celonis as the focal company. The source includes non-destructive preprocessing and several notebook interfaces for team analysis.

The preparation package reports **758 postings** (262 / 230 / 266), **933 reviews** (345 / 302 / 286), and **66 role links** across Celonis, Anaplan, and AlphaSense. Those links indicate comparable roles rather than verified identical vacancies.

## Methods

Preserve original fields and rows; add normalized text, nullable rating fields, missingness flags, duplicate-text flags, date fields, and candidate early-career/interview flags. Separate advertisements from reviews and keep keyword flags as leads for reading rather than validated labels.

`preprocess.py` and `Three_Company_Preprocessing.ipynb` prepare the tables. The Celonis and all-review notebooks preserve alternative presentation and analysis versions. The historical variants are not all final submissions.

## Run

Install the root Python requirements. The preprocessing script expects five authorized CSVs in its directory. The Celonis notebooks expect them in `league_of_page_data/` under the notebook's working directory; some historical versions create a named workspace first. Original embedded compressed datasets were replaced with an explicit local-file check. Review the setup cell and supply files there before running.

No employee-review text or organizer dataset is distributed in this repository. Data-dependent notebooks have been inspected and sanitized; this archival pass does not claim a fresh full-dataset rerun.

## Public evidence redaction

The public copy removes frozen job/review identifiers, derived case rows, and employer-specific workplace accounts from code literals. Empty case tables retain their column definitions so the analysis methods and presentation functions remain inspectable. Configure `EXCLUDED_JOB_IDS` with a JSON list of your own authorized record IDs before reproducing an exclusion decision; the public default is empty. Recomputed totals may differ from the historical 504-posting comparison until the appropriate authorized exclusions are configured.

Historical case rows and original source are preserved locally, outside this public repository. This is a substantive privacy preparation of input data embedded in source, not a claim that all historical evidence has been published.
