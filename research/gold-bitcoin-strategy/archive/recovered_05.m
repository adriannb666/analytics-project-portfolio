% 初始化投资组合
initialCash = 1000; % 初始现金
cash = initialCash;
goldHolding = 0;
commission = 0.01; % 黄金交易费用 1%

% 模拟交易
for i = 1:length(goldPrices)
    if buySignal(i) && cash > 0
        % 买入黄金
        goldHolding = (cash * (1 - commission)) / goldPrices(i);
        cash = 0;
    elseif sellSignal(i) && goldHolding > 0
        % 卖出黄金
        cash = goldHolding * goldPrices(i) * (1 - commission);
        goldHolding = 0;
    end
end

% 计算最终投资组合价值
if goldHolding > 0
    finalValue = goldHolding * goldPrices(end);
else
    finalValue = cash;
end

fprintf('Initial Investment: $%.2f\n', initialCash);
fprintf('Final Portfolio Value: $%.2f\n', finalValue);
