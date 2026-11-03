-- Q1. Which assets drive spot trading activity, and how is the mix shifting?
-- Yearly reported spot volume, share of the five-asset total, rank and YoY change.
WITH yearly AS (
    SELECT d.asset,
           a.asset_name,
           substr(d.date, 1, 4)   AS year,
           SUM(d.spot_volume_usd) AS spot_volume_usd,
           COUNT(*)               AS trading_days
    FROM daily_metrics AS d
    JOIN assets AS a USING (asset)
    WHERE d.date >= '2018-01-01'
    GROUP BY d.asset, a.asset_name, year
)
SELECT year,
       asset,
       asset_name,
       ROUND(spot_volume_usd / 1e9, 1)                                             AS spot_volume_bn,
       ROUND(100.0 * spot_volume_usd / SUM(spot_volume_usd) OVER (PARTITION BY year), 1) AS share_pct,
       RANK() OVER (PARTITION BY year ORDER BY spot_volume_usd DESC)               AS volume_rank,
       CASE WHEN trading_days >= 365   -- skip YoY for the partial current year
            THEN ROUND(100.0 * (spot_volume_usd / LAG(spot_volume_usd) OVER (PARTITION BY asset ORDER BY year) - 1), 1)
       END                                                                         AS yoy_change_pct,
       trading_days
FROM yearly
ORDER BY year, volume_rank;
