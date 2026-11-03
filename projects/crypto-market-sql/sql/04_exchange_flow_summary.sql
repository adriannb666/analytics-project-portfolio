-- Q3b. Do months of net exchange outflow tend to be followed by better returns?
-- Descriptive comparison only; complete months 2018-01 to 2026-03 (next month must be complete).
WITH monthly AS (
    SELECT asset,
           substr(date, 1, 7)                              AS month,
           SUM(exchange_inflow_usd - exchange_outflow_usd) AS net_flow_usd,
           MAX(date)                                       AS last_date
    FROM daily_metrics
    WHERE asset IN ('BTC', 'ETH') AND date >= '2018-01-01' AND date < '2026-05-01'
    GROUP BY asset, month
),
labeled AS (
    SELECT m.asset,
           m.month,
           CASE WHEN m.net_flow_usd > 0 THEN 'Net inflow' ELSE 'Net outflow' END AS flow_direction,
           LEAD(d.price_usd) OVER (PARTITION BY m.asset ORDER BY m.month) / d.price_usd - 1 AS next_ret
    FROM monthly AS m
    JOIN daily_metrics AS d ON d.asset = m.asset AND d.date = m.last_date
)
SELECT asset,
       flow_direction,
       COUNT(*)                                          AS months,
       ROUND(100.0 * AVG(next_ret), 1)                   AS avg_next_month_return_pct,
       ROUND(100.0 * AVG(next_ret > 0), 0)               AS pct_months_next_up
FROM labeled
WHERE next_ret IS NOT NULL
GROUP BY asset, flow_direction
ORDER BY asset, flow_direction;
