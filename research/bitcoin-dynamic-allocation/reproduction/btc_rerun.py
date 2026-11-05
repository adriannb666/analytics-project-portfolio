# Faithful Python port of constant_weight_train_validation.R and constant_weight_visualization.R.
# Usage: python3 btc_rerun.py <TradingView BTCUSD 1D CSV with time,close> [start-date, e.g. 2019-01-01]
# Same parameters, same (buggy) cost logic, R-style sd (ddof=1).
import sys, os, numpy as np, pandas as pd, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
raw = pd.read_csv(sys.argv[1]); start = sys.argv[2] if len(sys.argv)>2 else None
raw['date'] = pd.to_datetime(raw['time'], unit='s').dt.normalize()
raw = raw[['date','close']].sort_values('date').reset_index(drop=True)
if start: raw = raw[raw.date >= start].reset_index(drop=True)
raw['ret'] = raw.close.pct_change().fillna(0)
train_end, val_end = pd.Timestamp('2023-12-31'), pd.Timestamp('2025-10-12')
raw = raw[raw.date <= val_end]
tr, va = raw[raw.date <= train_end], raw[(raw.date > train_end)]
print(f'data {raw.date.min().date()} → {raw.date.max().date()} | train n={len(tr)} val n={len(va)}')

# ---------- script 1: train/validation ----------
tc, rebal_k = 0.001, 5
def bt1(r, lam):
    w, out = 0.0, np.empty(len(r))
    for t in range(len(r)):
        cost = 0.0
        if t == 0 or t % rebal_k == 0: cost = tc*abs(lam-w); w = lam
        out[t] = w*r[t] - cost
    return out
def stats1(x):
    m, s = x.mean(), x.std(ddof=1); ar = (1+m)**365-1; av = s*np.sqrt(365)
    eq = np.cumprod(1+x); mdd = (eq/np.maximum.accumulate(eq)-1).min()
    return dict(ann_ret=ar, ann_vol=av, sharpe=np.nan if av==0 else ar/av, mdd=mdd, last_eq=eq[-1])
grid = np.round(np.arange(0,1.0001,0.05),2)
T = pd.DataFrame([{'lambda':l, **stats1(bt1(tr.ret.values,l))} for l in grid])
best = T.loc[T.sharpe.idxmax(),'lambda']
pd.set_option('display.width',140); print('==== TRAIN grid ===='); print(T.round(4).to_string(index=False))
print('Best lambda (train Sharpe):', best)
B = pd.DataFrame([{'strategy':n, **stats1(bt1(va.ret.values,l))} for n,l in [('Full BTC (λ=1)',1),('All Cash (λ=0)',0),(f'Chosen λ*={best}',best)]])
print('==== VALIDATION ===='); print(B.round(4).to_string(index=False))

# ---------- script 2: visualization (keeps abs(w-w)=0 cost and skipped first return) ----------
def bt2(r, lam):
    eq = np.ones(len(r))
    for i in range(1,len(r)): eq[i] = eq[i-1]*(1+lam*r[i] - tc*abs(lam-lam))
    return eq, np.r_[0, np.diff(eq)/eq[:-1]]
def stats2(x):
    m,s=x.mean(),x.std(ddof=1); ar=(1+m)**365-1; av=s*np.sqrt(365); return ar,av,(np.nan if av==0 else ar/av)
g2 = np.round(np.arange(0,1.0001,0.1),1)
S = pd.DataFrame([(l,*stats2(bt2(tr.ret.values,l)[1]),*stats2(bt2(va.ret.values,l)[1])) for l in g2],
                 columns=['lambda','tr_ret','tr_vol','tr_sharpe','va_ret','va_vol','va_sharpe'])
b2 = S.loc[S.tr_sharpe.idxmax(),'lambda']; print('==== VIS script stats ===='); print(S.round(4).to_string(index=False)); print('vis best lambda:', b2)
tag = start or 'full'
os.makedirs('figures', exist_ok=True)
fig,ax=plt.subplots(figsize=(8,4)); ax.plot(raw.date,raw.close,color='#0072B2'); ax.axvline(train_end,ls='--',color='red')
ax.set(title=f'Bitcoin Price with Train/Validation Split',xlabel='Date',ylabel='Price (USD)'); fig.tight_layout(); fig.savefig(f'figures/1_price_split.png',dpi=120)
fig,ax=plt.subplots(figsize=(8,4)); ax.bar(S['lambda'],S.tr_sharpe,width=.08,color='#0072B2',alpha=.7,label='Training'); ax.bar(S['lambda'],S.va_sharpe,width=.08,color='#E69F00',alpha=.7,label='Validation')
ax.axvline(b2,ls='--',color='red'); ax.set(title='Sharpe Ratios across λ Values',xlabel='λ (constant weight)',ylabel='Sharpe Ratio'); ax.legend(); fig.tight_layout(); fig.savefig(f'figures/2_sharpe_compare.png',dpi=120)
fig,ax=plt.subplots(figsize=(6,5))
for c,(rc,vc,lab) in zip(['#F8766D','#00BFC4'],[('tr_ret','tr_vol','Train'),('va_ret','va_vol','Validation')]):
    ax.scatter(S[vc],S[rc],color=c,label=lab); [ax.annotate(f'{l:g}',(x,y),textcoords='offset points',xytext=(0,5),fontsize=7,ha='center') for l,x,y in zip(S['lambda'],S[vc],S[rc])]
ax.set(title='Risk–Return Tradeoff across λ',xlabel='Annualized Volatility',ylabel='Annualized Return'); ax.legend(); fig.tight_layout(); fig.savefig(f'figures/3_risk_return.png',dpi=120)
eq,_=bt2(va.ret.values,b2); fig,ax=plt.subplots(figsize=(8,4)); ax.plot(va.date,eq,color='#009E73')
ax.set(title=f'Validation Equity Curve (λ* = {b2:g})',xlabel='Date',ylabel='Portfolio Value (normalized)'); fig.tight_layout(); fig.savefig(f'figures/4_validation_equity.png',dpi=120)
