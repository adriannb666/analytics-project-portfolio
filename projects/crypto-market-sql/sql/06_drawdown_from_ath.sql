-- Q5. Where does each asset trade today relative to its all-time high?
WITH ranked AS (
    SELECT asset, date, price_usd,
           ROW_NUMBER() OVER (PARTITION BY asset ORDER BY price_usd DESC) AS price_rank,
           ROW_NUMBER() OVER (PARTITION BY asset ORDER BY date DESC)      AS recency_rank
    FROM daily_metrics
)
SELECT a.asset,
       a.asset_name,
       latest.date                                           AS as_of,
       ROUND(latest.price_usd, 4)                            AS latest_price_usd,
       ath.date                                              AS ath_date,
       ROUND(ath.price_usd, 4)                               AS ath_price_usd,
       ROUND(100.0 * (latest.price_usd / ath.price_usd - 1), 1) AS pct_below_ath,
       CAST(julianday(latest.date) - julianday(ath.date) AS INTEGER) AS days_since_ath
FROM assets AS a
JOIN ranked AS latest ON latest.asset = a.asset AND latest.recency_rank = 1
JOIN ranked AS ath    ON ath.asset    = a.asset AND ath.price_rank   = 1
ORDER BY pct_below_ath;
