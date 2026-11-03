-- Q4. Is on-chain usage growing alongside price?
-- Yearly average daily active addresses and transactions, with YoY growth vs. YoY price change.
WITH yearly AS (
    SELECT asset,
           substr(date, 1, 4)    AS year,
           AVG(active_addresses) AS avg_active_addresses,
           AVG(tx_count)         AS avg_daily_tx,
           AVG(price_usd)        AS avg_price
    FROM daily_metrics
    WHERE date >= '2017-01-01' AND active_addresses IS NOT NULL
    GROUP BY asset, year
)
SELECT year,
       asset,
       ROUND(avg_active_addresses)  AS avg_active_addresses,
       ROUND(avg_daily_tx)          AS avg_daily_tx,
       ROUND(100.0 * (avg_active_addresses / LAG(avg_active_addresses) OVER w - 1), 1) AS active_addr_yoy_pct,
       ROUND(100.0 * (avg_price / LAG(avg_price) OVER w - 1), 1)                       AS avg_price_yoy_pct
FROM yearly
WINDOW w AS (PARTITION BY asset ORDER BY year)
ORDER BY asset, year;
