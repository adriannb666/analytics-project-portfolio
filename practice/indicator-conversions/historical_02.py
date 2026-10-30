import pandas as pd

def sma(series, n, m=1):
    """SMA 平滑移动平均算法：同花顺/通达信兼容"""
    result = []
    for i in range(len(series)):
        if i == 0:
            result.append(series.iloc[0])
        else:
            prev = result[-1]
            value = (m * series.iloc[i] + (n - m) * prev) / n
            result.append(value)
    return pd.Series(result, index=series.index)

def calc_sniper(df):
    C = df['close']
    H = df['high']
    L = df['low']
    O = df['open']

    VAR0 = (C + L + H) / 1.5
    VAR1 = VAR0.ewm(span=3, adjust=False).mean()
    VAR2 = VAR1.ewm(span=2.5, adjust=False).mean()

    MA3 = C.rolling(3).mean()
    MA8 = C.rolling(8).mean()
    MA10 = C.rolling(10).mean()
    MA20 = C.rolling(20).mean()

    VAR3 = (C > MA3) & (MA3 > MA3.shift(1)) & (MA8 > MA20) & (MA20 > MA20.shift(1)) & (C > C.shift(1)) & (L < MA8) & (C > MA8) & (MA10 > MA10.shift(1))
    VAR4 = (VAR1 > VAR2) & (VAR1.shift(1) <= VAR2.shift(1)) & VAR3

    VAR5 = 100 * (C - C.shift(12)) / C.shift(12)
    VAR6 = VAR5.rolling(6).mean()

    VAR7 = (C > C.rolling(5).mean()) & (C > C.rolling(10).mean()) & (C > C.rolling(20).mean())
    VAR8 = (O < C.rolling(5).mean()) & (O < C.rolling(10).mean()) & (O < C.rolling(20).mean())
    VAR9 = (C.rolling(5).mean() > C.rolling(5).mean().shift(1)) & ((H / C) < 1.015)

    # 定义 KDJ
    RSV = (C - L.rolling(9).min()) / (H.rolling(9).max() - L.rolling(9).min()) * 100
    K = sma(RSV, 3)
    D = sma(K, 3)
    J = 3 * K - 2 * D

    VAR10 = (J > K) & (J.shift(1) <= K.shift(1)) & ((C / C.shift(1)) > 1.03)
    VAR11 = (VAR5 > VAR6) & (VAR5.shift(1) <= VAR6.shift(1)) & (VAR5 > VAR5.shift(1)) & (VAR5.shift(1) > VAR5.shift(2))
    VAR12 = (VAR5.shift(2) < VAR5.shift(3)) & (VAR5 > VAR5.shift(3))

    VAR13 = (C.shift(14) != O.shift(14)) & (H.shift(23) > C.shift(23)) & (H.shift(20) > C.shift(20)) & (O.shift(13) != H.shift(13))
    VAR14 = (C.shift(6) != O.shift(6)) & (C.shift(20) != O.shift(20)) & (H.shift(18) > C.shift(18)) & (C.shift(8) != O.shift(8))
    VAR15 = (C.shift(3) != O.shift(3)) & (C.shift(22) != O.shift(22)) & (C.shift(15) != O.shift(15))

    SNIPER = VAR7 & VAR9 & VAR8 & VAR10 & VAR11 & VAR12 & VAR13 & VAR14 & VAR15 & VAR4
    df['sniper_signal'] = SNIPER.astype(int)
    return df
