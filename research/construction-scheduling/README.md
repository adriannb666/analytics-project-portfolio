# Biogas Plant Construction Scheduling (CPM)

**Question:** What is the shortest schedule for building a 50 m³ biogas plant (15 activities), and which activities are critical?

**Result:** The project takes **38 weeks**, with exactly **two** critical paths: A→C→D→E→G→H→K→L→M→N→O and A→C→D→F→G→H→K→L→M→N→O. The published source (Zareei, 2018) lists four critical paths. The team showed that the two paths that skip N finish two weeks early (36 weeks) and so are not critical. It also corrected a self-referencing predecessor ("O depends on N, O") in that paper.

**Methods:** Critical Path Method: forward and backward passes, slack, and a recursive depth-first search for all critical paths (MATLAB).

**Reproduced:** ✅ Exact match: all ES/EF/LS/LF values, the slack and both paths. See [reproduction results](reproduction/RESULTS.md). The original MATLAB file was not recovered, so the reproduction reimplements the model described in the report.

Files: `archive/recovered_01.tex` is the report source ([SOURCE_INDEX.md](SOURCE_INDEX.md)).

Team project: Jiangnan Ni, Yitian Zhang and Youhui Pang (MATH 391 Optimal Control, Kenyon College, 2025).
