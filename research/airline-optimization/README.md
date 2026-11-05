# Airline Fleet and Route Optimization

**Question:** With a $160M budget, which aircraft should Universal Airways buy, and how should it assign them to four routes to maximize daily profit?

**Result:** Buy 6 Med-848 and 4 Smal-286 aircraft ($154M). Fly the larger planes 8 times a day each to Metropolis and Cityburg, and the smaller planes 5 / 3 / 6 times to Cityburg / Smalltown / Townville. Maximum profit is **$163,600 per day** (integer program). The LP relaxation gives $170,751 with fractional fleet sizes.

**Methods:** Linear programming and mixed-integer programming (MATLAB `linprog` / `intlinprog`). The constraints cover the budget, flight-time limits per aircraft, airport capacity and minimum service to small towns.

**Reproduced:** ✅ Exact match with the submitted report. See [reproduction results](reproduction/RESULTS.md).

## Files

- [`archive/final_submission.m`](archive/final_submission.m): the final model, transcribed from the report appendix. Minimum trips are ≥ constraints.
- [`archive/recovered_01.m`](archive/recovered_01.m): an earlier draft that wrongly treats the minimum-trip requirements as equalities (exactly 3 and 4 trips). It is kept for history; the final version fixes it.
- `archive/recovered_02–05.tex`: drafts of the report source. The index is in [SOURCE_INDEX.md](SOURCE_INDEX.md).

Team project: Luke Smallwood, Fatma Mahmoud and Adrian Zhang (MATH 347, Kenyon College, 2024).
