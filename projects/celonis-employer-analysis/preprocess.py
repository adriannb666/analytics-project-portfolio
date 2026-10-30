"""Reproducible, non-destructive preprocessing for the selected three employers.
Run beside the five organizer CSV files. Only derived columns/files are written.
"""
from pathlib import Path
import csv, json, re, hashlib, platform, sys
import pandas as pd

NAMES = ['Celonis', 'Anaplan', 'AlphaSense']
FILES = ['organizations.csv', 'job_postings.csv', 'reviews.csv',
         'review_job_role_links.csv', 'data_dictionary.csv']
DATA = Path('.')
OUTPUT = Path('preprocess_outputs')
OUTPUT.mkdir(parents=True, exist_ok=True)

def locate(name):
    if (DATA/name).is_file():
        return DATA/name
    candidates = sorted(DATA.glob('*-' + name))
    return candidates[0] if len(candidates) == 1 else None

if any(locate(n) is None for n in FILES):
    try:
        from google.colab import files
        print('Upload the five original CSV files together.')
        files.upload()
    except ImportError:
        pass
paths = {name: locate(name) for name in FILES}
assert all(paths.values()), 'Missing original CSV files; place them beside this script/notebook.'

# Read ALL source fields as strings. Do not convert literal NA/None text to missing.
source = {name: pd.read_csv(p, dtype=str, keep_default_na=False) for name,p in paths.items()}
organizations = source['organizations.csv']
organizations = organizations[organizations.organization_name.isin(NAMES)].copy()
assert organizations.organization_name.nunique() == 3
assert organizations.organization_id.is_unique
ids = set(organizations.organization_id)
jobs = source['job_postings.csv']
jobs = jobs[jobs.organization_id.isin(ids)].copy()
reviews = source['reviews.csv']
reviews = reviews[reviews.organization_id.isin(ids)].copy()
links = source['review_job_role_links.csv']
links = links[links.organization_id.isin(ids)].copy()
assert jobs.job_id.is_unique and reviews.review_id.is_unique
assert jobs.organization_name.isin(NAMES).all() and reviews.organization_name.isin(NAMES).all()

def clean_text(value):
    # Preserve spelling, language and negation. Keep all original fields untouched.
    return re.sub(r'[ \t\u00a0]+', ' ', str(value).replace('\r\n','\n').replace('\r','\n')).strip()

def flag_missing(value):
    return not str(value).strip()

def nullable_boolean(series):
    return series.str.strip().str.lower().map({'true':True, 'false':False}).astype('boolean')

for col in ['title','description','location_text']:
    jobs[col+'_clean'] = jobs[col].map(clean_text)
jobs['description_char_count'] = jobs.description_clean.str.len()
jobs['short_description_flag'] = jobs.description_char_count.lt(1500)
jobs['missing_description_flag'] = jobs.description_clean.eq('')
jobs['missing_country_code_flag'] = jobs.countryiso.map(flag_missing)
jobs['early_career_title_flag'] = nullable_boolean(jobs.early_career_title_signal)
jobs['remote_status_raw'] = jobs.remote_status
jobs['remote_status_normalized'] = jobs.remote_status.str.strip().str.lower().replace('', 'unknown')
jobs['remote_status_requires_context_check'] = True
jobs['posting_datetime_utc'] = pd.to_datetime(jobs.posted_at, utc=True, errors='coerce',format='mixed')
jobs['posting_date_source_local'] = jobs.posted_at.str.extract(r'^(\d{4}-\d{2}-\d{2})',expand=False)
jobs['invalid_posting_date_flag'] = jobs.posted_at.ne('') & jobs.posting_datetime_utc.isna()
jobs['repeated_description_flag'] = jobs.duplicated(['organization_id','text_sha256'],keep=False)
jobs['description_occurrences_within_employer'] = jobs.groupby(['organization_id','text_sha256']).job_id.transform('size')
jobs['opening_key_duplicate_flag'] = jobs.duplicated(['organization_id','opening_dedup_key'],keep=False)

for col in ['reviewer_job_title','reviewer_location','summary','pros','cons','advice_to_management']:
    reviews[col+'_clean'] = reviews[col].map(clean_text)
reviews['review_text_clean'] = (
    'SUMMARY: '+reviews.summary_clean+'\nPROS: '+reviews.pros_clean+
    '\nCONS: '+reviews.cons_clean+'\nADVICE: '+reviews.advice_to_management_clean)
reviews['missing_review_role_flag'] = reviews.reviewer_job_title_clean.eq('')
reviews['missing_review_location_flag'] = reviews.reviewer_location_clean.eq('')
reviews['review_date_parsed'] = pd.to_datetime(reviews.review_date,format='%Y-%m-%d',errors='coerce')
reviews['invalid_review_date_flag'] = reviews.review_date.ne('') & reviews.review_date_parsed.isna()
reviews['early_career_review_title_flag'] = reviews.reviewer_job_title_clean.str.contains(
    r'\bintern\b|internship|\bjunior\b|graduate|trainee',case=False,regex=True)
reviews['interview_experience_candidate_flag'] = reviews.review_text_clean.str.contains(
    r'interview process|recently interviewed|challenge interview|application process',case=False,regex=True)
reviews['repeated_review_text_flag'] = reviews.duplicated(['organization_id','text_sha256'],keep=False)

quality_issues = []
rating_values = pd.to_numeric(reviews.rating,errors='coerce')
reviews['rating_valid'] = rating_values.where(rating_values.between(1,5))
reviews['invalid_overall_rating_flag'] = reviews.rating.ne('') & ~rating_values.between(1,5)
DIMENSIONS = ['career_opportunities','work_life_balance','compensation_and_benefits']

def parse_subrating(row):
    if not row.subratings.strip():
        return {}
    try:
        value = json.loads(row.subratings)
        if not isinstance(value,dict):
            raise ValueError('Expected an object')
        return value
    except (json.JSONDecodeError,ValueError,TypeError):
        quality_issues.append({'source':'reviews','source_id':row.review_id,'field':'subratings',
          'source_value':row.subratings,'issue':'invalid JSON/object; retained source and left derived scores missing'})
        return {}

parsed = reviews.apply(parse_subrating,axis=1)
for dim in DIMENSIONS:
    source_value = parsed.map(lambda x:x.get(dim,''))
    number = pd.to_numeric(source_value,errors='coerce')
    valid = number.between(1,5)
    reviews[dim+'_source_value'] = source_value
    reviews[dim+'_valid'] = number.where(valid)
    reviews[dim+'_invalid_or_missing_flag'] = ~valid
    for i in reviews.index[~valid]:
        v = source_value.loc[i]
        issue = 'missing' if v=='' else ('zero outside valid 1–5 range' if number.loc[i]==0 else 'nonnumeric or outside valid 1–5 range')
        quality_issues.append({'source':'reviews','source_id':reviews.loc[i,'review_id'],
          'field':dim,'source_value':v,'issue':issue})

# Links are preserved as comparable-role links, never vacancy matches.
name_lookup = organizations.set_index('organization_id').organization_name
links['organization_name'] = links.organization_id.map(name_lookup)
links['within_180_days_flag'] = nullable_boolean(links.within_180_days)
links['date_gap_days_numeric'] = pd.to_numeric(links.posting_minus_review_days,errors='coerce')
links['exact_location_text_flag'] = links.location_match.eq('exact_location_text')
links['confirmed_same_vacancy_flag'] = False
links['review_id_exists_flag'] = links.review_id.isin(set(reviews.review_id))
links['job_id_exists_flag'] = links.job_id.isin(set(jobs.job_id))
assert links.review_id_exists_flag.all() and links.job_id_exists_flag.all(), 'Broken link source ID'
review_employer = reviews.set_index('review_id').organization_id
job_employer = jobs.set_index('job_id').organization_id
assert links.review_id.map(review_employer).eq(links.organization_id).all()
assert links.job_id.map(job_employer).eq(links.organization_id).all()
gap_known=links.date_gap_days_numeric.notna() & links.within_180_days_flag.notna()
assert links.loc[gap_known,'within_180_days_flag'].eq(links.loc[gap_known,'date_gap_days_numeric'].abs().le(180)).all()

# Retain all records; flags support later justified exclusions or sensitivity checks.
summary = []
missing_rows = []
for name in NAMES:
    a = jobs[jobs.organization_name.eq(name)]
    b = reviews[reviews.organization_name.eq(name)]
    c = links[links.organization_name.eq(name)]
    meta=organizations[organizations.organization_name.eq(name)].iloc[0]
    assert len(a)==int(meta.job_rows) and len(b)==int(meta.review_rows) and len(c)==int(meta.role_link_rows)
    summary.append({'company':name,'jobs':len(a),'reviews':len(b),'role_links':len(c),
      'early_job_title_signals':int(a.early_career_title_flag.sum()),
      'early_review_title_signals':int(b.early_career_review_title_flag.sum()),
      'interview_candidates_in_early_reviews':int((b.early_career_review_title_flag & b.interview_experience_candidate_flag).sum()),
      'review_start':b.review_date.min(),'review_end':b.review_date.max(),
      'missing_country_codes':int(a.missing_country_code_flag.sum()),
      'unique_job_description_texts':a.text_sha256.nunique(),
      'invalid_posting_dates':int(a.invalid_posting_date_flag.sum()),
      'invalid_review_dates':int(b.invalid_review_date_flag.sum())})
    for source_name,raw in [('jobs',source['job_postings.csv']),('reviews',source['reviews.csv'])]:
        group=raw[raw.organization_id.eq(meta.organization_id)]
        for field in group:
            n=int(group[field].map(flag_missing).sum())
            missing_rows.append({'company':name,'source':source_name,'field':field,
              'missing_n':n,'n_records':len(group),'missing_pct':100*n/len(group)})
summary=pd.DataFrame(summary)

# Add concise definitions for derived fields, with original dictionary alongside.
definitions = []
for table,df,original in [('jobs',jobs,source['job_postings.csv']),('reviews',reviews,source['reviews.csv']),('links',links,source['review_job_role_links.csv'])]:
    for col in df.columns:
        if col not in original.columns:
            if col.endswith('_clean'): definition='Whitespace-normalized copy. Original text retained. Not translated or sentiment classified.'
            elif col.endswith('_valid'): definition='Numeric score in valid 1–5 range; invalid/zero/missing source values become missing in this derived field.'
            elif col.endswith('_source_value'): definition='Value extracted from original subratings JSON before numeric validation.'
            elif col=='early_career_title_flag': definition='Nullable Boolean copy of organizer title heuristic; not verified eligibility.'
            elif col=='early_career_review_title_flag': definition='Reviewer title contains intern/internship/junior/graduate/trainee expression; not verified tenure or employment.'
            elif col=='interview_experience_candidate_flag': definition='Narrow English keyword flag for possible interview/application content. Human checking required; unflagged is not guaranteed workplace experience.'
            elif col=='confirmed_same_vacancy_flag': definition='Always False. No shared vacancy identifier establishes the same opening.'
            elif col=='remote_status_requires_context_check': definition='Always True. Read the role-specific description before interpreting stored work-arrangement labels.'
            elif col=='posting_datetime_utc': definition='Parsed timezone-aware source timestamp normalized to UTC; original timestamp and local date retained.'
            elif col=='posting_date_source_local': definition='Calendar date explicitly written in source timestamp, before UTC conversion.'
            elif col=='repeated_description_flag': definition='All members of an employer+description-hash group with >1 advertisement; retained, not automatically dropped.'
            elif col=='description_occurrences_within_employer': definition='Advertisement count sharing the same employer and source description hash; not a vacancy count.'
            elif col=='short_description_flag': definition='Normalized description has <1500 characters. Screening threshold only; not confirmed truncation.'
            elif col=='description_char_count': definition='Character count of whitespace-normalized description.'
            elif col=='remote_status_raw': definition='Untouched copy of source remote_status.'
            elif col=='remote_status_normalized': definition='Lowercase/trimmed work arrangement label; blank becomes unknown; no semantic correction.'
            elif col=='opening_key_duplicate_flag': definition='Repeated organization_id + organizer opening_dedup_key; retained; not proven same vacancy.'
            elif col=='repeated_review_text_flag': definition='Repeated organization_id + review text hash; retained for later context checks.'
            elif col=='within_180_days_flag': definition='Nullable Boolean copy of organizer linkage flag, checked against absolute numeric day gap.'
            elif col=='date_gap_days_numeric': definition='Numeric copy of posting_minus_review_days.'
            elif col=='exact_location_text_flag': definition='True only if source location_match is exact_location_text; not verified employment.'
            elif col=='organization_name': definition='Employer display name mapped from organizations by organization_id.'
            elif col.endswith('_id_exists_flag'): definition='Whether linked ID is present in the selected source; required True in this preprocessing.'
            elif 'missing' in col or 'invalid' in col: definition='Quality flag; inspect the field name and raw source. Original record retained.'
            elif col=='review_date_parsed': definition='Parsed source review calendar date; invalid values become missing.'
            else: definition='Derived field. See executable preprocessing code for the exact rule.'
            definitions.append({'table':table,'derived_field':col,'definition':definition})

output_tables = {'organizations_selected.csv':organizations,'job_postings_preprocessed.csv':jobs,
 'reviews_preprocessed.csv':reviews,'role_links_preprocessed.csv':links,'sample_summary.csv':summary,
 'missingness_by_company.csv':pd.DataFrame(missing_rows),'subrating_quality_log.csv':pd.DataFrame(quality_issues),
 'derived_field_dictionary.csv':pd.DataFrame(definitions),'original_data_dictionary.csv':source['data_dictionary.csv']}
for name,df in output_tables.items():
    df.to_csv(OUTPUT/name,index=False,encoding='utf-8-sig',date_format='%Y-%m-%dT%H:%M:%S%z')
jobs[jobs.early_career_title_flag.fillna(False)].to_csv(OUTPUT/'early_title_jobs_CHECK_ELIGIBILITY.csv',index=False,encoding='utf-8-sig')
reviews[reviews.interview_experience_candidate_flag].to_csv(OUTPUT/'interview_candidates_CHECK_CONTEXT.csv',index=False,encoding='utf-8-sig')
manifest = {'companies':NAMES,'python':platform.python_version(),'pandas':pd.__version__,
 'inputs':{name:{'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size} for name,path in paths.items()},
 'policy':'No source fields overwritten; no selected rows dropped; no Cartesian join; no geography or currency guessed.',
 'counts':{'jobs':len(jobs),'reviews':len(reviews),'links':len(links)},
 'human_validation':'Pending; preprocessing checks are not completed organizer manual text validation.'}
(OUTPUT/'preprocessing_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))

# Verify saved values, source preservation and primary/foreign keys.
for output_name,df in output_tables.items():
    check=pd.read_csv(OUTPUT/output_name,dtype=str,keep_default_na=False)
    assert len(check)==len(df), f'Export count mismatch: {output_name}'
for selected,raw_name,key,out_name in [(jobs,'job_postings.csv','job_id','job_postings_preprocessed.csv'),(reviews,'reviews.csv','review_id','reviews_preprocessed.csv')]:
    raw=source[raw_name].set_index(key)
    exported=pd.read_csv(OUTPUT/out_name,dtype=str,keep_default_na=False).set_index(key)
    for field in raw.columns:
        assert exported[field].eq(raw.loc[exported.index,field]).all(), f'Original field changed: {out_name}/{field}'
assert len(jobs)==758 and len(reviews)==933 and len(links)==66
print(summary.to_string(index=False))
print('\nPASS: exported counts, all original job/review fields, unique IDs, linked employers and 180-day flags verified.')
print('No selected rows removed. Human text validation is still pending.')
print('Outputs:',OUTPUT.resolve())
