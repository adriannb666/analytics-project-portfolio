%% Math 325 Final Project - Auto MPG
% Ordinary Least Squares vs Tikhonov / Ridge Regularization

clear; clc; close all;

%% 1. Load data
filePath = "AUTOMPG (1).csv";
T = readtable(filePath);

disp("Variable names in the dataset:");
disp(T.Properties.VariableNames);

%% 2. Clean horsepower column if needed
% In the Auto MPG dataset, horsepower sometimes has missing values marked as "?"
if iscell(T.horsepower) || isstring(T.horsepower) || ischar(T.horsepower)
    T.horsepower = str2double(string(T.horsepower));
end

% Remove rows with missing values in the variables we use
vars = {'mpg','cylinders','displacement','horsepower','weight','acceleration'};
T = rmmissing(T, 'DataVariables', vars);

%% 3. Define response and predictors
b = T.mpg;

X = [T.cylinders, ...
     T.displacement, ...
     T.horsepower, ...
     T.weight, ...
     T.acceleration];

predictorNames = {'cylinders','displacement','horsepower','weight','acceleration'};

%% 4. Standardize predictors
% This is important because regularization is affected by variable scale.
X_mean = mean(X);
X_std = std(X);

X_scaled = (X - X_mean) ./ X_std;

%% 5. Add intercept column
% We do not regularize the intercept.
A = [ones(size(X_scaled,1),1), X_scaled];

coefNames = ['intercept', predictorNames];

%% 6. Train-test split
rng(325); % for reproducibility

n = size(A,1);
idx = randperm(n);

trainRatio = 0.8;
nTrain = round(trainRatio * n);

trainIdx = idx(1:nTrain);
testIdx = idx(nTrain+1:end);

A_train = A(trainIdx,:);
b_train = b(trainIdx);

A_test = A(testIdx,:);
b_test = b(testIdx);

%% 7. Ordinary Least Squares
x_ols = A_train \ b_train;

b_pred_ols = A_test * x_ols;
rmse_ols = sqrt(mean((b_test - b_pred_ols).^2));

%% 8. Tikhonov / Ridge Regularization
% Try different lambda values
lambdaList = [0.001, 0.01, 0.1, 1, 10, 100];

rmse_ridge = zeros(length(lambdaList),1);
coef_ridge = zeros(size(A_train,2), length(lambdaList));

% Penalty matrix
% First diagonal entry is 0, so intercept is not regularized.
I = eye(size(A_train,2));
I(1,1) = 0;

for i = 1:length(lambdaList)
    lambda = lambdaList(i);

    x_ridge = (A_train' * A_train + lambda * I) \ (A_train' * b_train);

    coef_ridge(:,i) = x_ridge;

    b_pred_ridge = A_test * x_ridge;
    rmse_ridge(i) = sqrt(mean((b_test - b_pred_ridge).^2));
end

%% 9. Find best lambda
[best_rmse, bestIndex] = min(rmse_ridge);
best_lambda = lambdaList(bestIndex);
x_best_ridge = coef_ridge(:, bestIndex);

%% 10. Print RMSE results
fprintf("\n===== RMSE Comparison =====\n");
fprintf("OLS RMSE: %.4f\n", rmse_ols);

for i = 1:length(lambdaList)
    fprintf("Ridge RMSE, lambda = %.3f: %.4f\n", lambdaList(i), rmse_ridge(i));
end

fprintf("\nBest lambda: %.3f\n", best_lambda);
fprintf("Best Ridge RMSE: %.4f\n", best_rmse);

%% 11. Coefficient comparison
coefTable = table(coefNames', x_ols, x_best_ridge, ...
    'VariableNames', {'Variable','OLS_Coefficient','Best_Ridge_Coefficient'});

disp(" ");
disp("===== Coefficient Comparison =====");
disp(coefTable);

%% 12. Plot RMSE vs lambda
figure;
semilogx(lambdaList, rmse_ridge, '-o', 'LineWidth', 1.5);
hold on;
yline(rmse_ols, '--', 'OLS RMSE', 'LineWidth', 1.5);
xlabel('\lambda');
ylabel('Test RMSE');
title('RMSE Comparison: OLS vs Ridge Regularization');
grid on;

%% 13. Plot predicted vs actual MPG
b_pred_best_ridge = A_test * x_best_ridge;

figure;
scatter(b_test, b_pred_ols, 40, 'filled');
hold on;
scatter(b_test, b_pred_best_ridge, 40, 'filled');

minVal = min(b_test);
maxVal = max(b_test);
plot([minVal maxVal], [minVal maxVal], 'k--', 'LineWidth', 1.5);

xlabel('Actual MPG');
ylabel('Predicted MPG');
title('Actual MPG vs Predicted MPG');
legend('OLS', 'Best Ridge', 'Perfect Prediction', 'Location', 'best');
grid on;

%% 14. Simple interpretation output
fprintf("\n===== Interpretation =====\n");

if best_rmse < rmse_ols
    fprintf("The regularized model has a lower RMSE than OLS.\n");
    fprintf("This suggests that Tikhonov regularization improves prediction accuracy on the test set.\n");
elseif abs(best_rmse - rmse_ols) < 0.05
    fprintf("The regularized model and OLS have very similar RMSE values.\n");
    fprintf("This suggests that regularization gives similar accuracy while making the coefficients more stable.\n");
else
    fprintf("OLS has a lower RMSE than the regularized model in this split.\n");
    fprintf("This may mean the dataset is not highly unstable, but regularization can still help control coefficient size.\n");
end
