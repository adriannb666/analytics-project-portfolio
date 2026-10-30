%% Least-Squares Classification Example
% Full working script for loanapproval.csv
% - Reads data
% - Drops applicant_id
% - One-hot encodes categorical variables
% - Standardizes numeric predictors (optional but on by default)
% - Stratified 80/20 train-test split
% - Least squares fit (A\y)
% - Accuracy, RMSE, confusion matrix
% - Ablation: remove credit_score and compare

clear; clc;

%% 1) Load data
T = readtable(getenv("LOAN_DATA_FILE"));

% Response (ensure numeric 0/1)
y = double(T.loan_approved);

% Drop ID if present
if ismember("applicant_id", string(T.Properties.VariableNames))
    T.applicant_id = [];
end

% Remove response from predictors
if ismember("loan_approved", string(T.Properties.VariableNames))
    T.loan_approved = [];
end

%% 2) Specify categorical variables (edit if your column names differ)
catVars = ["gender","marital_status","employment_status"];
allVars = string(T.Properties.VariableNames);
catVars = catVars(ismember(catVars, allVars)); % keep only those that exist

%% 3) Build predictor matrix X (no intercept yet) + names
X = [];
xNames = strings(1,0);

for v = allVars
    col = T.(v);

    if any(v == catVars)
        c = categorical(col);
        D = dummyvar(c);                 % N x K
        cats = categories(c);

        % Drop first dummy to avoid redundancy with intercept
        if size(D,2) > 1
            D = D(:,2:end);
            cats = cats(2:end);
        end

        X = [X, D];
        for k = 1:numel(cats)
            xNames(end+1) = v + "_" + string(cats{k});
        end
    else
        % Numeric predictor
        X = [X, col];
        xNames(end+1) = v;
    end
end

X = double(X);

%% 4) Standardize numeric predictors (recommended for coefficient comparability)
% Dummy columns are not standardized; numeric columns are standardized.
isDummy = false(1, numel(xNames));
for cv = catVars
    isDummy = isDummy | startsWith(xNames, cv + "_");
end
numCols = ~isDummy;

mu = zeros(1, size(X,2));
sig = ones(1, size(X,2));
mu(numCols) = mean(X(:,numCols), 1, "omitnan");
sig(numCols) = std(X(:,numCols), 0, 1, "omitnan");
sig(sig == 0) = 1;

Xz = X;
Xz(:,numCols) = (X(:,numCols) - mu(numCols)) ./ sig(numCols);

%% 5) Stratified 80/20 train-test split
rng(42);

idx0 = find(y == 0);
idx1 = find(y == 1);

idx0 = idx0(randperm(numel(idx0)));
idx1 = idx1(randperm(numel(idx1)));

n0_train = round(0.8 * numel(idx0));
n1_train = round(0.8 * numel(idx1));

trainIdx = [idx0(1:n0_train); idx1(1:n1_train)];
testIdx  = [idx0(n0_train+1:end); idx1(n1_train+1:end)];

trainIdx = trainIdx(randperm(numel(trainIdx)));
testIdx  = testIdx(randperm(numel(testIdx)));

Xtrain = Xz(trainIdx,:);
ytrain = y(trainIdx);

Xtest = Xz(testIdx,:);
ytest = y(testIdx);

% Add intercept
Atrain = [ones(size(Xtrain,1),1), Xtrain];
Atest  = [ones(size(Xtest,1),1),  Xtest];

%% 6) Least squares fit
beta = Atrain \ ytrain;

%% 7) Predictions + metrics (IMPORTANT: make types match for confusionmat)
yhat = Atest * beta;          % continuous scores
yPred = double(yhat >= 0.5);  % 0/1 double

accuracy = mean(yPred == ytest);
rmse = sqrt(mean((yhat - ytest).^2));

C = confusionmat(ytest, yPred); % rows=true (0,1), cols=pred (0,1)

% Baseline: always predict approved (1)
baselineAcc = mean(ones(size(ytest)) == ytest);

fprintf("=== Full model (with credit_score if present) ===\n");
fprintf("Baseline accuracy (always 1): %.4f\n", baselineAcc);
fprintf("Test accuracy: %.4f\n", accuracy);
fprintf("Test RMSE: %.4f\n", rmse);
disp("Confusion matrix (rows=true 0/1, cols=pred 0/1):");
disp(C);

%% 8) Coefficient inspection (top 10 by absolute value, excluding intercept)
coef = beta(2:end);
[~, ord] = sort(abs(coef), "descend");
topK = min(10, numel(coef));
topIdx = ord(1:topK);

disp("Top coefficients by |value| (numeric predictors standardized):");
tbl = table(xNames(topIdx)', coef(topIdx), abs(coef(topIdx)), ...
    'VariableNames', {'Predictor','Coefficient','AbsValue'});
disp(tbl);

%% 9) RQ2 Ablation: remove credit_score and refit (if credit_score exists)
creditMask = (xNames == "credit_score");

if any(creditMask)
    Xtrain2 = Xtrain(:, ~creditMask);
    Xtest2  = Xtest(:,  ~creditMask);

    Atrain2 = [ones(size(Xtrain2,1),1), Xtrain2];
    Atest2  = [ones(size(Xtest2,1),1),  Xtest2];

    beta2 = Atrain2 \ ytrain;

    yhat2 = Atest2 * beta2;
    yPred2 = double(yhat2 >= 0.5);

    acc2 = mean(yPred2 == ytest);
    rmse2 = sqrt(mean((yhat2 - ytest).^2));
    C2 = confusionmat(ytest, yPred2);

    fprintf("\n=== Ablation model (remove credit_score) ===\n");
    fprintf("Test accuracy: %.4f\n", acc2);
    fprintf("Test RMSE: %.4f\n", rmse2);
    disp("Confusion matrix (rows=true 0/1, cols=pred 0/1):");
    disp(C2);

    fprintf("\nDelta accuracy (full - ablation): %.4f\n", accuracy - acc2);
    fprintf("Delta RMSE (ablation - full): %.4f\n", rmse2 - rmse);
else
    fprintf("\n[Note] 'credit_score' not found in predictors. Skipping ablation.\n");
end
