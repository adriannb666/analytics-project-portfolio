% 初始投资
initialCash = 1000;
cash = initialCash;
goldHolding = 0;
commission = 0.01; % 1% 交易佣金

for i = 2:height(goldData)
    if buySignal(i) && cash > 0
        % 买入黄金
        goldHolding = (cash * (1 - commission)) / goldData{i, 2};
        cash = 0;
    elseif sellSignal(i) && goldHolding > 0
        % 卖出黄金
        cash = goldHolding * goldData{i, 2} * (1 - commission);
        goldHolding = 0;
    end
end

% 计算最终资产价值
if goldHolding > 0
    finalValue = goldHolding * goldData{end, 2};
else
    finalValue = cash;
end

fprintf('Initial Investment: $%.2f\n', initialCash);
fprintf('Final Portfolio Value: $%.2f\n', finalValue);
