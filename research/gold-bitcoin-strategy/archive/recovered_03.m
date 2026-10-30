% 读取黄金数据并保留原始列名
goldData = readtable('LBMA-GOLD.csv', 'VariableNamingRule', 'preserve');
goldData.Date = datetime(goldData.Date, 'InputFormat', 'MM-dd-yyyy');
goldData = sortrows(goldData, 'Date');

% 读取比特币数据并保留原始列名
btcData = readtable('BCHAIN-MKPRU.csv', 'VariableNamingRule', 'preserve');
btcData.Date = datetime(btcData.Date, 'InputFormat', 'MM-dd-yyyy');
btcData = sortrows(btcData, 'Date');
