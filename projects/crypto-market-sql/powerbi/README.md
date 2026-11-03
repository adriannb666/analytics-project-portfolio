# Power BI Dashboard: Crypto Market Intelligence

A one-page dashboard on the same data as the SQL analysis. Save the finished report as `crypto_market.pbix` and a screenshot as `dashboard.png` in this folder.

<!-- After saving the screenshot, add it here: ![Dashboard](dashboard.png) -->

## 1. Load data

In **Get Data → Text/CSV**, load:

| File | Table name |
| --- | --- |
| `../data/daily_metrics.csv` | `daily_metrics` |
| `../outputs/02_risk_return.csv` | `risk_return` |
| `../outputs/04_exchange_flow_summary.csv` | `flow_summary` |
| `../outputs/06_drawdown_from_ath.csv` | `drawdown` |

In Power Query, set `daily_metrics[date]` to type **Date** and every numeric column to **Decimal number**.

## 2. Model

Create a date table (**Modeling → New table**):

```DAX
Calendar =
ADDCOLUMNS (
    CALENDAR ( DATE ( 2018, 1, 1 ), DATE ( 2026, 5, 31 ) ),
    "Year", YEAR ( [Date] ),
    "Month", FORMAT ( [Date], "YYYY-MM" ),
    "Month Start", DATE ( YEAR ( [Date] ), MONTH ( [Date] ), 1 )
)
```

Then create the relationships:

- `Calendar[Date]` 1 → * `daily_metrics[date]`
- Mark `Calendar` as a date table.

## 3. Measures

Put these measures in `daily_metrics`:

```DAX
Spot Volume ($bn) = SUM ( daily_metrics[spot_volume_usd] ) / 1e9

Volume Share % =
DIVIDE (
    SUM ( daily_metrics[spot_volume_usd] ),
    CALCULATE ( SUM ( daily_metrics[spot_volume_usd] ), ALL ( daily_metrics[asset] ) )
)

Volume YoY % =
VAR cur = SUM ( daily_metrics[spot_volume_usd] )
VAR prev = CALCULATE ( SUM ( daily_metrics[spot_volume_usd] ), SAMEPERIODLASTYEAR ( Calendar[Date] ) )
RETURN DIVIDE ( cur - prev, prev )

Latest Price =
VAR lastDate = CALCULATE ( MAX ( daily_metrics[date] ), ALLEXCEPT ( daily_metrics, daily_metrics[asset] ) )
RETURN CALCULATE ( MAX ( daily_metrics[price_usd] ), daily_metrics[date] = lastDate )

Net Exchange Flow ($bn) =
( SUM ( daily_metrics[exchange_inflow_usd] ) - SUM ( daily_metrics[exchange_outflow_usd] ) ) / 1e9

Avg Active Addresses = AVERAGE ( daily_metrics[active_addresses] )
```

Format `Volume Share %` and `Volume YoY %` as percentages.

## 4. Page layout

| Position | Visual | Fields |
| --- | --- | --- |
| Top | Slicers | `daily_metrics[asset]`, `Calendar[Year]` (between) |
| Top row | 4 KPI cards | Spot Volume ($bn), Volume YoY %, Latest Price (one asset selected), Avg Active Addresses |
| Middle left | 100% stacked column | X `Calendar[Year]`, Y Spot Volume ($bn), legend `asset` |
| Middle right | Line chart | X `Calendar[Month Start]`, Y `price_usd` (average), legend `asset`, log scale on Y |
| Bottom left | Clustered column | `flow_summary`: X `asset`, Y `avg_next_month_return_pct`, legend `flow_direction` |
| Bottom right | Bar chart | `drawdown`: Y `asset`, X `pct_below_ath` |
| Tooltip | Table | `risk_return` filtered to the selected year: return, volatility, max drawdown |

The title should state the main finding, for example: *"BTC volume share swings with the cycle: 50% in 2021 and 2025, 68% in 2023."*
