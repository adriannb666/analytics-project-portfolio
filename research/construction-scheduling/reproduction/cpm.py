# Python port of the MATH 391 MATLAB CPM model. Data: Zareei (2018) Table 1, with O's predecessors
# corrected from "N, O" to "N, M" as described in the report.
dur  = dict(A=4,B=2,C=3,D=3,E=2,F=2,G=3,H=4,I=2,J=3,K=2,L=6,M=7,N=2,O=2)
pred = dict(A=[],B=['A'],C=['A'],D=['B','C'],E=['D'],F=['D'],G=['E','F'],H=['G'],I=['G'],J=['G'],
            K=['H','I','J'],L=['K'],M=['L'],N=['M'],O=['N','M'])
order = list(dur)                      # already topological
ES,EF = {},{}
for a in order:
    ES[a] = max((EF[p] for p in pred[a]), default=0); EF[a] = ES[a]+dur[a]
T = max(EF.values()); succ = {a:[b for b in order if a in pred[b]] for a in order}
LS,LF = {},{}
for a in reversed(order):
    LF[a] = min((LS[s] for s in succ[a]), default=T); LS[a] = LF[a]-dur[a]
print('Act Dur  ES  EF  LS  LF Slack')
for a in order: print(f'{a:>3} {dur[a]:3d} {ES[a]:3d} {EF[a]:3d} {LS[a]:3d} {LF[a]:3d} {LS[a]-ES[a]:5d}')
crit = {a for a in order if LS[a]==ES[a]}
def paths(a):   # DFS over critical activities whose finish feeds the successor's start exactly
    nxt = [s for s in succ[a] if s in crit and ES[s]==EF[a]]
    return [[a]] if not nxt else [[a]+p for s in nxt for p in paths(s)]
print('Project duration:', T, 'weeks'); print('Critical paths:'); [print('  ','→'.join(p)) for p in paths('A')]
skip = sum(dur[a] for a in 'ACDEGHKLMO'); print('Duration of A→C→D→E→G→H→K→L→M→O (skipping N):', skip)
