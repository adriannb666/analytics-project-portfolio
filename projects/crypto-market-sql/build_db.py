"""Build the SQLite database used by the SQL analysis.

Reads Coin Metrics community CSVs (one file per asset), keeps the columns the
analysis needs, writes a tidy long-format CSV (data/daily_metrics.csv) and
loads it into data/crypto.db with an `assets` dimension table.

    python build_db.py --source /path/to/coinmetrics/csv   # build from raw files
    python build_db.py                                     # rebuild DB from data/daily_metrics.csv

Raw files: https://github.com/coinmetrics/data (csv/<asset>.csv), CC BY-NC 4.0.
"""
import argparse
import sqlite3
from pathlib import Path

import pandas as pd

HERE = Path(__file__).parent
DATA = HERE / "data"
ASSETS = {"btc": ("Bitcoin", "Store of value"), "eth": ("Ethereum", "Smart-contract platform"),
          "xrp": ("XRP", "Payments"), "ada": ("Cardano", "Smart-contract platform"),
          "doge": ("Dogecoin", "Meme / payments")}
COLUMNS = {"time": "date", "PriceUSD": "price_usd", "CapMrktCurUSD": "market_cap_usd",
           "volume_reported_spot_usd_1d": "spot_volume_usd", "AdrActCnt": "active_addresses",
           "TxCnt": "tx_count", "FlowInExUSD": "exchange_inflow_usd",
           "FlowOutExUSD": "exchange_outflow_usd"}


def tidy_from_source(source: Path) -> pd.DataFrame:
    frames = []
    for code in ASSETS:
        raw = pd.read_csv(source / f"{code}.csv", usecols=lambda c: c in COLUMNS)
        df = raw.rename(columns=COLUMNS).reindex(columns=list(COLUMNS.values()))
        df = df.dropna(subset=["price_usd"])
        df.insert(0, "asset", code.upper())
        frames.append(df)
    out = pd.concat(frames, ignore_index=True)
    out["date"] = pd.to_datetime(out["date"]).dt.strftime("%Y-%m-%d")
    return out.sort_values(["asset", "date"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path, help="folder with Coin Metrics <asset>.csv files")
    args = ap.parse_args()
    DATA.mkdir(exist_ok=True)
    tidy_path = DATA / "daily_metrics.csv"
    if args.source:
        tidy = tidy_from_source(args.source)
        tidy.to_csv(tidy_path, index=False, float_format="%.6g")
    tidy = pd.read_csv(tidy_path)

    db = DATA / "crypto.db"
    db.unlink(missing_ok=True)
    with sqlite3.connect(db) as con:
        pd.DataFrame([(k.upper(), n, s) for k, (n, s) in ASSETS.items()],
                     columns=["asset", "asset_name", "segment"]).to_sql("assets", con, index=False)
        tidy.to_sql("daily_metrics", con, index=False)
        con.execute("CREATE UNIQUE INDEX ix_daily ON daily_metrics(asset, date)")
    print(f"{len(tidy):,} rows, {tidy['date'].min()} to {tidy['date'].max()} -> {db}")


if __name__ == "__main__":
    main()
