# Early-Career Talent Benchmarking

**🏆 1st place, Boston University ABA Hackathon 2026 · Team League of Page · Python · Oct 2026**

## Business question

How can Accenture improve its offering for early-career hires, and the messages it uses to recruit them? We compared what its job postings promise with what employees report, and benchmarked both against Booz Allen Hamilton and Capgemini.

## Data

The data came from the competition organizers and is not redistributed here.

| Source | Records |
| --- | ---: |
| Job postings (3 employers) | 505 raw; 504 in the main comparison (1 excluded because the employer was uncertain) |
| Employee reviews | 1,245 |
| Review-to-role links, organization table, data dictionary | supporting tables |

## Method

1. **Validate:** check company and record IDs and missing values, and keep postings and reviews as separate denominators.
2. **Posting baseline:** measure what each employer *advertises* before looking at reviews.
3. **Theme screening:** tag three themes with explicit keyword dictionaries and regular expressions: career development, workload/flexibility, and compensation/benefits. Compute mention rates by employer and by source.
4. **Evidence checks:** deduplicate text, run sensitivity analysis by role, date and location, and use an offline review form ([demo](tools/review_form_demo.html), with fictional records) for manual spot checks.
5. **Benchmark and recommend:** compare the focal employer with its peers, then turn the gaps into pilot programs.

## Recommendations

1. **Tie training to the first project.** New hires' onboarding training should lead directly into their first client assignment, so that what is learned is used right away.
2. **Protect learning time.** Make development time usable in practice, not just advertised, and track how much of it new hires actually use.

## Limits

Keyword mentions measure what people *talk about*. They do not measure sentiment, and they do not prove an employer keeps its promises. The results are descriptive, and no hiring or retention impact is claimed.

## Files

| File | Purpose |
| --- | --- |
| [`early_career_talent.ipynb`](early_career_talent.ipynb) | Final team notebook: loading, theme screening, charts, sensitivity, recommendations |
| [`analysis.py`](analysis.py) | Earlier script version of the analysis |
| [`notebook_drafts/`](notebook_drafts) | Intermediate team drafts, kept for reference |
| [`tools/review_form_demo.html`](tools/review_form_demo.html) | Offline manual-review form that exports labels to CSV |

To run it, put the five organizer CSVs beside the notebook or set `HACKATHON_DATA_DIR`, then run all cells. This was a team project. AI assisted with coding, dictionary drafting and translation.
