# Python port of research/loan-approval/analysis.m (MATH 325). Reproduces MATLAB rng(42)/randperm:
# MATLAB's twister seeding equals NumPy's legacy RandomState(42), and randperm(n) = sort order of rand(1,n).
import sys, numpy as np, pandas as pd
T = pd.read_csv(sys.argv[1] if len(sys.argv) > 1 else 'loanapproval.csv')
y = T.pop('loan_approved').astype(float).values; T = T.drop(columns=['applicant_id'], errors='ignore')
cat = [c for c in ['gender','marital_status','employment_status'] if c in T]
cols, names, dummy = [], [], []
for v in T.columns:
    if v in cat:
        levels = sorted(T[v].astype(str).unique())            # MATLAB categorical: sorted levels, drop first
        for L in levels[1:]: cols.append((T[v].astype(str) == L).astype(float).values); names.append(f'{v}_{L}'); dummy.append(True)
    else: cols.append(T[v].astype(float).values); names.append(v); dummy.append(False)
X = np.column_stack(cols); dummy = np.array(dummy); names = np.array(names)
Xz = X.copy(); mu = X[:, ~dummy].mean(0); sd = X[:, ~dummy].std(0, ddof=1); sd[sd == 0] = 1
Xz[:, ~dummy] = (X[:, ~dummy] - mu) / sd                       # standardized on ALL rows, as in the original
rs = np.random.RandomState(42); randperm = lambda n: np.argsort(rs.random_sample(n), kind='stable')
i0, i1 = np.where(y == 0)[0], np.where(y == 1)[0]; i0 = i0[randperm(len(i0))]; i1 = i1[randperm(len(i1))]
n0, n1 = round(0.8*len(i0)), round(0.8*len(i1))
tr = np.r_[i0[:n0], i1[:n1]]; te = np.r_[i0[n0:], i1[n1:]]; tr = tr[randperm(len(tr))]; te = te[randperm(len(te))]
def fit(mask):
    A = np.c_[np.ones(len(tr)), Xz[tr][:, mask]]; b = np.linalg.lstsq(A, y[tr], rcond=None)[0]
    yh = np.c_[np.ones(len(te)), Xz[te][:, mask]] @ b; yp = (yh >= 0.5).astype(float)
    C = np.array([[np.sum((y[te]==t)&(yp==p)) for p in (0,1)] for t in (0,1)])
    return b, np.mean(yp == y[te]), np.sqrt(np.mean((yh - y[te])**2)), C
allm = np.ones(len(names), bool); b, acc, rmse, C = fit(allm)
print(f'n={len(y)}  train={len(tr)}  test={len(te)}  approval rate={y.mean():.3f}')
print(f'Baseline accuracy (always 1): {np.mean(y[te]==1):.4f}')
print(f'=== Full model ===\nTest accuracy: {acc:.4f}\nTest RMSE: {rmse:.4f}\nConfusion (rows true 0/1, cols pred 0/1):\n{C}')
o = np.argsort(-np.abs(b[1:]))[:10]; print('Top coefficients:'); [print(f'  {names[i]:32s} {b[1+i]: .4f}') for i in o]
m2 = names != 'credit_score'; _, acc2, rmse2, C2 = fit(m2)
print(f'=== Ablation (no credit_score) ===\nTest accuracy: {acc2:.4f}\nTest RMSE: {rmse2:.4f}\nConfusion:\n{C2}')
print(f'Delta accuracy: {acc-acc2:.4f}   Delta RMSE: {rmse2-rmse:.4f}')
