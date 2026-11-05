# Reproduction: biogas plant CPM scheduling

**Status: reproduced. The project duration, the activity times and the corrected critical-path finding all match.**

`cpm.py` reimplements the MATLAB CPM model described in Section 5.2 of the MATH 391 report (May 2025) in Python. It runs a forward pass, a backward pass, computes slack, and finds every critical path with a recursive depth-first search. The activity data come from Table 1 of Zareei (2018). As in the report, the predecessors of activity O are corrected from the impossible "N, O" to "N, M". Run it with `python3 cpm.py`; it uses only the standard library. The full output is in [`output.txt`](output.txt).

| Quantity | Original report | Reproduction |
| --- | --- | --- |
| Project duration | 38 weeks | 38 weeks |
| ES / EF / LS / LF for all 15 activities | Zareei Table 1 | Identical for all 15 activities |
| Non-zero slack | B = 1, I = 2, J = 1 | B = 1, I = 2, J = 1 |
| Critical paths | A→C→D→E→G→H→K→L→M→N→O and A→C→D→F→G→H→K→L→M→N→O | The same two paths |
| Duration of the path that skips N (…→M→O) | 36 weeks, so not critical | 36 weeks |

This confirms the report's correction: the original paper lists four critical paths, but the two paths that bypass N finish two weeks early and so are not critical.

Team project: Jiangnan Ni, Yitian Zhang and Youhui Pang.
