# Reproduction: Universal Airways fleet optimization

**Status: reproduced. Every reported figure matches.**

`airline_lp.py` is a line-for-line Python port of the MATLAB appendix in the original MATH 347 report (2024-09-29). It uses the same objective vector `f`, constraint matrix `A`, right-hand side `b` and non-negativity bounds. The MATLAB solvers `linprog` and `intlinprog` are replaced with SciPy's HiGHS-based `linprog` and `milp`. Run it with `python3 airline_lp.py`; it needs NumPy and SciPy and no input data. The full output is in [`output.txt`](output.txt).

| Quantity | Original report | Reproduction |
| --- | --- | --- |
| LP relaxation: Med-848 planes / Smal-286 planes | 5.6961 / 5.7689 | 5.6961 / 5.7689 |
| LP relaxation: Med→Cityburg / Smal→Cityburg | 7.3002 / 5.6998 | 7.3002 / 5.6998 |
| Integer solution: planes purchased | 6 Med-848, 4 Smal-286 | 6 Med-848, 4 Smal-286 |
| Integer solution: route assignment (Med: Metropolis, Cityburg; Smal: Cityburg, Smalltown, Townville) | 8, 8; 5, 3, 6 | 8, 8; 5, 3, 6 |
| Fleet cost | $154M of $160M | $154M |
| Maximum daily profit | $163,600 | $163,600.00 |

Team project: Luke Smallwood, Fatma Mahmoud and Adrian Zhang.
