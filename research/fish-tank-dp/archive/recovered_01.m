% Solve DP again for Week 2 demand
for day = (N-1):-1:1
    for stockIdx = 1:numStockStates
        currentStock = stockLevels(stockIdx);
        possibleOrders = 0:(maxStock - currentStock);
        numActions = length(possibleOrders);
        expectedProfit = zeros(numActions, 1);

        for orderIdx = 1:numActions
            orderQty = possibleOrders(orderIdx);
            profit = -costPerOrder * orderQty - opportunityCost(currentStock) - maintenanceCost(currentStock);

            for demandIdx = 1:numSalesStates
                demand = salesDemand(demandIdx);
                newStock = currentStock + orderQty - min(currentStock, demand);
                futureValue = V(newStock+1, day+1);
                profit = profit + P_week2(demandIdx) * (revenuePerSale * min(currentStock, demand) + futureValue);
            end
            expectedProfit(orderIdx) = profit;
        end
        [V(stockIdx, day), bestActionIdx] = max(expectedProfit);
        optimalPolicy(stockIdx, day) = possibleOrders(bestActionIdx);
    end
end
