# Early-Career Talent and Employer Benchmarking

**League of Page | 2026 BU ABA Hackathon Champion | Team project**

Research question: how can an employer improve its employment offering and recruitment messaging for early-career talent, using postings, employee accounts, and comparable employers?

Accenture is the focal employer; Booz Allen Hamilton and Capgemini provide comparison cases. The reported dataset has **505 raw postings, 504 in the main comparison, and 1,245 reviews**. One posting remains excluded from the main comparison because employer attribution is uncertain.

## Work

- Validate company IDs, record IDs, missing values, and separate source denominators.
- Establish a posting-only baseline before interpreting reviews.
- Screen career development, workload/flexibility, and compensation/benefits with explicit dictionaries and regular expressions.
- Retain source IDs, exclusions, duplicate-text checks, and role/date/location sensitivity analysis.
- Create visualizations and an offline form for human evidence review.
- Develop two proposed pilots: training aligned with the first project and usable learning time.

The findings are descriptive. A keyword mention is neither sentiment nor proof that an employer delivers a promise. The archive does not claim measured hiring or retention improvements. Saved human-validation labels were not recovered, so no precision, recall, or F1 result is asserted.

## Files and use

`analysis.py` and `League_of_Page_Consulting.ipynb` are an earlier analytical draft. Submission and `Untitled4` notebooks retain later analysis variants; they are not interchangeable releases. All historical versions are clearly archived rather than silently combined.

Install the root Python requirements, then place authorized `organizations.csv`, `job_postings.csv`, `reviews.csv`, `review_job_role_links.csv`, and `data_dictionary.csv` beside the script/notebook. Newer submission notebooks use `HACKATHON_DATA_DIR` or their own data-directory setting; inspect the first cell before running. Raw files, generated source-text reports, and notebook outputs are excluded from GitHub.

`tools/review_form_demo.html` is a standalone demonstration with six **fictional** examples replacing the original records. It can be opened locally and exports review labels to CSV.

AI assistance was used for coding, dictionaries, evidence organization, translation, and drafting; the project and award belong to the League of Page team.

## Public evidence redaction

The public copy removes frozen job/review identifiers, derived case rows, and employer-specific workplace accounts from code literals. Empty case tables retain their column definitions so the analysis methods and presentation functions remain inspectable. Configure `EXCLUDED_JOB_IDS` with a JSON list of your own authorized record IDs before reproducing an exclusion decision; the public default is empty. Recomputed totals may differ from the historical 504-posting comparison until the appropriate authorized exclusions are configured.

Historical case rows and original source are preserved locally, outside this public repository. This is a substantive privacy preparation of input data embedded in source, not a claim that all historical evidence has been published.
