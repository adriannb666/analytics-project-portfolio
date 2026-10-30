% 导入黄金价格数据
goldData = readtable('LBMA-GOLD.csv', 'VariableNamingRule', 'preserve');
goldData.Date = datetime(goldData.Date, 'InputFormat', 'MM-dd-yyyy');
goldPrices = goldData{:, 2};

% 设置 RSI 和 StochRSI 参数
rsiPeriod = 14; % RSI 的计算周期
stochPeriod = 14; % StochRSI 的计算周期

% 计算 RSI
delta = diff(goldPrices);
gain = max(delta, 0);
loss = abs(min(delta, 0));

avgGain = movmean(gain, rsiPeriod);
avgLoss = movmean(loss, rsiPeriod);
rs = avgGain ./ avgLoss;
rsi = 100 - (100 ./ (1 + rs));

% 填充第一个 RSI 周期前的数据为 NaN
rsi = [NaN(rsiPeriod, 1); rsi];
