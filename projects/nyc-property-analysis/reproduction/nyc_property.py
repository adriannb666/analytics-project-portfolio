# Python port of projects/nyc-property-analysis/analysis.R (AD 571 Assignment 3).
import sys, re, numpy as np, pandas as pd
from scipy import stats
d = pd.read_csv(sys.argv[1], dtype=str, keep_default_na=False)
num = lambda s: pd.to_numeric(s.str.replace(r'[^0-9.\-]', '', regex=True).replace('', np.nan), errors='coerce')  # ~ readr::parse_number
d['gross_square_feet'] = num(d.gross_square_feet); d['sale_price'] = num(d.sale_price)
d['tax'] = pd.to_numeric(d.tax_class_at_time_of_sale, errors='coerce'); d['residential_units'] = num(d.residential_units)
mh = d[(d.neighborhood == 'MURRAY HILL') & d.tax.isin([1, 2]) & ~d.building_class_category.str.contains('CONDO')
       & (d.sale_price > 10000) & (d.gross_square_feet > 100)].copy()          # NA comparisons drop rows, as in dplyr::filter
pre, post = mh[mh.sale_date < '2020-01-01'], mh[mh.sale_date >= '2020-01-01']
def fivenum(x):                                                                  # R fivenum (Tukey hinges)
    x = np.sort(np.asarray(x, float)); n = len(x); n4 = np.floor((n + 3) / 2) / 2
    i = np.array([1, n4, (n + 1) / 2, n + 1 - n4, n]) - 1; return 0.5 * (x[np.floor(i).astype(int)] + x[np.ceil(i).astype(int)])
print(f'Murray Hill sales after filters: {len(mh)}  (before 2020: {len(pre)}, 2020 onward: {len(post)})')
print('1a  sales from 2020 onward:', len(post))
for lab, a, b in [('mean sale_price', pre.sale_price.mean(), post.sale_price.mean()), ('mean gross_sqft', pre.gross_square_feet.mean(), post.gross_square_feet.mean()),
                  ('sd sale_price', pre.sale_price.std(), post.sale_price.std()),
                  ('cor(price, sqft)', pre.sale_price.corr(pre.gross_square_feet), post.sale_price.corr(post.gross_square_feet))]:
    print(f'    {lab:18s} before: {a:,.4f}   from 2020: {b:,.4f}')
for v in ['sale_price', 'gross_square_feet']: print(f'1c  fivenum {v}: before {fivenum(pre[v])}  from 2020 {fivenum(post[v])}')
# Q2: k-means, k=3, standardized (R scale: sd with n-1), 25 random starts; best within-SS kept
Z = mh[['sale_price', 'gross_square_feet']].values; Z = (Z - Z.mean(0)) / Z.std(0, ddof=1)
rng = np.random.default_rng(123); best = None
for _ in range(25):
    C = Z[rng.choice(len(Z), 3, replace=False)]
    for _ in range(300):
        lab = np.argmin(((Z[:, None] - C) ** 2).sum(2), 1); C2 = np.array([Z[lab == k].mean(0) if np.any(lab == k) else C[k] for k in range(3)])
        if np.allclose(C2, C): break
        C = C2
    w = sum(((Z[lab == k] - C[k]) ** 2).sum() for k in range(3))
    if best is None or w < best[0]: best = (w, lab.copy(), C.copy())
w, lab, C = best; mh['cluster'] = lab
g = mh.groupby('cluster').agg(n=('sale_price', 'size'), mean_price=('sale_price', 'mean'), mean_sqft=('gross_square_feet', 'mean')).sort_values('n')
print(f'2   k-means total within-SS = {w:.4f}'); print(g.to_string())
# Q3: Welch t-tests C5 vs A4
print('3   top building classes:', mh.building_class_as_of_final.value_counts().head(4).to_dict())
c5, a4 = mh[mh.building_class_as_of_final == 'C5'], mh[mh.building_class_as_of_final == 'A4']
for v in ['sale_price', 'gross_square_feet']:
    t = stats.ttest_ind(c5[v], a4[v], equal_var=False)
    print(f'    {v:18s} C5 mean {c5[v].mean():,.2f} (n={len(c5)})  A4 mean {a4[v].mean():,.2f} (n={len(a4)})  Welch t={t.statistic:.4f}  p={t.pvalue:.4g}')
