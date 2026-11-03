-- Q3a. Monthly net exchange flows for BTC and ETH, paired with the following month's return.
-- Net flow = USD sent to exchanges minus USD withdrawn. Positive = coins moving onto exchanges.
WITH monthly AS (
    SELECT asset,
           substr(date, 1, 7)                                 AS month,
           SUM(exchange_inflow_usd - exchange_outflow_usd)    AS net_flow_usd,
           SUM(exchange_inflow_usd + exchange_outflow_usd)    AS gross_flow_usd,
           MAX(date)                                          AS last_date
    FROM daily_metrics
    WHERE asset IN ('BTC', 'ETH')
      AND date >= '2018-01-01'
      AND exchange_inflow_usd IS NOT NULL
    GROUP BY asset, month
),
priced AS (
    SELECT m.*,
           d.price_usd AS month_close
    FROM monthly AS m
    JOIN daily_metrics AS d ON d.asset = m.asset AND d.date = m.last_date
)
SELECT asset,
       month,
       ROUND(net_flow_usd / 1e9, 2)                              AS net_flow_bn,
       ROUND(100.0 * net_flow_usd / gross_flow_usd, 2)           AS net_flow_pct_of_gross,
       CASE WHEN net_flow_usd > 0 THEN 'Net inflow' ELSE 'Net outflow' END AS flow_direction,
       ROUND(100.0 * (LEAD(month_close) OVER w / month_close - 1), 1)        AS next_month_return_pct
FROM priced
WINDOW w AS (PARTITION BY asset ORDER BY month)
ORDER BY asset, month;
