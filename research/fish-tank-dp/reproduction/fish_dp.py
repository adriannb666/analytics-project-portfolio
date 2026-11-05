# Python port of research/fish-tank-dp/archive/recovered_08.m (Pete's Pet Supply, finite-horizon DP).
import numpy as np
T, maxInv, price, oc = 7, 5, 500, 200; d_vals = np.arange(5)
p1 = np.array([0.1353, 0.2707, 0.2707, 0.1804, 0.1429]); p2 = np.array([0.2231, 0.3347, 0.2510, 0.1255, 0.0657])
def solve(p):
    V = np.zeros((maxInv+1, T+1)); pol = np.zeros((maxInv+1, T), int)
    V[:, T] = [-(25*x + 3*x*x) for x in range(maxInv+1)]                  # terminal cleaning cost
    for k in range(T-1, -1, -1):
        for x in range(maxInv+1):
            A = np.maximum(0, np.arange(maxInv+1) - x)                    # MATLAB: A = max(0, X - x) (repeats 0 for X < x)
            g = [-oc*a - (5*x + 3*x*x) + sum(pp*(price*min(x, d) + V[x - min(x, d) + a, k+1]) for d, pp in zip(d_vals, p)) for a in A]
            i = int(np.argmax(g)); V[x, k] = g[i]; pol[x, k] = A[i]       # first maximum, as MATLAB max()
    return V, pol
V1, P1 = solve(p1); V2, P2 = solve(p2)
hard1 = np.array([[3,3,3,3,3,2,0],[3,3,3,3,3,2,0],[3,3,3,3,3,1,0],[2,2,2,2,2,1,0],[1,1,1,1,1,0,0],[0]*7])
hard2 = np.array([[3,3,3,3,3,1,0],[3,3,3,3,2,1,0],[3,3,2,2,2,1,0],[2,2,2,1,1,0,0],[1,1,1,1,0,0,0],[0]*7])
np.set_printoptions(linewidth=150, suppress=True)
for w, V, P, H in [(1, V1, P1, hard1), (2, V2, P2, hard2)]:
    print(f'=== Week {w} demand ===\nOptimal policy (rows: inventory 0-5, cols: day 1-7):\n{P}')
    print(f'Matches the policy table hard-coded in the original script: {np.array_equal(P, H)}')
    print(f'Expected profit V(day 1) by starting inventory 0-5: {np.round(V[:, 0], 2)}')
# Exact expected 7-day reward of each policy under the OTHER week's demand (replaces the 100-run simulation)
def evaluate(pol, p):
    W = np.array([-(25*x + 3*x*x) for x in range(maxInv+1)], float)
    for k in range(T-1, -1, -1):
        W = np.array([price*sum(pp*min(x, d) for d, pp in zip(d_vals, p)) - (oc*pol[x, k] + 5*x + 3*x*x)
                      + sum(pp*W[x + pol[x, k] - min(x, d)] for d, pp in zip(d_vals, p)) for x in range(maxInv+1)])
    return W
for lab, pol, p, own in [('Week 1 policy under Week 2 demand', hard1, p2, V2), ('Week 2 policy under Week 1 demand', hard2, p1, V1)]:
    W = evaluate(pol, p); print(f'{lab}: expected reward from uniform random start = {W.mean():.2f}'
                                f'  (optimal policy for that demand: {own[:, 0].mean():.2f}; loss {own[:,0].mean()-W.mean():.2f})')
