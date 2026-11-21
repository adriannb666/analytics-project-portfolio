"""English figures for the Thanksgiving / Santa Claus rally study (LinkedIn / X)."""
import json, os
os.makedirs("figures_en", exist_ok=True)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["axes.unicode_minus"] = False
BG, GRID_C, TXT = "#131722", "#2a2e39", "#d1d4dc"
UP, DN, GOLD, BLUE, GREY = "#26a69a", "#ef5350", "#f5c542", "#42a5f5", "#8f96a3"
WM = "Adrian Zhang · AD Market Research"
SRC = "Data: Yahoo Finance, S&P 500 index daily close (price only, no dividends) · 1950–2025, 76 years"

d = json.load(open("data/plot_data.json"))
R = d["rows"]
Y = np.array([r[0] for r in R])
TG = np.array([r[1] for r in R])
SA = np.array([r[2] for r in R])
NY = [r[3] for r in R]
M = d["meta"]
DEC_BASE = {1950: 0.37, 1960: 0.144, 1970: 0.077, 1980: 0.372, 1990: 0.413, 2000: -0.011, 2010: 0.318, 2020: 0.399}


def fig_base(title, subtitle):
    fig = plt.figure(figsize=(16, 9), dpi=110)
    fig.patch.set_facecolor(BG)
    fig.text(0.04, 0.945, title, color="white", fontsize=24, weight="bold")
    fig.text(0.04, 0.905, subtitle, color=GREY, fontsize=13)
    fig.text(0.04, 0.03, SRC, color=GREY, fontsize=10.5, va="bottom")
    fig.text(0.96, 0.065, WM, color="white", alpha=0.55, fontsize=13, ha="right", va="bottom")
    return fig


def style(ax, axis="y"):
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color(GRID_C)
    ax.tick_params(colors=TXT, labelsize=12)
    ax.grid(color=GRID_C, linewidth=0.6, axis=axis)
    ax.set_axisbelow(True)


def save(fig, name):
    fig.savefig(f"figures_en/{name}", facecolor=BG, dpi=110)
    plt.close(fig)


# 1 ---- every year, Thanksgiving -> year end
fig = fig_base(f"Thanksgiving to year-end: up in {int((TG > 0).sum())} of 76 years",
               "S&P 500 return from the close on the Wednesday before Thanksgiving to the last trading day of December")
ax = fig.add_axes([0.06, 0.14, 0.9, 0.7])
style(ax)
ax.bar(Y, TG, color=[UP if v > 0 else DN for v in TG], width=0.75)
ax.axhline(TG.mean(), color=GOLD, lw=2, ls="--")
ax.axhline(M["tg_sim_mean"], color=GREY, lw=2, ls=":")
box = dict(facecolor=BG, edgecolor=GRID_C, boxstyle="round,pad=0.5")
ax.text(1975, 14.2, f"- - -  Thanksgiving → year-end, average {TG.mean():+.2f}%", color=GOLD, fontsize=14, weight="bold", bbox=box)
ax.text(1975, 12.6, f"·······  Random window of the same length, average {M['tg_sim_mean']:+.2f}%", color=TXT, fontsize=13, weight="bold", bbox=box)
for yy, v in [(1971, 13.019), (1991, 10.766), (2002, -6.289), (2018, -5.399), (2022, -4.662)]:
    ax.text(yy, v + (0.3 if v > 0 else -0.3), f"{yy}\n{v:+.1f}%", color=TXT, fontsize=11, ha="center", va="bottom" if v > 0 else "top")
ax.set_ylabel("Return (%)", color=TXT, fontsize=13)
ax.set_xlim(1948.5, 2026.5)
ax.set_ylim(-8.5, 15.5)
save(fig, "01_thanksgiving_every_year.png")


# 2 ---- random control, two panels
def hist_panel(ax, h, real, simmean, p, title, color):
    style(ax)
    xs = np.array([a for a, _ in h]); cs = np.array([b for _, b in h])
    ax.bar(xs + 0.025, cs / cs.sum() * 100, width=0.048, color=GREY, alpha=0.75)
    ax.axvline(real, color=color, lw=3)
    top = (cs / cs.sum() * 100).max()
    ax.text(real - 0.03, top * 1.2, f"Actual {real:+.2f}%", color=color, fontsize=15, weight="bold", ha="right", va="bottom")
    ax.text(simmean, top * 1.03, f"Random avg {simmean:+.2f}%", color=TXT, fontsize=13, ha="center", va="bottom")
    ax.set_title(title, color="white", fontsize=16, weight="bold", pad=12, loc="left")
    ax.set_ylim(0, top * 1.4)
    ax.set_xlabel("Average return over 76 years (%)", color=TXT, fontsize=12)
    ax.text(0.02, 0.95, f"Share of random runs ≥ actual\np = {p}", transform=ax.transAxes, color=TXT, fontsize=13, ha="left", va="top")


fig = fig_base("Against random days: the Santa rally is real, the Thanksgiving run barely passes",
               "Grey: 10,000 simulations. Each picks a random start day in every year, holds the same number of trading days, and averages 76 years")
ax1 = fig.add_axes([0.06, 0.15, 0.41, 0.66])
ax2 = fig.add_axes([0.55, 0.15, 0.41, 0.66])
hist_panel(ax1, d["tgHist"], M["tg_real_mean"], M["tg_sim_mean"], "0.04", "Thanksgiving → year-end (~24 trading days)", GOLD)
hist_panel(ax2, d["saHist"], M["santa_real_mean"], M["santa_sim_mean"], "0.0003", "Santa rally: last 5 days + first 2 of January", UP)
ax2.set_xlim(-0.9, 1.45)
save(fig, "02_random_control.png")


# 3 ---- day by day around year end
off = d["off"]
k = np.array([o[0] for o in off]); m = np.array([o[1] for o in off]); up = np.array([o[2] for o in off])
fig = fig_base("Where the gains are: the last 5 days of December + the first 2 of January",
               "Day 0 = last trading day of December. Each bar is the average daily return on that day across 76 years")
ax = fig.add_axes([0.06, 0.14, 0.9, 0.7])
style(ax)
santa = (k >= -4) & (k <= 2)
ax.bar(k, m, color=[UP if s else "#4a5060" for s in santa], width=0.7)
ax.axhline(M["all_day_mean_pct"], color=GOLD, ls="--", lw=2)
ax.text(-15.3, M["all_day_mean_pct"] + 0.012, f"Average day {M['all_day_mean_pct']:+.3f}%", color=GOLD, fontsize=13, weight="bold")
for kk, mm, uu in zip(k, m, up):
    if -4 <= kk <= 2:
        ax.text(kk, mm + 0.01, f"{mm:+.2f}%\nup {uu*100:.0f}%", color="white", fontsize=10.5, ha="center", va="bottom")
ax.axvline(0.5, color=GREY, lw=1, ls=":")
ax.text(0.6, -0.17, "New year →", color=GREY, fontsize=13)
ax.text(-1, 0.42, "Santa rally 7 days: +0.18% per day, 5x an average day", color=UP, fontsize=15, weight="bold", ha="center")
ax.set_xticks(k)
ax.set_xticklabels([("Last\nday" if x == 0 else ("Jan\nday %d" % x if x > 0 else str(x))) for x in k], fontsize=11, rotation=0)
ax.set_ylim(-0.2, 0.48)
ax.set_ylabel("Average daily return (%)", color=TXT, fontsize=13)
save(fig, "03_day_by_day.png")


# 4 ---- Thanksgiving week day by day
to = d["toff"]
labels = {-5: "Wed", -4: "Thu", -3: "Fri", -2: "Mon", -1: "Tue", 0: "Wed before\nThanksgiving", 1: "Black\nFriday", 2: "Mon after", 3: "Tue"}
kk = [o[0] for o in to]; mm = np.array([o[1] for o in to]); uu = [o[2] for o in to]
fig = fig_base("Thanksgiving week: strong Wednesday and Black Friday, then Monday gives half back",
               "Average daily return and share of up years for each day around Thanksgiving, 1950–2025")
ax = fig.add_axes([0.06, 0.17, 0.9, 0.67])
style(ax)
cols = [UP if x in (0, 1) else (DN if x == 2 else "#4a5060") for x in kk]
ax.bar(range(len(kk)), mm, color=cols, width=0.65)
ax.axhline(M["all_day_mean_pct"], color=GOLD, ls="--", lw=2)
ax.text(3, M["all_day_mean_pct"] + 0.03, f"Average day {M['all_day_mean_pct']:+.3f}%", color=GOLD, fontsize=13, weight="bold", ha="center")
for i, (a, b) in enumerate(zip(mm, uu)):
    ax.text(i, a + (0.012 if a >= 0 else -0.012), f"{a:+.2f}%\nup {b*100:.0f}%", color="white", fontsize=12, ha="center", va="bottom" if a >= 0 else "top")
ax.set_xticks(range(len(kk)))
ax.set_xticklabels([labels[x] for x in kk], fontsize=12, color=TXT)
ax.set_ylim(-0.42, 0.46)
ax.set_ylabel("Average daily return (%)", color=TXT, fontsize=13)
save(fig, "04_thanksgiving_week.png")


# 5 ---- fading by decade
decs = list(range(1950, 2030, 10))
sm = [SA[(Y >= a) & (Y < a + 10)].mean() for a in decs]
fig = fig_base("But it's fading: since 2010 the Santa rally is no better than an ordinary week",
               "Green/red: average Santa rally return by decade · Grey: average of any 7 trading days in the same decade")
ax = fig.add_axes([0.06, 0.14, 0.56, 0.7])
style(ax)
x = np.arange(len(decs))
ax.bar(x - 0.2, sm, width=0.38, color=[UP if a > DEC_BASE[b] else DN for a, b in zip(sm, decs)], label="Santa rally (7 days)")
ax.bar(x + 0.2, [DEC_BASE[b] for b in decs], width=0.38, color=GREY, alpha=0.8, label="Any 7 trading days")
for i, (a, b) in enumerate(zip(sm, decs)):
    ax.text(i - 0.2, a + 0.05, f"{a:+.2f}", color="white", fontsize=11.5, ha="center")
ax.set_xticks(x)
ax.set_xticklabels([f"{b}s" if b < 2020 else "2020–25" for b in decs], fontsize=12, color=TXT)
ax.set_ylabel("Average return (%)", color=TXT, fontsize=13)
ax.legend(facecolor=BG, edgecolor=GRID_C, labelcolor=TXT, fontsize=12, loc="upper right")
ax.set_ylim(-0.3, 3.2)
ax2 = fig.add_axes([0.68, 0.14, 0.28, 0.7])
style(ax2, axis="x")
ry = Y[-10:]; rv = SA[-10:]
ax2.barh(range(len(ry)), rv, color=[UP if v > 0 else DN for v in rv], height=0.65)
ax2.set_yticks(range(len(ry)))
ax2.set_yticklabels([f"{y}→{y+1}" for y in ry], fontsize=12, color=TXT)
ax2.invert_yaxis()
for i, v in enumerate(rv):
    ax2.text(v + (0.05 if v >= 0 else -0.05), i, f"{v:+.1f}%", color="white", fontsize=11.5, va="center", ha="left" if v >= 0 else "right")
ax2.set_xlim(-1.8, 2.2)
ax2.axvline(0, color=GREY, lw=1)
ax2.set_title("Last 10: three misses in a row", color="white", fontsize=15, weight="bold", loc="left", pad=10)
save(fig, "05_by_decade.png")


# 6 ---- "if Santa fails, bears come"?
pairs = [(s, n) for s, n in zip(SA, NY) if n is not None]
fail = [n for s, n in pairs if s <= 0]; ok = [n for s, n in pairs if s > 0]
fig = fig_base("\"If Santa fails to call, bears will come\"? The data says no",
               "S&P 500 return in the following calendar year, split by whether the Santa rally showed up")
ax = fig.add_axes([0.08, 0.14, 0.6, 0.7])
style(ax)
rng = np.random.default_rng(1)
for i, (vals, c, name) in enumerate([(ok, UP, "ok"), (fail, DN, "fail")]):
    xs = i + rng.uniform(-0.18, 0.18, len(vals))
    if i == 1:
        failx = xs
    ax.scatter(xs, vals, s=70, color=c, alpha=0.85, edgecolor="white", linewidth=0.5)
    mv = np.mean(vals)
    ax.hlines(mv, i - 0.3, i + 0.3, color="white", lw=3)
    ax.text(i + 0.33, mv, f"avg {mv:+.1f}%\nup {sum(v > 0 for v in vals)}/{len(vals)} years", color="white", fontsize=13, va="center", weight="bold")
ax.set_xticks([0, 1])
ax.set_xticklabels(["Santa rally showed up\n(58 times)", "Santa rally failed\n(17 times)"], fontsize=14, color=TXT)
ax.axhline(0, color=GREY, lw=1)
ax.set_ylabel("Next-year return (%)", color=TXT, fontsize=13)
ax.set_xlim(-0.5, 1.9)
for yy, s, n in zip(Y, SA, NY):
    if n is not None and s <= 0 and (n < -30 or yy in (2023, 2024)):
        ax.annotate(f"{yy + 1}: {n:+.1f}%", (failx[fail.index(n)], n), xytext=(1.3, n - (4 if n > 0 else -4)), color=TXT, fontsize=11.5,
                    arrowprops=dict(arrowstyle="-", color=GREY))
txt = ("After the 17 failed Santa\nrallies, the next year was\nstill up 12 times (avg +6.7%).\n\nOnly 3 big drops followed:\n1969 -11.4%, 2000 -10.1%,\n2008 -38.5%.\n\nSanta failed at the end of\n2023 and 2024. The S&P then\nrose 23.3% and 16.4%.")
fig.text(0.72, 0.8, txt, color=TXT, fontsize=14, va="top", linespacing=1.5)
save(fig, "06_santa_fails.png")


# 7 ---- only holding in Santa windows
fig = fig_base("Real but tiny: holding only these 7 days made 2.5x in 76 years; buy-and-hold made 411x",
               "Left: growth of $1 held only during the 7-day Santa rally each year since 1950 · Right: buy-and-hold over the same period")
ax = fig.add_axes([0.08, 0.14, 0.55, 0.64])
style(ax)
g = np.cumprod(1 + SA / 100)
ax.plot(Y, g, color=UP, lw=3)
ax.set_ylabel("Growth of $1", color=TXT, fontsize=13)
ax.text(Y[-1], g[-1] + 0.05, f"${g[-1]:.2f}", color=UP, fontsize=15, weight="bold", ha="right", va="bottom")
ax.set_title("Santa rally days only", color="white", fontsize=15, weight="bold", loc="left")
ax2 = fig.add_axes([0.7, 0.14, 0.26, 0.64])
style(ax2)
ax2.bar([0, 1], [2.52, 410.9], color=[UP, GOLD], width=0.6)
ax2.set_yscale("log")
ax2.set_xticks([0, 1])
ax2.set_xticklabels(["7 days a year", "Buy and hold"], fontsize=13, color=TXT)
ax2.text(0, 2.52 * 1.3, "2.5x", color="white", fontsize=15, weight="bold", ha="center")
ax2.text(1, 410.9 * 1.3, "411x", color="white", fontsize=15, weight="bold", ha="center")
ax2.set_ylim(1, 3000)
ax2.set_title("log scale", color=GREY, fontsize=12, loc="left")
fig.text(0.04, 0.855, "These 7 days are 2.8% of trading days but ~15% of the index's log return. The effect is real, but useless for timing the market.",
         color=GOLD, fontsize=13)
save(fig, "07_only_7_days.png")
print("ok")
