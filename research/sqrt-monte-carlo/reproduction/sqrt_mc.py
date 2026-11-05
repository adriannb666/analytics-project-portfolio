# Python port of the report's Appendix A procedure (Math 336). N = 200,000 draws, common random numbers.
import numpy as np
from scipy.optimize import minimize_scalar
rng = np.random.default_rng(336)
N = 200_000
def M(theta, X, n, kind):
    y = np.full_like(X, theta) if kind == 'fixed' else theta * X
    for _ in range(n): y = 0.5 * (y + X / y)
    return np.mean((y - np.sqrt(X)) ** 2)
report = {(10,'fixed',1):(3.42,.325),(10,'prop',1):(.293,.320),(250,'fixed',1):(17.1,8.08),(250,'prop',1):(.0586,8.04),
          (10,'fixed',2):(3.00,.0147),(10,'prop',2):(.332,.0150),(250,'fixed',2):(15.0,.367),(250,'prop',2):(.0664,.372),
          (10,'fixed',3):(2.41,3.95e-4),(10,'prop',3):(.417,3.88e-4),(250,'fixed',3):(12.1,1.03e-2),(250,'prop',3):(.0827,1.01e-2)}
print(f"{'mean':>5} {'seed':6} n | {'theta* (rerun)':>14} {'report':>8} | {'M (rerun)':>10} {'report':>9}")
for n in (1,2,3):
    for mean in (10,250):
        X = rng.exponential(mean, N)
        for kind in ('fixed','prop'):
            s = np.sqrt(mean)
            grid = np.linspace(0.2*s, 3*s, 400) if kind=='fixed' else np.linspace(0.2/s, 3/s, 400)
            vals = [M(t,X,n,kind) for t in grid]; i=int(np.argmin(vals))
            r = minimize_scalar(lambda t: M(t,X,n,kind), bounds=(grid[max(i-2,0)],grid[min(i+2,399)]), method='bounded')
            rt, rm = report[(mean,kind,n)]
            print(f"{mean:5d} {kind:6} {n} | {r.x:14.4f} {rt:8.4g} | {r.fun:10.4g} {rm:9.3g}")
