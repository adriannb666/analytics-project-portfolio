# Python port of research/auto-mpg/analysis.m (MATH 325): OLS vs Tikhonov/ridge on standardized predictors.
# MATLAB rng(325)+randperm reproduced with NumPy's legacy MT19937 (same seeding) and argsort(rand).
import sys, numpy as np, pandas as pd
T = pd.read_csv(sys.argv[1] if len(sys.argv) > 1 else 'mpg.csv')
T['horsepower'] = pd.to_numeric(T['horsepower'], errors='coerce')
v = ['mpg','cylinders','displacement','horsepower','weight','acceleration']; T = T.dropna(subset=v).reset_index(drop=True)
b = T.mpg.values.astype(float); X = T[v[1:]].values.astype(float)
Xs = (X - X.mean(0)) / X.std(0, ddof=1)                      # standardized on all rows, as in the original
A = np.c_[np.ones(len(b)), Xs]
rs = np.random.RandomState(325); idx = np.argsort(rs.random_sample(len(b)), kind='stable')
nT = round(0.8*len(b)); tr, te = idx[:nT], idx[nT:]
rmse = lambda x: np.sqrt(np.mean((b[te] - A[te] @ x)**2))
x_ols = np.linalg.lstsq(A[tr], b[tr], rcond=None)[0]
I = np.eye(A.shape[1]); I[0,0] = 0; lams = [0.001, 0.01, 0.1, 1, 10, 100]
xr = [np.linalg.solve(A[tr].T@A[tr] + l*I, A[tr].T@b[tr]) for l in lams]; rr = [rmse(x) for x in xr]
print(f'rows used: {len(b)}  train: {len(tr)}  test: {len(te)}')
print(f'OLS RMSE: {rmse(x_ols):.4f}'); [print(f'Ridge RMSE, lambda = {l:g}: {r:.4f}') for l, r in zip(lams, rr)]
k = int(np.argmin(rr)); print(f'Best lambda: {lams[k]:g}  Best ridge RMSE: {rr[k]:.4f}')
print('Coefficients (OLS, best ridge):'); [print(f'  {n:13s} {a: .5g} {c: .5g}') for n, a, c in zip(['intercept']+v[1:], x_ols, xr[k])]
