# Python port of research/taipei-housing/archive/recovered_05.R on the UCI Real Estate Valuation data
# (NHPA.csv is that dataset with renamed columns). Small R-style lm() helper; no statsmodels needed.
import sys, numpy as np, pandas as pd
from scipy import stats
d = pd.read_excel(sys.argv[1]); d.columns = ['TransactionDate','HouseAge','Dist2MRT','NumConvenStores','Latitude','Longitude','Price']
d['Dist2MRT_sqr'] = np.sqrt(d.Dist2MRT); d['log_Price'] = np.log(d.Price)
d['Dist2MRT_sqr:NumConvenStores'] = d.Dist2MRT_sqr * d.NumConvenStores
def lm(y, xs, name):
    X = np.c_[np.ones(len(d)), d[xs].values]; Y = d[y].values; n, p = X.shape
    b, *_ = np.linalg.lstsq(X, Y, rcond=None); r = Y - X@b; rss = r@r; s2 = rss/(n-p)
    se = np.sqrt(np.diag(s2*np.linalg.inv(X.T@X))); t = b/se; pv = 2*stats.t.sf(abs(t), n-p)
    tss = ((Y-Y.mean())**2).sum(); R2 = 1-rss/tss; aR2 = 1-(1-R2)*(n-1)/(n-p)
    F = ((tss-rss)/(p-1))/s2; Fp = stats.f.sf(F, p-1, n-p)
    print(f'\n=== {name}: {y} ~ {" + ".join(xs)}')
    for nm, bb, ss, tt, pp in zip(['(Intercept)']+xs, b, se, t, pv): print(f'  {nm:30s} {bb:12.5g} {ss:11.4g} {tt:8.3f} {pp:10.3g}')
    print(f'  R2={R2:.4f}  adjR2={aR2:.4f}  F={F:.2f} on {p-1},{n-p} df  p={Fp:.3g}  resid SE={np.sqrt(s2):.4f}')
    return dict(rss=rss, df=n-p, R2=R2, aR2=aR2, X=X)
def nested(a, b, la, lb):
    F = ((a['rss']-b['rss'])/(a['df']-b['df']))/(b['rss']/b['df']); p = stats.f.sf(F, a['df']-b['df'], b['df'])
    print(f'\nNested F ({la} vs {lb}): F={F:.3f}, df={a["df"]-b["df"]},{b["df"]}, p={p:.4g}')
def vif(xs):
    out = {}
    for x in xs:
        o = [c for c in xs if c != x]; X = np.c_[np.ones(len(d)), d[o].values]; Y = d[x].values
        b = np.linalg.lstsq(X, Y, rcond=None)[0]; R2 = 1-((Y-X@b)**2).sum()/((Y-Y.mean())**2).sum(); out[x] = 1/(1-R2)
    return out
base = ['TransactionDate','HouseAge','Dist2MRT','NumConvenStores','Latitude','Longitude']
print('n =', len(d)); print(d[base+['Price']].describe().round(3).to_string())
m1 = lm('Price', base, 'm1 full model'); print('VIF m1:', {k: round(v, 3) for k, v in vif(base).items()})
x2 = ['TransactionDate','HouseAge','Dist2MRT_sqr','NumConvenStores','Latitude','Longitude']; m2 = lm('Price', x2, 'm2 sqrt(Dist2MRT)')
x3 = ['TransactionDate','HouseAge','Dist2MRT_sqr','NumConvenStores','Dist2MRT_sqr:NumConvenStores','Latitude','Longitude']
print('\nNOTE: the original m3 formula uses Longitude_sqr, which is never defined, so it stops with an error in R. Longitude is used here, as in m4.')
m3 = lm('Price', x3, 'm3 interaction'); nested(m2, m3, 'm2', 'm3')
m4 = lm('log_Price', x3, 'm4 log(Price)')
x4r = [c for c in x3 if c != 'Longitude']; m4r = lm('log_Price', x4r, 'm4_reduced (final)'); nested(m4r, m4, 'm4_reduced', 'm4')
print('\nModel metrics:'); [print(f'  {n:32s} R2={m["R2"]:.4f} adjR2={m["aR2"]:.4f}') for n, m in
  [('Full Model (m1)',m1),('Square-root Transformation (m2)',m2),('Interaction Model (m3)',m3),('Log-transformed Model (m4)',m4),('Final Model (m4_reduced)',m4r)]]
