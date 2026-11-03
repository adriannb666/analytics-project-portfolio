"""Universal Airways fleet expansion: integer programming model.

Python port of the team's original MATLAB `intlinprog` model (see
archive/recovered_01.m). Runs four scenarios so the effect of two modeling
choices is visible:

  * integer vs. continuous (LP relaxation) decision variables
  * Smalltown / Townville service as exact counts (historical MATLAB code)
    vs. minimum counts (how the case narrative describes them)

Usage:  python fleet_model.py            # prints results, writes outputs/
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.optimize import Bounds, LinearConstraint, milp

OUT = Path(__file__).parent / "outputs"

ROUTES = ["Metropolis", "Cityburg", "Smalltown", "Townville"]
PLANES = {"Med-848": {"price_m": 21, "hours": [4.2, 3.2, 1.6, 2.2],
                      "profit": [10400, 6700, -2400, -400]},
          "Smal-286": {"price_m": 7, "hours": [5.2, 3.7, 1.8, 2.6],
                       "profit": [4000, 3200, 400, 1600]}}
HOURS_PER_PLANE = 10      # daily flight hours available per aircraft
BUDGET_M = 160            # purchase budget, $ millions
MAX_FLIGHTS = [8, 13, 13, 12]
REQUIRED = {"Smalltown": 3, "Townville": 4}

# Variable order: Med-848 flights x4, Smal-286 flights x4, Med-848 planes, Smal-286 planes
N = 10


def build_constraints(required_as_minimum: bool):
    rows, lo, hi = [], [], []
    med, sm = PLANES["Med-848"], PLANES["Smal-286"]
    # Flight hours used <= hours available from purchased aircraft
    rows.append(med["hours"] + [0] * 4 + [-HOURS_PER_PLANE, 0]); lo.append(-np.inf); hi.append(0)
    rows.append([0] * 4 + sm["hours"] + [0, -HOURS_PER_PLANE]); lo.append(-np.inf); hi.append(0)
    # Budget
    rows.append([0] * 8 + [med["price_m"], sm["price_m"]]); lo.append(-np.inf); hi.append(BUDGET_M)
    # Route demand caps and required service
    for r, cap in enumerate(MAX_FLIGHTS):
        row = [0] * N
        row[r] = row[4 + r] = 1
        req = REQUIRED.get(ROUTES[r])
        if req is None:
            lo.append(-np.inf)
        else:
            lo.append(req)
        hi.append(cap if (req is None or required_as_minimum) else req)
        rows.append(row)
    return LinearConstraint(np.array(rows, float), lo, hi)


def solve(integer: bool, required_as_minimum: bool):
    c = -np.array(PLANES["Med-848"]["profit"] + PLANES["Smal-286"]["profit"] + [0, 0], float)
    res = milp(c, constraints=build_constraints(required_as_minimum),
               integrality=np.ones(N) if integer else np.zeros(N),
               bounds=Bounds(0, np.inf))
    if not res.success:
        raise RuntimeError(res.message)
    x = np.round(res.x, 4)
    return {
        "variables": "integer" if integer else "continuous",
        "Smalltown/Townville rule": ">= minimum" if required_as_minimum else "= exact (historical code)",
        "daily_profit_usd": round(-res.fun, 2),
        "med848_planes": x[8], "smal286_planes": x[9],
        "aircraft_total": x[8] + x[9],
        "capex_musd": round(x[8] * 21 + x[9] * 7, 2),
        **{f"med848_{r.lower()}": x[i] for i, r in enumerate(ROUTES)},
        **{f"smal286_{r.lower()}": x[4 + i] for i, r in enumerate(ROUTES)},
    }


def main():
    OUT.mkdir(exist_ok=True)
    df = pd.DataFrame([solve(i, m) for m in (False, True) for i in (True, False)])
    df.to_csv(OUT / "scenarios.csv", index=False)
    pd.set_option("display.width", 200)
    print(df.T.to_string(header=False))

    # Chart: recommended integer plan (case rule: minimum service), flights by route and aircraft type
    best = df[(df["variables"] == "integer") & df["Smalltown/Townville rule"].str.startswith(">=")].iloc[0]
    med = [best[f"med848_{r.lower()}"] for r in ROUTES]
    sm = [best[f"smal286_{r.lower()}"] for r in ROUTES]
    fig, ax = plt.subplots(figsize=(7, 3.6), dpi=150)
    ax.bar(ROUTES, med, label=f"Med-848 ({int(best['med848_planes'])} aircraft)", color="#2f5d8a")
    ax.bar(ROUTES, sm, bottom=med, label=f"Smal-286 ({int(best['smal286_planes'])} aircraft)", color="#8fb3d9")
    ax.scatter(ROUTES, MAX_FLIGHTS, marker="_", s=900, color="black", linewidths=1.5,
               label="Route demand cap")
    for i, (a, b) in enumerate(zip(med, sm)):
        ax.text(i, a + b + 0.3, f"{int(a + b)}", ha="center", fontsize=9)
    ax.set_ylabel("Daily flights")
    ax.set_title(f"Optimal integer plan: \\${best['daily_profit_usd']:,.0f} daily profit, "
                 f"\\${best['capex_musd']:.0f}M capex", fontsize=10)
    ax.set_ylim(0, 15)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, fontsize=8, loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=3, markerscale=0.5)
    fig.tight_layout()
    fig.savefig(OUT / "optimal_plan.png")


if __name__ == "__main__":
    main()
