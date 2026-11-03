-- Q2. How do return, volatility and drawdown compare across assets and years?
-- Calendar-year return, annualized volatility of daily log returns, worst peak-to-trough drop.
WITH daily AS (
    SELECT asset,
           date,
           substr(date, 1, 4) AS year,
           price_usd,
           ln(price_usd / LAG(price_usd) OVER (PARTITION BY asset ORDER BY date)) AS log_ret,
           MAX(price_usd) OVER (PARTITION BY asset, substr(date, 1, 4)
                                ORDER BY date ROWS UNBOUNDED PRECEDING)          AS running_peak
    FROM daily_metrics
),
yearly AS (
    SELECT asset,
           year,
           COUNT(*)                                                AS days,
           MAX(date)                                               AS last_date,
           sqrt(365 * (AVG(log_ret * log_ret) - AVG(log_ret) * AVG(log_ret))) AS ann_vol,
           MIN(price_usd / running_peak - 1)                       AS max_drawdown
    FROM daily
    GROUP BY asset, year
),
closes AS (
    SELECT y.*,
           d.price_usd AS year_close,
           LAG(d.price_usd) OVER (PARTITION BY y.asset ORDER BY y.year) AS prior_close
    FROM yearly AS y
    JOIN daily_metrics AS d ON d.asset = y.asset AND d.date = y.last_date
)
SELECT year,
       asset,
       ROUND(100.0 * (year_close / prior_close - 1), 1) AS return_pct,
       ROUND(100.0 * ann_vol, 1)                        AS ann_volatility_pct,
       ROUND(100.0 * max_drawdown, 1)                   AS max_drawdown_pct,
       ROUND((year_close / prior_close - 1) / ann_vol, 2) AS return_to_vol,
       days
FROM closes
WHERE year >= '2018'
ORDER BY year, asset;
