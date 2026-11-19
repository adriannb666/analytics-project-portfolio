"""English versions of the key figures (for LinkedIn / X)."""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import numpy as np
import pandas as pd
from cdata import *

plt.rcParams["font.family"] = ["DejaVu Sans", "Noto Sans CJK SC"]
plt.rcParams["axes.unicode_minus"] = False
BG, GRID_C, TXT = "#131722", "#2a2e39", "#d1d4dc"
UP, DN, GOLD, BLUE, GREY = "#26a69a", "#ef5350", "#f5c542", "#42a5f5", "#8f96a3"
WM = "Adrian Zhang · AD Market Research"
SRC = "Data: Binance BTCUSDT 1-hour candles (spot as a proxy for CME futures) · 438 weekends, Jan 2018 – May 2026 · US Eastern time"
os.makedirs("figures_en", exist_ok=True)


def fig_base(title, subtitle):
    fig = plt.figure(figsize=(16, 9), dpi=110)
    fig.patch.set_facecolor(BG)
    fig.text(0.04, 0.945, title, color="white", fontsize=23, weight="bold")
    fig.text(0.04, 0.905, subtitle, color=GREY, fontsize=13)
    fig.text(0.04, 0.03, SRC, color=GREY, fontsize=10.5, va="bottom")
    fig.text(0.96, 0.065, WM, color="white", alpha=0.55, fontsize=13, ha="right", va="bottom")
    return fig


def style(ax, axis="both"):
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color(GRID_C)
    ax.tick_params(colors=TXT, labelsize=12)
    ax.grid(color=GRID_C, linewidth=0.6, axis=axis)


def save(fig, name):
    fig.savefig(f"figures_en/{name}", facecolor=BG, dpi=110)
    plt.close(fig)


CP_EN = ["1 hour", "4 hours", "1 day", "1 week", "1 month", "3 months", "To date"]

# 1 SVB example
rows = [list(map(int, x.split(","))) for x in SVB.split(";")]
o, h, l, c = map(np.array, zip(*rows))
ts = pd.to_datetime([SVB_T0 + i * 3600000 for i in range(len(rows))], unit="ms", utc=True).tz_convert("America/New_York")
FI, SI = 30, 79
fig = fig_base("What a CME gap looks like: the SVB weekend, March 2023",
               "CME closed Friday 5 pm and reopened Sunday 6 pm ET. Bitcoin kept trading in between, leaving a 'gap' on the CME chart.")
ax = fig.add_axes([0.06, 0.15, 0.74, 0.69])
style(ax)
ax.axvspan(FI + 0.5, SI - 0.5, color=GREY, alpha=0.12)
ax.text((FI + SI) / 2, 26700, "CME closed\n(Fri 5 pm → Sun 6 pm)", color=GREY, fontsize=13, ha="center", va="top")
for x in range(len(rows)):
    col = UP if c[x] >= o[x] else DN
    a = 0.35 if FI < x < SI else 1
    ax.vlines(x, l[x], h[x], color=col, lw=1, alpha=a)
    lo, hi = sorted([o[x], c[x]])
    ax.add_patch(Rectangle((x - 0.32, lo), 0.64, max(hi - lo, 1), color=col, alpha=a))
ax.hlines(c[FI], FI, len(rows), color=GOLD, ls="--", lw=1.8)
ax.text(len(rows) + 1, c[FI], f"Friday close {c[FI]:,}\n(gap-fill level)", color=GOLD, fontsize=13, va="center", weight="bold")
ax.hlines(o[SI], SI, len(rows), color=BLUE, ls="--", lw=1.8)
ax.text(len(rows) + 1, o[SI] + 250, f"Sunday open {o[SI]:,}", color=BLUE, fontsize=13, va="center", weight="bold")
ax.annotate("", xy=(SI + 2, o[SI]), xytext=(SI + 2, c[FI]), arrowprops=dict(arrowstyle="<->", color="white", lw=1.5))
ax.text(SI + 4, (o[SI] + c[FI]) / 2, "Gap +6.0%", color="white", fontsize=15, weight="bold", va="center")
ax.text(108, 20680, "More than 3.5 years later, price has never\nreturned to 20,077. This gap is still open.", color=DN, fontsize=14, weight="bold", va="center")
xt = list(range(0, len(rows), 24))
ax.set_xticks(xt)
ax.set_xticklabels([ts[x].strftime("%b %d") for x in xt])
ax.set_xlim(-2, len(rows) + 2)
ax.set_ylim(19300, 27400)
save(fig, "01_svb_gap.png")

# 2 random control
fig = fig_base("97% of CME gaps fill. So does a random line.",
               "Share of levels touched by price after the Sunday open: real gap-fill levels vs 20,000 random lines at the same distances")
ax = fig.add_axes([0.08, 0.16, 0.84, 0.68])
style(ax, "y")
x = np.arange(len(CP_EN))
ax.bar(x - 0.2, FILL_CP, width=0.38, color=GOLD, label="CME gap-fill level")
ax.bar(x + 0.2, RANDOM_CP, width=0.38, color=GREY, label="Random time, random direction, same distance")
for k in range(len(CP_EN)):
    ax.text(x[k] - 0.2, FILL_CP[k] + 1.2, f"{FILL_CP[k]:.0f}", color=GOLD, fontsize=14, ha="center", weight="bold")
    ax.text(x[k] + 0.2, RANDOM_CP[k] + 1.2, f"{RANDOM_CP[k]:.0f}", color=TXT, fontsize=14, ha="center", weight="bold")
ax.set_xticks(x)
ax.set_xticklabels(CP_EN, color="white", fontsize=15)
ax.set_ylim(0, 112)
ax.set_ylabel("Touched by price (%)", color=TXT, fontsize=13)
ax.legend(loc="upper left", facecolor="#1e222d", edgecolor=GRID_C, labelcolor=TXT, fontsize=13)
fig.text(0.5, 0.86, "Gaps 'always fill' because Bitcoin is volatile. Any level 1–2% away gets hit eventually.",
         color=GOLD, fontsize=14, ha="center")
save(fig, "02_random_control.png")

# 3 race curves
gh = np.array(GRID_H) + 1
fig = fig_base("The opposite level gets hit first",
               "Cumulative share touched after the Sunday open: the gap-fill level vs the same distance in the opposite direction")
ax = fig.add_axes([0.08, 0.16, 0.8, 0.68])
style(ax)
ax.plot(gh, FILL, color=GOLD, lw=3, label="Gap-fill level (Friday close)")
ax.plot(gh, MIRROR, color=BLUE, lw=3, label="Opposite direction, same distance")
ax.fill_between(gh, FILL, MIRROR, color=BLUE, alpha=0.12)
ax.set_xscale("log")
ticks = [1, 4, 24, 168, 720, 2160, 8760]
ax.set_xticks(ticks)
ax.set_xticklabels(["1 hour", "4 hours", "1 day", "1 week", "1 month", "3 months", "1 year"])
ax.minorticks_off()
ax.set_ylim(0, 102)
ax.set_ylabel("Touched by price (%)", color=TXT, fontsize=13)
ax.legend(loc="lower right", facecolor="#1e222d", edgecolor=GRID_C, labelcolor=TXT, fontsize=13)
ax.text(1.3, 82, f"Median time to touch:\nopposite level {MED_MIRROR_H} hours\ngap fill {MED_FILL_H} hours", color="white", fontsize=14, weight="bold", va="top")
save(fig, "03_race_curves.png")

# 4 bet
ff, mf, tie = RACE["fill_first"], RACE["mirror_first"], RACE["same_hour"]
fig = fig_base("Betting on the fill at every Sunday open",
               "Take profit at the gap, stop at the same distance on the other side. Which level did price reach first?")
ax = fig.add_axes([0.08, 0.36, 0.84, 0.36])
ax.set_facecolor(BG)
tot = ff + mf + tie
left = 0
for v, col, lab in [(ff, GOLD, f"Gap filled first\n{ff} weekends"), (mf, BLUE, f"Opposite level first\n{mf} weekends"), (tie, GREY, f"Same hour\n{tie}")]:
    ax.barh(0, v, left=left, color=col, height=0.6)
    ax.text(left + v / 2, 0, lab, color="#131722" if col != GREY else "white", fontsize=16, weight="bold", ha="center", va="center")
    left += v
ax.set_xlim(0, tot)
ax.axis("off")
fig.text(0.5, 0.25, f"Excluding same-hour cases, the gap filled first only {ff / (ff + mf):.1%} of the time (binomial test p ≈ 0.0003).\n"
         f"At 1:1 reward-to-risk, that is {(ff - mf) / (ff + mf):+.2f}R per trade before fees.",
         color=TXT, fontsize=15, ha="center", va="center", linespacing=1.8)
save(fig, "04_bet_on_fill.png")

# 5 by year
yrs = list(RACE_YEAR.keys())
p = [RACE_YEAR[y][0] / sum(RACE_YEAR[y]) * 100 for y in yrs]
fig = fig_base("It got worse after 2022", "Share of weekends where the gap filled before the opposite level (same-hour cases excluded)")
ax = fig.add_axes([0.08, 0.16, 0.84, 0.66])
style(ax, "y")
ax.bar(range(len(yrs)), p, color=[GOLD if v >= 50 else BLUE for v in p], width=0.6)
for k, v in enumerate(p):
    ax.text(k, v + 1.5, f"{v:.0f}%", color="white", fontsize=15, weight="bold", ha="center")
ax.axhline(50, color=TXT, ls="--", lw=1.2)
ax.text(8.45, 51, "coin flip", color=TXT, fontsize=12, ha="right")
ax.set_xticks(range(len(yrs)))
ax.set_xticklabels([str(y) + ("\n(to May)" if y == 2026 else "") for y in yrs], color="white", fontsize=14)
ax.set_ylim(0, 70)
fig.text(0.5, 0.86, "2018–2021: 47% filled first (90 vs 103). 2022 onward: 35% (73 vs 134).", color=GOLD, fontsize=14, ha="center")
save(fig, "05_by_year.png")
print("ok")
