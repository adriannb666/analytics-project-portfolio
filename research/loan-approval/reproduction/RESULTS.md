# Reproduction: loan approval via least-squares classification

**Status: reproduced exactly. Both confusion matrices match cell for cell, and so do the accuracy, the RMSE and the ranking of coefficients.**

`loan_ls.py` is a line-for-line Python port of [`analysis.m`](../analysis.m). The steps are the same: one-hot encoding with the first level dropped, z-scores for the numeric columns, a stratified 80/20 split, `A\y`, a 0.5 threshold, and an ablation that removes credit score. The port reproduces MATLAB's `rng(42)` + `randperm` exactly. MATLAB's twister seeding matches NumPy's legacy `RandomState(42)`, and `randperm(n)` is the sort order of `rand(1,n)`. As a result, the train/test split is the same 800/200 rows as in the original.

The data is Kaggle's [loan approval dataset](https://www.kaggle.com/datasets/amineipad/loan-approval-dataset), 1,000 rows. It is not included here. The copy used is in `data/raw/loanapproval.csv` of [AmirhosseinHonardoust/Underwriting-Decision-Safety-Lab](https://github.com/AmirhosseinHonardoust/Underwriting-Decision-Safety-Lab) at commit `2deed5f`. Run `python3 loan_ls.py loanapproval.csv`. The full output is in [`output.txt`](output.txt).

| Quantity | Original report (MATH 325, SP26) | Reproduction |
| --- | --- | --- |
| Majority-class baseline accuracy | 0.73 | 0.7300 |
| Full model: test accuracy / RMSE | 0.89 / 0.3322 | 0.8900 / 0.3322 |
| Full model: confusion matrix [TN FP; FN TP] | [40 14; 8 138] | [40 14; 8 138] |
| Without credit score: accuracy / RMSE | 0.82 / 0.3648 | 0.8200 / 0.3648 |
| Without credit score: confusion matrix | [32 22; 14 132] | [32 22; 14 132] |
| Largest coefficients | Unemployed (−), dependents (−), existing loans (−), credit score (+), income (+) | Same order: −0.326, −0.155, −0.140, +0.129, +0.085 |

The original standardizes the numeric columns on all 1,000 rows before splitting. The port keeps this so that it can check the historical numbers. A new analysis should fit the scaling on the training rows only.
