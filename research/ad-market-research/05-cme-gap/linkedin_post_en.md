"CME gaps always fill." I tested it on 438 Bitcoin weekends. It's true, and it's useless.

Quick background: CME Bitcoin futures stop trading from Friday 5 pm to Sunday 6 pm ET. Bitcoin itself keeps trading. So when CME reopens, the chart often shows a "gap", and one of crypto's most repeated rules says price will come back to fill it.

I pulled every weekend from Jan 2018 to May 2026 (Binance BTCUSDT hourly data as a proxy for CME) and checked.

1) Yes, 97% of gaps fill.
But I also drew 20,000 random lines at the same distances from price, at random times and in random directions. 97% of those got hit too. Gaps don't fill because they're special. They fill because Bitcoin is volatile, and almost any level 1–2% away gets touched eventually.

2) The trade people actually take loses.
Say you bet on the fill at every Sunday open: take profit at the gap, stop at the same distance on the other side. The stop was hit first 237 times. The gap filled first only 163 times. That's a 40.8% win rate at 1:1, about −0.18R per trade before fees (binomial test p ≈ 0.0003).
Median time to touch: 7 hours for the opposite level, 16 hours for the gap.

3) It got worse after 2022.
2018–2021: the gap filled first 47% of the time. Since 2022: 35%.

4) "Always" isn't always.
14 gaps are still open. The best known is the SVB weekend in March 2023: Friday close 20,077, Sunday open 21,273. More than 3.5 years later, price has never gone back.

My takeaway: a rule can be true 97% of the time and still have no edge. Before trusting a market "law", compare it with what randomness would give you.

Full code, data and charts are open source:
github.com/adriannb666/analytics-project-portfolio/tree/main/research/ad-market-research/05-cme-gap

Not financial advice. Spot data is a proxy; real CME prices differ slightly.

#Bitcoin #QuantitativeFinance #DataAnalytics #Trading #Crypto
