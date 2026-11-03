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
X = 0:maxStock;  
Nx = length(X);

% Possible sales demand
S = 0:4; 
numSalesStates = length(S);

% Demand probability distributions (Week 1 and Week 2)
P_week1 = [0.1353, 0.2707, 0.2707, 0.1804, 0.1429]; % Week 1
P_week2 = [0.2231, 0.3347, 0.2510, 0.1255, 0.0657]; % Week 2

% Initialize value function and policy matrices
V = zeros(Nx, N);
Pi = zeros(Nx, N-1);

% Solve using backward dynamic programming
for k = (N-1):-1:1  % Iterate backwards over time steps
    for j = 1:Nx  % Iterate over stock levels
        x = X(j); % Current stock level
        A = max(0, X - x); % Possible actions (orders)
        g = -200 * A - 5*x - 3*(x^2) + 500 * sum(P_week1 .* min(x, S)); % Immediate reward
        
        for i = 1:length(A)
            a = A(i);
            for h = 1:length(S)
                s = S(h);
                newX = max(0, x + a - min(x, s)); % Next state transition
                g(i) = g(i) + P_week1(h) * V(newX+1, k+1); % Expected future reward
            end
        end
        [maxValue, maxIndex] = max(g); % Find optimal action
        V(j, k) = maxValue;
        Pi(j, k) = A(maxIndex);
    end
end

% Display optimal policies
disp('Optimal Ordering Policy (Week 1)');
disp(Pi);

% Plot optimal policy
figure;
imagesc(Pi);
colorbar;
xlabel('Day');
ylabel('Stock Level');
title('Optimal Restocking Policy for Week 1');

% Solve DP again for Week 2 demand
V_week2 = zeros(Nx, N);
Pi_week2 = zeros(Nx, N-1);

for k = (N-1):-1:1
    for j = 1:Nx
        x = X(j);
        A = max(0, X - x);
        g = -200 * A - 5*x - 3*(x^2) + 500 * sum(P_week2 .* min(x, S)); 
        
        for i = 1:length(A)
            a = A(i);
            for h = 1:length(S)
                s = S(h);
                newX = max(0, x + a - min(x, s));
                g(i) = g(i) + P_week2(h) * V_week2(newX+1, k+1);
            end
        end
        [maxValue, maxIndex] = max(g);
        V_week2(j, k) = maxValue;
        Pi_week2(j, k) = A(maxIndex);
    end
end

% Display and compare optimal policies
figure;
subplot(1,2,1);
imagesc(Pi);
colorbar;
xlabel('Day');
ylabel('Stock Level');
title('Optimal Policy for Week 1');

subplot(1,2,2);
imagesc(Pi_week2);
colorbar;
xlabel('Day');
ylabel('Stock Level');
title('Optimal Policy for Week 2');

% Simulation to test policy robustness under Week 2 demand
profit_week2 = zeros(N,1);
stock = 3; % Start with 3 tanks
cdf_P_week2 = cumsum(P_week2); % Compute cumulative distribution function (CDF)

for day = 1:N-1
    order = Pi(stock+1, day);
    stock = min(maxStock, stock + order);
    
    % Replace `randsample` with equivalent method
    randNum = rand;
    demandIdx = find(randNum <= cdf_P_week2, 1);
    demand = S(demandIdx);
    
    sales = min(stock, demand);
    profit_week2(day) = revenuePerSale * sales - costPerOrder * order - opportunityCost(stock) - maintenanceCost(stock);
    stock = max(0, stock - sales);
end

% Plot daily profits under incorrect demand assumption
figure;
plot(1:N-1, cumsum(profit_week2), '-o', 'LineWidth', 2);
xlabel('Day');
ylabel('Cumulative Profit');
title('Profit under Week 2 Demand using Week 1 Policy');

% Compute final profits for both weeks
total_profit_week1 = sum(V(:,1));
total_profit_week2 = sum(profit_week2);
fprintf('Total Profit using Week 1 strategy: %.2f\n', total_profit_week1);
fprintf('Total Profit using Week 2 strategy: %.2f\n', total_profit_week2);
