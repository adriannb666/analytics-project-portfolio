# Faithful Python port of the MATLAB appendix (MATH 347 Project 1): same f, A, b, bounds.
import numpy as np
from scipy.optimize import linprog, milp, LinearConstraint, Bounds
f = np.array([-10400,-6700,2400,400,-4000,-3200,-400,-1600,0,0],float)
A = np.array([
[4.2,3.2,1.6,2.2,0,0,0,0,-10,0],[0,0,0,0,5.2,3.7,1.8,2.6,0,-10],[0,0,0,0,0,0,0,0,21,7],
[1,0,0,0,1,0,0,0,0,0],[0,1,0,0,0,1,0,0,0,0],[0,0,1,0,0,0,1,0,0,0],[0,0,0,1,0,0,0,1,0,0],
[0,0,-1,0,0,0,-1,0,0,0],[0,0,0,-1,0,0,0,-1,0,0]],float)
b = np.array([0,0,160,8,13,13,12,-3,-4],float)
names=['Med→Metropolis','Med→Cityburg','Med→Smalltown','Med→Townville','Smal→Metropolis','Smal→Cityburg','Smal→Smalltown','Smal→Townville','Med-848 planes','Smal-286 planes']
lp = linprog(f, A_ub=A, b_ub=b, bounds=[(0,None)]*10, method='highs')
ip = milp(f, constraints=LinearConstraint(A,-np.inf,b), integrality=np.ones(10), bounds=Bounds(0,np.inf))
for tag,r in [('linprog (LP relaxation)',lp),('intlinprog (integer)',ip)]:
    print(f'== {tag}: status={r.status}  profit/day = {-r.fun:,.2f}')
    for n,v in zip(names,r.x): print(f'   {n:16s} {v:8.4f}')
x=ip.x; print('budget used ($M):', 21*x[8]+7*x[9])
