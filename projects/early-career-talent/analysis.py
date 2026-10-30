from pathlib import Path
import json, re, hashlib, sys, platform
import pandas as pd
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
from IPython.display import display
DATA = Path('.')
OUTPUT = Path('analysis_outputs')
OUTPUT.mkdir(exist_ok=True)
FILENAMES = ['organizations.csv', 'job_postings.csv', 'reviews.csv', 'review_job_role_links.csv', 'data_dictionary.csv']

def locate(name):
    exact = DATA / name
    if exact.exists():
        return exact
    matches = sorted(DATA.glob('*-' + name))
    if len(matches) == 1:
        return matches[0]
    return None
if any((locate(name) is None for name in FILENAMES)):
    try:
        from google.colab import files
        print('Please upload the five original CSV files together.')
        files.upload()
    except ImportError:
        pass
paths = {name: locate(name) for name in FILENAMES}
assert all(paths.values()), 'Missing CSV files. Put the five CSV files beside the notebook.'
organizations = pd.read_csv(paths['organizations.csv'], dtype=str).fillna('')
jobs_all = pd.read_csv(paths['job_postings.csv'], dtype=str).fillna('')
reviews_all = pd.read_csv(paths['reviews.csv'], dtype=str).fillna('')
links_all = pd.read_csv(paths['review_job_role_links.csv'], dtype=str).fillna('')
dictionary = pd.read_csv(paths['data_dictionary.csv'], dtype=str).fillna('')
PACK = 'consulting_services'
companies = organizations[organizations.suggested_case_pack.eq(PACK)].copy()
ids = set(companies.organization_id)
jobs = jobs_all[jobs_all.organization_id.isin(ids)].copy()
reviews = reviews_all[reviews_all.organization_id.isin(ids)].copy()
links = links_all[links_all.organization_id.isin(ids)].copy()
ORDER = ['Accenture', 'Booz Allen Hamilton', 'Capgemini']
COLORS = {'Accenture': '#6954d8', 'Booz Allen Hamilton': '#26968f', 'Capgemini': '#e6a145'}
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False, 'figure.facecolor': 'white', 'savefig.facecolor': 'white'})
print('All records:', len(reviews_all), len(jobs_all), len(organizations), len(links_all))
assert jobs.job_id.is_unique and reviews.review_id.is_unique, 'Duplicate source IDs; investigate before proceeding.'
assert len(companies) == 3
manifest = {name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for name, p in paths.items()}
(OUTPUT / 'input_manifest.json').write_text(json.dumps(manifest, indent=2))
print('No raw input file is altered. No review-posting Cartesian join is used.')
scope = []
for name in ORDER:
    a = jobs[jobs.organization_name.eq(name)]
    b = reviews[reviews.organization_name.eq(name)]
    meta = companies[companies.organization_name.eq(name)].iloc[0]
    assert len(a) == int(meta.job_rows) and len(b) == int(meta.review_rows), f'Count mismatch: {name}'
    scope.append({'company': name, 'postings': len(a), 'reviews': len(b), 'early_career_title_signals': a.early_career_title_signal.str.lower().eq('true').sum(), 'missing_review_role': b.reviewer_job_title.eq('').sum(), 'missing_review_location': b.reviewer_location.eq('').sum(), 'missing_posting_country_code': a.countryiso.eq('').sum(), 'repeated_description_text': a.text_sha256.duplicated().sum(), 'review_start': b.review_date.min(), 'review_end': b.review_date.max()})
scope = pd.DataFrame(scope)
display(scope)
scope.to_csv(OUTPUT / 'sample_scope.csv', index=False)
fig, ax = plt.subplots(figsize=(9, 4.2))
x = np.arange(3)
w = 0.34
ax.bar(x - w / 2, scope.postings, w, label='Job postings', color='#6954d8')
ax.bar(x + w / 2, scope.reviews, w, label='Employee reviews', color='#26968f')
for i, row in scope.iterrows():
    ax.text(i - w / 2, row.postings + 7, str(row.postings), ha='center')
    ax.text(i + w / 2, row.reviews + 7, str(row.reviews), ha='center')
ax.set(xticks=x, xticklabels=ORDER, ylabel='Source records', ylim=(0, 490), title='01 | Separate sources, explicit denominators')
ax.legend(frameon=False, ncol=2)
fig.tight_layout()
fig.savefig(OUTPUT / '01_source_counts.png', dpi=180)
plt.show()
JOB_PATTERNS = {'career': '\\btraining\\b|\\bmentorship\\b|\\bmentoring\\b|career development|career growth|professional development|tuition assistance', 'flex': 'hybrid work|remote work|flexible working|flexible hours|work.life balance|work from home', 'benefits': 'health insurance|medical coverage|paid time off|paid parental leave|retirement|401\\s*\\(?k\\)?|tuition reimbursement'}
candidate_cols = []
for theme, pattern in JOB_PATTERNS.items():
    col = theme + '_candidate'
    candidate_cols.append(col)
    jobs[col] = jobs.description.str.contains(pattern, case=False, regex=True)
job_counts = jobs.groupby('organization_name')[candidate_cols].sum().reindex(ORDER)
job_rates = jobs.groupby('organization_name')[candidate_cols].mean().reindex(ORDER) * 100
display(job_counts)
display(job_rates.round(1))
job_counts.to_csv(OUTPUT / 'job_candidate_counts.csv')
job_rates.to_csv(OUTPUT / 'job_candidate_percent.csv')
fig, axes = plt.subplots(1, 3, figsize=(12, 4.6), sharey=True)
labels = {'career_candidate': 'Career expressions', 'flex_candidate': 'Work flexibility expressions', 'benefits_candidate': 'Benefit expressions'}
for ax, col in zip(axes, candidate_cols):
    vals = job_rates[col]
    ax.bar(np.arange(3), vals, color=[COLORS[n] for n in ORDER])
    ax.set(xticks=np.arange(3), xticklabels=['Accenture', 'Booz Allen', 'Capgemini'], ylim=(0, 118), title=labels[col])
    ax.tick_params(axis='x', rotation=25)
    for i, n in enumerate(ORDER):
        ax.text(i, vals.loc[n] + 2, f'{job_counts.loc[n, col]}/{len(jobs[jobs.organization_name.eq(n)])}', ha='center', fontsize=9)
axes[0].set_ylabel('% of all employer postings')
fig.suptitle('02 | Keyword candidates — not confirmed promises', fontweight='bold')
fig.tight_layout()
fig.savefig(OUTPUT / '02_job_candidates.png', dpi=180)
plt.show()
unique_text = jobs.drop_duplicates(['organization_id', 'text_sha256'])
dedup_rates = unique_text.groupby('organization_name')[candidate_cols].mean().reindex(ORDER) * 100
dedup_rates.to_csv(OUTPUT / 'job_unique_text_sensitivity_percent.csv')
print('Repeated-text sensitivity (%):')
display(dedup_rates.round(1))
remote_counts = pd.crosstab(jobs.organization_name, jobs.remote_status.replace('', 'unknown')).reindex(ORDER)
remote_counts.to_csv(OUTPUT / 'raw_remote_status_NOT_VALIDATED.csv')
checks = []
for jid, patterns_check in {}.items():
    row = jobs[jobs.job_id.eq(jid)].iloc[0]
    for pat in patterns_check:
        for match in re.finditer(pat, row.description, re.I):
            checks.append({'job_id': jid, 'company': row.organization_name, 'title': row.title, 'excerpt': match.group()})
evidence_checks = pd.DataFrame(checks)
display(evidence_checks)
evidence_checks.to_csv(OUTPUT / 'context_error_examples.csv', index=False)
DIMENSIONS = {'career_opportunities': 'Career opportunities', 'work_life_balance': 'Work-life balance', 'compensation_and_benefits': 'Compensation & benefits'}

def parse_subratings(value):
    try:
        return json.loads(value) if value else {}
    except (json.JSONDecodeError, TypeError):
        return {}
parsed = reviews.subratings.map(parse_subratings)
invalid = []
for key in DIMENSIONS:
    values = pd.to_numeric(parsed.map(lambda d: d.get(key, np.nan)), errors='coerce')
    valid = values.between(1, 5)
    reviews[key] = values.where(valid)
    for idx in reviews.index[~valid]:
        invalid.append({'review_id': reviews.at[idx, 'review_id'], 'company': reviews.at[idx, 'organization_name'], 'dimension': key, 'source_value': values.at[idx], 'reason': 'missing or outside 1–5'})
pd.DataFrame(invalid).to_csv(OUTPUT / 'invalid_subrating_log.csv', index=False)
stats = []
for name in ORDER:
    for key, label in DIMENSIONS.items():
        vals = reviews.loc[reviews.organization_name.eq(name), key].dropna()
        stats.append({'company': name, 'dimension': key, 'mean': vals.mean(), 'n_valid': len(vals), 'n_total': sum(reviews.organization_name.eq(name)), 'missing_or_invalid': 415 - len(vals)})
rating_summary = pd.DataFrame(stats)
display(rating_summary.round(3))
rating_summary.to_csv(OUTPUT / 'review_subrating_summary.csv', index=False)
fig, axes = plt.subplots(1, 3, figsize=(12, 4.6), sharey=True)
for ax, (key, label) in zip(axes, DIMENSIONS.items()):
    s = rating_summary[rating_summary.dimension.eq(key)].set_index('company').reindex(ORDER)
    for i, n in enumerate(ORDER):
        ax.scatter(i, s.loc[n, 'mean'], s=85, color=COLORS[n], zorder=3)
        ax.text(i, s.loc[n, 'mean'] + 0.13, f"{s.loc[n, 'mean']:.2f}\nn={s.loc[n, 'n_valid']}", ha='center', fontsize=9)
    ax.set(xticks=range(3), xticklabels=['Accenture', 'Booz Allen', 'Capgemini'], xlim=(-0.6, 2.6), ylim=(1, 5.05), title=label)
    ax.tick_params(axis='x', rotation=25)
    ax.grid(axis='y', alpha=0.15)
axes[0].set_ylabel('Mean of valid 1–5 subratings (0 excluded)')
fig.suptitle('03 | Reported experiences — unmatched descriptive samples', fontweight='bold')
fig.tight_layout()
fig.savefig(OUTPUT / '03_review_subratings.png', dpi=180)
plt.show()
REVIEW_PATTERNS = {'career': '\\blearn\\w*\\b|\\btrain\\w*\\b|\\bmentor\\w*\\b|\\bpromot\\w*\\b|\\bcareer\\b|\\bgrowth\\b|\\bprogression\\b', 'flex': 'work.life|\\bwlb\\b|\\bovertime\\b|\\bworkload\\b|\\bhours\\b|\\bburnout\\b|\\bremote\\b|\\bhybrid\\b|\\bflexib\\w*\\b|\\bpressure\\b', 'benefits': '\\bpay\\b|\\bsalary\\b|\\bsalaries\\b|\\bcompensation\\b|\\bbenefit\\w*\\b|\\bbonus\\w*\\b|\\binsurance\\b|\\braise\\w*\\b|\\bhike\\w*\\b|\\bpension\\b'}
mention_rows = []
for name in ORDER:
    g = reviews[reviews.organization_name.eq(name)]
    for theme, pat in REVIEW_PATTERNS.items():
        for field in ['pros', 'cons']:
            count = g[field].str.contains(pat, case=False, regex=True).sum()
            mention_rows.append({'company': name, 'theme': theme, 'field': field, 'n_mentions': int(count), 'n_reviews': len(g), 'pct_of_all_reviews': 100 * count / len(g)})
review_mentions = pd.DataFrame(mention_rows)
review_mentions.to_csv(OUTPUT / 'review_theme_mentions_SCREENING.csv', index=False)
display(review_mentions.round(1))
review_text = reviews[['summary', 'pros', 'cons']].agg(' '.join, axis=1)
reviews['onboarding_candidate'] = review_text.str.contains('onboard|i-cap|laptop allocation', case=False, regex=True)
onboarding = reviews.groupby('organization_name').onboarding_candidate.agg(['sum', 'count']).reindex(ORDER)
onboarding['pct'] = 100 * onboarding['sum'] / onboarding['count']
onboarding.to_csv(OUTPUT / 'onboarding_composition_SCREENING.csv')
display(onboarding.round(1))
fig, ax = plt.subplots(figsize=(9, 4.2))
ax.barh(range(3), onboarding['pct'], color=[COLORS[n] for n in ORDER])
ax.set(yticks=range(3), yticklabels=ORDER, xlim=(0, 100), xlabel='% of 415 reviews', title='04 | Review composition differs: onboarding-related expressions')
ax.invert_yaxis()
for i, n in enumerate(ORDER):
    ax.text(onboarding.loc[n, 'pct'] + 1, i, f"{int(onboarding.loc[n, 'sum'])}/415", va='center')
fig.tight_layout()
fig.savefig(OUTPUT / '04_review_composition.png', dpi=180)
plt.show()
sens = []
for name in ORDER:
    for key in DIMENSIONS:
        for subset, mask in [('all', pd.Series(True, index=reviews.index)), ('without_onboarding_candidates', ~reviews.onboarding_candidate)]:
            v = reviews.loc[reviews.organization_name.eq(name) & mask, key].dropna()
            sens.append({'company': name, 'dimension': key, 'subset': subset, 'n_valid': len(v), 'mean': v.mean()})
pd.DataFrame(sens).to_csv(OUTPUT / 'onboarding_exclusion_sensitivity.csv', index=False)
reviews['date'] = pd.to_datetime(reviews.review_date, errors='coerce')
fig, ax = plt.subplots(figsize=(10, 4.1))
for i, name in enumerate(ORDER):
    v = reviews.loc[reviews.organization_name.eq(name), 'date']
    ax.plot([v.min(), v.max()], [i, i], lw=8, color=COLORS[name], solid_capstyle='round')
    ax.annotate(f'{v.min():%Y-%m-%d} to {v.max():%Y-%m-%d}', (v.max(), i), xytext=(8, 0), textcoords='offset points', va='center', fontsize=9)
ax.set(yticks=range(3), yticklabels=ORDER, title='05 | Different review windows limit peer comparisons', xlabel='Source review date')
ax.invert_yaxis()
ax.set_xlim(reviews.date.min() - pd.Timedelta(days=10), reviews.date.max() + pd.Timedelta(days=120))
fig.autofmt_xdate()
fig.tight_layout()
fig.savefig(OUTPUT / '05_review_dates.png', dpi=180)
plt.show()
common_start = reviews.groupby('organization_name').date.min().max()
common_end = reviews.groupby('organization_name').date.max().min()
print('Common review window:', 'NONE' if common_start > common_end else (common_start, common_end))
link_rows = []
score_sensitivity = []
window_180 = links.within_180_days.str.lower().eq('true')
location_agreement = links.location_match.eq('exact_location_text')
for subset, mask in [('same_title_within_1year', pd.Series(True, index=links.index)), ('same_title_within_180days', window_180), ('same_title_exact_location', location_agreement), ('same_title_180days_exact_location', window_180 & location_agreement)]:
    subset_links = links[mask]
    for name in ORDER:
        employer_ids = set(companies.loc[companies.organization_name.eq(name), 'organization_id'])
        g = subset_links[subset_links.organization_id.isin(employer_ids)]
        matched_reviews = reviews[reviews.review_id.isin(set(g.review_id))]
        link_rows.append({'company': name, 'subset': subset, 'link_rows': len(g), 'distinct_reviews': g.review_id.nunique(), 'distinct_jobs': g.job_id.nunique()})
        for key in DIMENSIONS:
            v = matched_reviews[key].dropna()
            score_sensitivity.append({'company': name, 'subset': subset, 'dimension': key, 'n_valid': len(v), 'mean': v.mean()})
link_summary = pd.DataFrame(link_rows)
link_summary.to_csv(OUTPUT / 'role_link_counts.csv', index=False)
pd.DataFrame(score_sensitivity).to_csv(OUTPUT / 'role_link_score_sensitivity.csv', index=False)
display(link_summary)
audit_path = OUTPUT / 'human_review.csv'
if not audit_path.exists():
    rows = []
    for source, df, idcol in [('job', jobs, 'job_id'), ('review', reviews, 'review_id')]:
        for name in ORDER:
            sample = df[df.organization_name.eq(name)].sample(5, random_state=20261023)
            for _, row in sample.iterrows():
                if source == 'job':
                    text = row.description
                    title = row.title
                    date = row.posted_at
                    pats = JOB_PATTERNS
                else:
                    text = 'SUMMARY: ' + row.summary + '\nPROS: ' + row.pros + '\nCONS: ' + row.cons + '\nADVICE: ' + row.advice_to_management
                    title = row.reviewer_job_title
                    date = row.review_date
                    pats = REVIEW_PATTERNS
                record = {'source': source, 'source_id': row[idcol], 'company': name, 'title': title, 'date': date, 'full_text': text, 'assigned_member': f'Member {len(rows) % 5 + 1}', 'human_checked': '', 'reviewer_name': '', 'interpretation_notes': ''}
                for theme, pat in pats.items():
                    record[theme + '_candidate'] = int(bool(re.search(pat, text, re.I)))
                    record[theme + '_human'] = ''
                rows.append(record)
    pd.DataFrame(rows).to_csv(audit_path, index=False)
audit = pd.read_csv(audit_path, dtype=str).fillna('')
print('Audit records:', len(audit), '— human completion must be entered by the team.')
display(audit[['assigned_member', 'source', 'source_id', 'company', 'title']])
audit = pd.read_csv(OUTPUT / 'human_review.csv', dtype=str).fillna('')
member_files = sorted(set(DATA.glob('audit_member*.csv')) | set(OUTPUT.glob('audit_member*.csv')))
for member_file in member_files:
    incoming = pd.read_csv(member_file, dtype=str).fillna('')
    required = ['source', 'source_id', 'human_checked', 'reviewer_name', 'career_human', 'flex_human', 'benefits_human', 'interpretation_notes']
    assert all((col in incoming for col in required)), f'Invalid audit export: {member_file}'
    for _, item in incoming.iterrows():
        mask = audit.source.eq(item.source) & audit.source_id.eq(item.source_id)
        assert mask.sum() == 1, f'Unknown source ID in {member_file}'
        for field in required[2:]:
            old = audit.loc[mask, field].iloc[0]
            new = item[field]
            assert not (old and new and (old != new)), f'Conflicting human annotation for {item.source_id}: {field}'
            if new:
                audit.loc[mask, field] = new
audit.to_csv(OUTPUT / 'human_review.csv', index=False)
completed = audit.human_checked.str.lower().isin(['yes', 'true', '1'])
print(f'Human-checked records: {completed.sum()}/{len(audit)}')
metrics = []
for source in ['job', 'review']:
    for theme in ['career', 'flex', 'benefits']:
        g = audit[audit.source.eq(source) & completed].copy()
        valid = g[theme + '_human'].isin(['0', '1'])
        g = g[valid]
        if not len(g):
            continue
        y = g[theme + '_human'].astype(int)
        p = g[theme + '_candidate'].astype(int)
        tp = int(((p == 1) & (y == 1)).sum())
        fp = int(((p == 1) & (y == 0)).sum())
        fn = int(((p == 0) & (y == 1)).sum())
        metrics.append({'source': source, 'theme': theme, 'n_checked': len(g), 'agreement': float((p == y).mean()), 'precision': tp / (tp + fp) if tp + fp else np.nan, 'recall': tp / (tp + fn) if tp + fn else np.nan, 'true_positive': tp, 'false_positive': fp, 'false_negative': fn})
validation = pd.DataFrame(metrics)
validation.to_csv(OUTPUT / 'human_validation_metrics.csv', index=False)
if validation.empty:
    print('No human validation results yet. Do not report classification accuracy.')
else:
    display(validation)
versions = {'python': platform.python_version(), 'pandas': pd.__version__, 'numpy': np.__version__, 'matplotlib': matplotlib.__version__}
(OUTPUT / 'environment.json').write_text(json.dumps(versions, indent=2))
print('Finished. Outputs:', OUTPUT.resolve())
print('Before submission: complete the 30-record human audit, rerun its evaluation, review the conclusions, and rehearse below 10 minutes.')
