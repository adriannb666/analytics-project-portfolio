%% Project 1: Optimal Control for Fish Tank Stocking Problem
clear; clc; close all;

%% Parameters
maxInv = 5;        % Maximum inventory (fish tanks)
T = 7;             % Time horizon (days)
salesPrice = 500;  % Selling price per fish tank
orderCost = 200;   % Ordering cost per fish tank

% Opportunity & maintenance cost functions
opportunityCost = @(x) 5*x + 3*x^2;
maintenanceCost = @(x) 25*x + 3*x^2;

% Possible demand levels
S = 0:4;
numSim = 100; % Number of simulations

% Demand probabilities
p_week1 = [0.1353, 0.2707, 0.2707, 0.1804, 0.1429];
p_week2 = [0.2231, 0.3347, 0.2510, 0.1255, 0.0657];

% State space (inventory levels)
X = 0:maxInv; 
Nx = length(X);

%% Function: Solve Dynamic Programming
function [V, policy] = solveDP(S, p_d)
    V = zeros(Nx, T+1);
    policy = zeros(Nx, T);
    
    % Terminal value function (cleaning cost)
    for x = 0:maxInv
       V(x+1, T+1) = -maintenanceCost(x);
    end

    % Backward Induction
    for k = T:-1:1
        for j = 1:Nx
            x = X(j);  
            A = max(0, X-x);  % Allowed actions (number of tanks to order)
            g = zeros(size(A)); 

            for i = 1:length(A)
                a = A(i);
                expected_profit = -orderCost * a - opportunityCost(x);

                % Expectation over sales demand
                for h = 1:length(S)
                    d = S(h);
                    prob = p_d(h);
                    sales = min(x, d);
                    revenue = salesPrice * sales;
                    next_state = (x - sales) + a;
                    expected_profit = expected_profit + prob * (revenue + V(next_state+1, k+1));
                end
                g(i) = expected_profit;
            end

            [V(j, k), maxIndex] = max(g);
            policy(j, k) = A(maxIndex);
        end
    end
end

%% Solve for Week 1 & Week 2
[V_week1, policy_week1] = solveDP(S, p_week1);
[V_week2, policy_week2] = solveDP(S, p_week2);

%% Display Results
fprintf('Optimal Ordering Policy (Week 1):\n'); disp(policy_week1);
fprintf('Optimal Ordering Policy (Week 2):\n'); disp(policy_week2);

%% Visualization 1: Heatmap of Optimal Order Decisions
figure;
subplot(1,2,1);
imagesc(policy_week1);
colorbar; xlabel('Day'); ylabel('Inventory Level');
title('Optimal Order Decisions (Week 1)');
xticks(1:T); yticks(1:Nx); yticklabels(string(X));

subplot(1,2,2);
imagesc(policy_week2);
colorbar; xlabel('Day'); ylabel('Inventory Level');
title('Optimal Order Decisions (Week 2)');
xticks(1:T); yticks(1:Nx); yticklabels(string(X));

%% Function: Simulate Policy Under Different Demand
function avgReward = simulatePolicy(policy, p_d)
    rewards = zeros(numSim,1);
    for sim = 1:numSim
        x = randi([0, maxInv]); 
        totalReward = 0;

        for day = 1:T
            u = policy(x+1, day);
            demand = S(discretize(rand, [0, cumsum(p_d)]));
            sales = min(x, demand);
            immediateReward = salesPrice * sales - (orderCost*u + opportunityCost(x));
            totalReward = totalReward + immediateReward;
            x = x + u - sales;
        end
        totalReward = totalReward - maintenanceCost(x);
        rewards(sim) = totalReward;
    end
    avgReward = mean(rewards);
end

%% Simulate & Compare Policy Performance
avgReward_W1_under_W2 = simulatePolicy(policy_week1, p_week2);
avgReward_W2_under_W1 = simulatePolicy(policy_week2, p_week1);

fprintf('Week 1 policy under Week 2 demand: Average total reward = %.2f\n', avgReward_W1_under_W2);
fprintf('Week 2 policy under Week 1 demand: Average total reward = %.2f\n', avgReward_W2_under_W1);

%% Visualization 2: Comparison of Strategy Robustness
figure;
bar([avgReward_W1_under_W2, avgReward_W2_under_W1]);
xticklabels({'W1 Policy under W2 Demand', 'W2 Policy under W1 Demand'});
ylabel('Average Profit');
title('Strategy Robustness Analysis');
grid on;
