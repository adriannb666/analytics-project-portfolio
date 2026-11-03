"""Run every query in sql/, save results to outputs/, and draw the README charts.

    python build_db.py        # once, creates data/crypto.db
    python run_analysis.py
"""
import sqlite3
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

HERE = Path(__file__).parent
OUT = HERE / "outputs"
COLORS = {"BTC": "#2f5d8a", "ETH": "#6c8ebf", "XRP": "#9cc3a4", "ADA": "#e0b36a", "DOGE": "#c9787a"}


def run_queries(con) -> dict:
    results = {}
    for path in sorted((HERE / "sql").glob("*.sql")):
        df = pd.read_sql_query(path.read_text(), con)
        df.to_csv(OUT / f"{path.stem}.csv", index=False)
        results[path.stem] = df
        print(f"\n== {path.stem} ({len(df)} rows)\n{df.head(12).to_string(index=False)}")
    return results


def style(ax):
    ax.spines[["top", "right"]].set_visible(False)
    ax.tick_params(labelsize=8)


def chart_volume_share(df):
    pivot = df.pivot(index="year", columns="asset", values="share_pct")[list(COLORS)]
    pivot.index = [y + (" YTD" if y == pivot.index.max() else "") for y in pivot.index]
    fig, ax = plt.subplots(figsize=(7.5, 3.6), dpi=150)
    bottom = 0
    for asset in pivot:
        ax.bar(pivot.index, pivot[asset], bottom=bottom, label=asset, color=COLORS[asset], width=0.7)
        bottom = bottom + pivot[asset]
    ax.set_ylabel("Share of 5-asset spot volume (%)", fontsize=8)
    ax.set_ylim(0, 100)
    ax.set_title("BTC's volume share dips in altcoin-heavy years (2021, 2025) and rebounds after", fontsize=10)
    ax.legend(ncol=5, frameon=False, fontsize=8, loc="upper center", bbox_to_anchor=(0.5, -0.1))
    style(ax)
    fig.tight_layout()
    fig.savefig(OUT / "volume_share.png")


def chart_flows(df):
    pivot = df.pivot(index="asset", columns="flow_direction", values="avg_next_month_return_pct")
    fig, ax = plt.subplots(figsize=(6, 3.2), dpi=150)
    pivot.plot.bar(ax=ax, color=["#c9787a", "#2f5d8a"], rot=0, width=0.65)
    for c in ax.containers:
        ax.bar_label(c, fmt="%.1f%%", fontsize=8, padding=2)
    ax.axhline(0, color="black", linewidth=0.6)
    ax.set_ylabel("Avg. next-month return (%)", fontsize=8)
    ax.set_xlabel("")
    ax.set_title("Next-month return after net exchange inflow vs. outflow months", fontsize=10)
    ax.legend(frameon=False, fontsize=8)
    style(ax)
    fig.tight_layout()
    fig.savefig(OUT / "exchange_flows.png")


def chart_drawdown(df):
    df = df.sort_values("pct_below_ath")
    fig, ax = plt.subplots(figsize=(6, 2.8), dpi=150)
    bars = ax.barh(df["asset"], df["pct_below_ath"], color=[COLORS[a] for a in df["asset"]])
    ax.bar_label(bars, fmt="%.0f%%", fontsize=8, padding=3)
    ax.set_xlim(-100, 0)
    ax.set_xlabel("% below all-time high", fontsize=8)
    ax.set_title(f"Distance from all-time high as of {df['as_of'].iloc[0]}", fontsize=10)
    style(ax)
    fig.tight_layout()
    fig.savefig(OUT / "drawdown_from_ath.png")


def main():
    OUT.mkdir(exist_ok=True)
    with sqlite3.connect(HERE / "data" / "crypto.db") as con:
        r = run_queries(con)
    chart_volume_share(r["01_volume_share"])
    chart_flows(r["04_exchange_flow_summary"])
    chart_drawdown(r["06_drawdown_from_ath"])


if __name__ == "__main__":
    main()
