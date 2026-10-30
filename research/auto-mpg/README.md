# Regularized Least Squares for Auto MPG

Team project comparing OLS with Tikhonov/Ridge regression using cylinders, displacement, horsepower, weight, and acceleration. The report describes a single split and a small lambda grid; it does not establish a material improvement over OLS.

**Archive status:** MATLAB implementation and LaTeX presentation source recovered.

See [SOURCE_INDEX.md](SOURCE_INDEX.md) for recovered files. Numbering reflects extraction, not a verified release sequence. Team work and AI-assisted source are preserved as historical material.

## Reuse and limits

The original implementation standardizes predictors before the train/test split and compares lambdas on the test split. This can bias evaluation. Preserve it as a historical baseline; a new analysis should fit scaling on training data and select lambda using validation/cross-validation before a final holdout test. The source path was changed to a local filename. Original dataset and MATLAB runtime are not included.
