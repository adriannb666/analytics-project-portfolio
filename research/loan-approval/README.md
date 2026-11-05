# Loan Approval Prediction

**Question:** Which applicant characteristics predict loan approval under a least-squares model, and how much does credit score matter?

**Result:** The linear least-squares classifier reaches **0.89 test accuracy**, against a 0.73 baseline that always predicts approval. Removing credit score drops accuracy to **0.82** and raises both false approvals (14 → 22) and false rejections (8 → 14). Unemployment, number of dependents and existing loans lower the approval score; credit score and income raise it.

**Methods:** Design matrix with an intercept, one-hot categorical variables and z-scored numeric variables. A stratified 80/20 split, `A\y`, a 0.5 decision threshold and an ablation study (MATLAB).

**Reproduced:** ✅ Exact match: accuracy, RMSE and both confusion matrices cell for cell, on the public Kaggle data with the same random split. See [reproduction results](reproduction/RESULTS.md).

**Limitation:** Scaling uses all rows before splitting, and a single split is reported.

Files: [`analysis.m`](analysis.m). The original report is kept privately because it names a collaborator. Two-person project (MATH 325, 2026).
