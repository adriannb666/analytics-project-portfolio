% Set up possible number of purchases and purchase distribution
numPurchases = [0 1 2 3 4];
probDist = [0.2231	0.3347	0.2510	0.1255	0.0657];

% Number of days and our stock (X)
numDays = 7;
stock = [0 1 2 3 4 5];

% Objective
revenue = 500;
orderCost = 200;
opportunityCost = 5*stock + 3*stock.^2;
terminalCost = 25*stock +  3*stock.^2;

discountFactor = 1;

V = zeros(length(stock), numDays+1);
Pi = zeros(length(stock), numDays);

% Initialize with terminal condition (-cost because we are maximizing
% profit)
V(:, numDays+1) = -terminalCost;
size(V)

% Iterate backwards through days
for k = (numDays):-1:1
    % For each possible stock
    for j=1:length(stock)
        x = stock(j);
        A = 0:stock(end)-x;
        objective = zeros(size(A));
        % For each possible action
        for i=1:length(A)
            a = A(i);
            % Deterministic part of the reward
            objective(i) = -orderCost*a-opportunityCost(j);
            
            % Take expectation over random part
            for l=1:length(numPurchases)
                purchases = min(x, numPurchases(l));
                objective(i) = objective(i) + probDist(l)*(revenue*purchases + discountFactor*V(x-purchases+a+1, k+1));
            end

        end
        % Store the best value and the action that led to it
        [maxValue, maxIndex] = max(objective);
        V(j, k) = maxValue;
        Pi(j,k) = A(maxIndex);
    end
end

% Visualize results
close all;
figure
imagesc(V); colorbar;
figure
imagesc(Pi); colorbar;

