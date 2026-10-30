% 读取黄金数据
goldData = readtable('LBMA-GOLD.csv');
goldData.Date = datetime(goldData.Date, 'InputFormat', 'MM-dd-yyyy');
goldData = sortrows(goldData, 'Date');

% 读取比特币数据
btcData = readtable('BCHAIN-MKPRU.csv');
btcData.Date = datetime(btcData.Date, 'InputFormat', 'MM-dd-yyyy');
btcData = sortrows(btcData, 'Date');
