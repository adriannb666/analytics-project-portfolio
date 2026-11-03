# Loan Approval Prediction

**MATLAB · least-squares classification · team of 2 · Spring 2026**

## Business question

Can a transparent linear model screen loan applications accurately enough to support approval decisions? And how much does the model depend on credit score?

## Method

1. **Prepare the data:** drop the applicant ID, one-hot encode gender, marital status and employment status, and z-score the numeric predictors.
2. **Split:** stratified 80/20 train/test split, so both sets have the same approval rate (seed 42).
3. **Model:** ordinary least squares on a 0/1 approval target (`A\y`). An application is approved when its predicted score is ≥ 0.5.
4. **Evaluate:** accuracy against a majority-class baseline (always approve), plus a confusion matrix, RMSE and the size of each coefficient.
5. **Ablation:** refit without `credit_score` and measure how much accuracy drops.

## Results (course submission)

| Model | Test accuracy |
| --- | ---: |
| Majority-class baseline | 73% |
| Least squares, all predictors | **89%** |
| Least squares, without credit score | 82% |

Credit score carries a lot of the signal. Removing it cuts accuracy by 7 points, though the other features still beat the baseline by 9 points. A linear probability model is simple and easy to read. Logistic regression would give properly bounded probabilities and is the natural next step.

## Run it

The course dataset is not redistributed. Point the script at your copy:

```matlab
setenv("LOAN_DATA_FILE", "loanapproval.csv");   % columns incl. loan_approved, credit_score, ...
run("analysis.m")
```

Requires the Statistics and Machine Learning Toolbox (`dummyvar`, `confusionmat`). The written report contains coursework details and collaborator names, so it is not included.
