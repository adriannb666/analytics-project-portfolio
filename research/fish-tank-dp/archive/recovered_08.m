%% Project 1: Optimal Control for Fish Tank Stocking Problem
% This script solves Pete's Pet Supply's inventory management problem
% The goal is to maximize expected weekly profit while balancing stock constraints
% State: x ∈ {0,1,2,3,4,5} (number of fish tanks at the start of the day)
% Control: u (number of tanks to order, ensuring x + u ≤ 5)
% Demand d follows a probability distribution {0,1,2,3,4} (Week 1 probabilities)
% Sales: min(x, d), Revenue = 500 * min(x, d)
% Costs:
%   - Ordering cost: 200 * u
%   - Opportunity cost: 5*x + 3*x^2
%   - Terminal cleaning cost: 25*x + 3*x^2
% Transition: Next day's inventory = (x - sales) + u


clear; clc;


%% Parameters
maxInv = 5;        % Maximum inventory (fish tanks)
T = 7;             % Time horizon (days)
salesPrice = 500;  % Selling price per fish tank
orderCost = 200;   % Ordering cost per fish tank


% Demand probabilities (Week 1)
d_vals = 0:4;
p_d = [0.1353, 0.2707, 0.2707, 0.1804, 0.1429];


% State space X (inventory levels), Action space A (number of tanks to order)
X = 0:maxInv; 
Nx = length(X);   % Number of states


% Terminal value function: V(T+1, x) = -gamma(x) (cleaning cost)
V = zeros(Nx, T+1);
policy = zeros(Nx, T); % Optimal policy matrix


for x = 0:maxInv
   V(x+1, T+1) = - (25*x + 3*x^2);
end


%% Dynamic Programming Recursion (Backward Induction)
for k = T:-1:1
   for j = 1:Nx  % Iterate over all inventory states
       x = X(j);  % Current inventory level
       A = max(0, X-x);  % Allowed actions (number of tanks to order)


       g = zeros(size(A));  % Expected rewards


       for i = 1:length(A)
           a = A(i);  % Order quantity
           expected_profit = -orderCost * a - (5*x + 3*x^2);  % Ordering + opportunity cost


           for h = 1:length(d_vals)
               d = d_vals(h);
               prob = p_d(h);
               sales = min(x, d);
               revenue = salesPrice * sales;
               next_state = (x - sales) + a;
               expected_profit = expected_profit + prob * (revenue + V(next_state+1, k+1));
           end
           g(i) = expected_profit;
       end


       [maxValue, maxIndex] = max(g);
       V(j, k) = maxValue;
       policy(j, k) = A(maxIndex);
   end
end


%% Display Results
fprintf('Optimal Value Function (Expected Profit at Each Day & Inventory Level):\n');
disp(V);
fprintf('Optimal Ordering Policy (Suggested Orders for Each Inventory State Per Day):\n');
disp(policy);






%% Visualization 2: Line Plot for Policy Changes Over Time
figure;
hold on;
for i = 1:Nx
   plot(1:T, policy(i, :), '-o', 'DisplayName', sprintf('Inventory %d', X(i)));
end
xlabel('Day');
ylabel('Optimal Order Quantity');
title('Change in Optimal Order Strategy Over Time');
legend;
grid on;


%% Visualization 3: Heatmap for Optimal Ordering Decisions
figure;
imagesc(policy);
colorbar;
xlabel('Day');
ylabel('Inventory Level');
title('Heatmap of Optimal Order Decisions');
xticks(1:T);
yticks(1:Nx);
yticklabels(string(X));
colormap hot;




maxInv = 5;       
T = 7;            
salesPrice = 500; 
orderCost = 200;  
d_vals = 0:4;
p_d = [0.2231, 0.3347, 0.2510, 0.1255, 0.0657];
X = 0:maxInv; 
Nx = length(X);
V = zeros(Nx, T+1);
policy = zeros(Nx, T);


for x = 0:maxInv
   V(x+1, T+1) = - (25*x + 3*x^2);
end
for k = T:-1:1
   for j = 1:Nx 
       x = X(j); 
       A = max(0, X-x); 


       g = zeros(size(A)); 


       for i = 1:length(A)
           a = A(i); 
           expected_profit = -orderCost * a - (5*x + 3*x^2); 


           for h = 1:length(d_vals)
               d = d_vals(h);
               prob = p_d(h);
               sales = min(x, d);
               revenue = salesPrice * sales;
               next_state = (x - sales) + a;
               expected_profit = expected_profit + prob * (revenue + V(next_state+1, k+1));
           end
           g(i) = expected_profit;
       end


       [maxValue, maxIndex] = max(g);
       V(j, k) = maxValue;
       policy(j, k) = A(maxIndex);
   end
end
fprintf('Optimal Value Function (Expected Profit at Each Day & Inventory Level):\n');
disp(V);
fprintf('Optimal Ordering Policy (Suggested Orders for Each Inventory State Per Day):\n');
disp(policy);
figure;
hold on;
for i = 1:Nx
   plot(1:T, policy(i, :), '-o', 'DisplayName', sprintf('Inventory %d', X(i)));
end
xlabel('Day');
ylabel('Optimal Order Quantity');
title('Change in Optimal Order Strategy Over Time');
legend;
grid on;
figure;
imagesc(policy);
colorbar;
xlabel('Day');
ylabel('Inventory Level');
title('Heatmap of Optimal Order Decisions');
xticks(1:T);
yticks(1:Nx);
yticklabels(string(X));
colormap hot;




T = 7;              
maxInv = 5;         
salesPrice = 500;
orderCost = 200;    
S = [0, 1, 2, 3, 4];
p_week1 = [0.1353, 0.2707, 0.2707, 0.1804, 0.1429];
p_week2 = [0.2231, 0.3347, 0.2510, 0.1255, 0.0657];
policy_week1 = [3, 3, 3, 3, 3, 2, 0;
               3, 3, 3, 3, 3, 2, 0;
               3, 3, 3, 3, 3, 1, 0;
               2, 2, 2, 2, 2, 1, 0;
               1, 1, 1, 1, 1, 0, 0;
               0, 0, 0, 0, 0, 0, 0];


policy_week2 = [3, 3, 3, 3, 3, 1, 0;
               3, 3, 3, 3, 2, 1, 0;
               3, 3, 2, 2, 2, 1, 0;
               2, 2, 2, 1, 1, 0, 0;
               1, 1, 1, 1, 0, 0, 0;
               0, 0, 0, 0, 0, 0, 0];
numSim = 100;
reward_W1_policy_under_W2_demand = zeros(numSim,1);
reward_W2_policy_under_W1_demand = zeros(numSim,1);


rng(1); 
for sim = 1:numSim
  
   x = randi([0, maxInv]);
   totalReward = 0;
   for day = 1:T
      
       u = policy_week1(x+1, day);
      
       r = rand;
       if r <= p_week2(1)
           d = S(1);
       elseif r <= (p_week2(1) + p_week2(2))
           d = S(2);
       elseif r <= (p_week2(1) + p_week2(2) + p_week2(3))
           d = S(3);
       elseif r <= (p_week2(1) + p_week2(2) + p_week2(3) + p_week2(4))
           d = S(4);
       else
           d = S(5);
       end
     
       sale = min(x, d);
     
       immediateReward = salesPrice * sale - (orderCost*u + 5*x + 3*x^2);
       totalReward = totalReward + immediateReward;
      
       x = x + u - sale;
   end
  
   totalReward = totalReward - (25*x + 3*x^2);
   reward_W1_policy_under_W2_demand(sim) = totalReward;
end


for sim = 1:numSim
   x = randi([0, maxInv]);
   totalReward = 0;
   for day = 1:T
      
       u = policy_week2(x+1, day);
     
       r = rand;
       if r <= p_week1(1)
           d = S(1);
       elseif r <= (p_week1(1) + p_week1(2))
           d = S(2);
       elseif r <= (p_week1(1) + p_week1(2) + p_week1(3))
           d = S(3);
       elseif r <= (p_week1(1) + p_week1(2) + p_week1(3) + p_week1(4))
           d = S(4);
       else
           d = S(5);
       end
       sale = min(x, d);
       immediateReward = salesPrice * sale - (orderCost*u + 5*x + 3*x^2);
       totalReward = totalReward + immediateReward;
       x = x + u - sale;
   end
   totalReward = totalReward - (25*x + 3*x^2);
   reward_W2_policy_under_W1_demand(sim) = totalReward;
end


avgReward_W1_under_W2 = mean(reward_W1_policy_under_W2_demand);
avgReward_W2_under_W1 = mean(reward_W2_policy_under_W1_demand);
fprintf('Week 1 policy under Week 2 demand: Average total reward = %.2f\n', avgReward_W1_under_W2);
fprintf('Week 2 policy under Week 1 demand: Average total reward = %.2f\n', avgReward_W2_under_W1);
