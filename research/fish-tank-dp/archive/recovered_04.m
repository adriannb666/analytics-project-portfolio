% Pete’s Pet Supply - Stochastic Optimal Control
clc; clear; close all;

% Parameters
N = 7; % Number of days
maxStock = 5; % Maximum fish tank stock
costPerOrder = 200; % Cost per tank ordered
revenuePerSale = 500; % Revenue per sale
opportunityCost = @(x) 5*x + 3*x^2; % Opportunity cost function
maintenanceCost = @(x) 25*x + 3*x^2; % Maintenance cost function

% Possible stock levels
stockLevels = 0:maxStock;  
numStockStates = length(stockLevels);

% Possible sales demand
salesDemand = 0:4; 
numSalesStates = length(salesDemand);

% Demand probability distributions (Week 1 and Week 2)
P_week1 = [0.1353, 0.2707, 0.2707, 0.1804, 0.1429]; % Week 1
P_week2 = [0.2231, 0.3347, 0.2510, 0.1255, 0.0657]; % Week 2

% Initialize value function and policy matrices
V = zeros(numStockStates, N);
optimalPolicy = zeros(numStockStates, N-1);

% Solve using backward dynamic programming
for day = (N-1):-1:1
    for stockIdx = 1:numStockStates
        currentStock = stockLevels(stockIdx);
        
        % Possible order decisions (cannot exceed store limit)
        possibleOrders = 0:(maxStock - currentStock);
        numActions = length(possibleOrders);
        
        % Initialize reward for each action
        expectedProfit = zeros(numActions, 1);

        % Evaluate profit for each order action
        for orderIdx = 1:numActions
            orderQty = possibleOrders(orderIdx);
            profit = -costPerOrder * orderQty - opportunityCost(currentStock) - maintenanceCost(currentStock);
            
            % Expectation over sales demand
            for demandIdx = 1:numSalesStates
                demand = salesDemand(demandIdx);
                newStock = currentStock + orderQty - min(currentStock, demand);
                futureValue = V(newStock+1, day+1);
                profit = profit + P_week1(demandIdx) * (revenuePerSale * min(currentStock, demand) + futureValue);
            end
            expectedProfit(orderIdx) = profit;
        end

        % Store optimal value and policy
        [V(stockIdx, day), bestActionIdx] = max(expectedProfit);
        optimalPolicy(stockIdx, day) = possibleOrders(bestActionIdx);
    end
end

% Display optimal policies
disp('Optimal Ordering Policy (Week 1)');
disp(optimalPolicy);

% Plot optimal policy
figure;
imagesc(optimalPolicy);
colorbar;
xlabel('Day');
ylabel('Stock Level');
title('Optimal Restocking Policy for Week 1');

% Simulation to test policy robustness under Week 2 demand
profit_week2 = zeros(N,1);
stock = 3; % Start with 3 tanks
cdf_P_week2 = cumsum(P_week2); % Compute cumulative distribution function (CDF)

for day = 1:N-1
    order = optimalPolicy(stock+1, day);
    stock = min(maxStock, stock + order);
    
    % Replace
