import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyBboxPatch
import numpy as np
import pandas as pd
from cdata import *

plt.rcParams["font.family"] = "Noto Sans CJK SC"
plt.rcParams["axes.unicode_minus"] = False
BG, GRID_C, TXT = "#131722", "#2a2e39", "#d1d4dc"
UP, DN, GOLD, BLUE, PURPLE, GREY = "#26a69a", "#ef5350", "#f5c542", "#42a5f5", "#b388ff", "#8f96a3"
WM = "Discord 搜「交易俱乐部」 · discord.gg/ad-market-research"
SRC = "数据：币安 BTCUSDT 1 小时 K 线（现货价格近似 CME 期货）· 2018/01 – 2026/05 共 438 个周末 · 时间为美东"


def fig_base(title, subtitle):
    fig = plt.figure(figsize=(16, 9), dpi=110)
    fig.patch.set_facecolor(BG)
    fig.text(0.04, 0.945, title, color="white", fontsize=24, weight="bold")
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
    fig.savefig(f"figures/{name}", facecolor=BG, dpi=110)
    plt.close(fig)


# ---------- 1 what is a gap (SVB weekend) ----------
rows = [list(map(int, x.split(","))) for x in SVB.split(";")]
o, h, l, c = map(np.array, zip(*rows))
ts = pd.to_datetime([SVB_T0 + i * 3600000 for i in range(len(rows))], unit="ms", utc=True).tz_convert("America/New_York")
FI, SI = 30, 79
fig = fig_base("什么是 CME 缺口：2023 年 3 月硅谷银行周末", "BTCUSDT 1 小时 · CME 周五 17:00 收盘、周日 18:00 开盘，中间这段比特币照常交易 → CME 图上留下一个「缺口」")
ax = fig.add_axes([0.06, 0.15, 0.74, 0.69])
style(ax)
ax.axvspan(FI + 0.5, SI - 0.5, color=GREY, alpha=0.12)
ax.text((FI + SI) / 2, 26700, "CME 休市\n（周五 17:00 → 周日 18:00）", color=GREY, fontsize=13, ha="center", va="top")
for x in range(len(rows)):
    col = UP if c[x] >= o[x] else DN
    alpha = 0.35 if FI < x < SI else 1
    ax.vlines(x, l[x], h[x], color=col, lw=1, alpha=alpha)
    lo, hi = sorted([o[x], c[x]])
    ax.add_patch(Rectangle((x - 0.32, lo), 0.64, max(hi - lo, 1), color=col, alpha=alpha))
ax.hlines(c[FI], FI, len(rows), color=GOLD, ls="--", lw=1.8)
ax.text(len(rows) + 1, c[FI], f"周五收盘 {c[FI]:,}\n（缺口回补位）", color=GOLD, fontsize=13, va="center", weight="bold")
ax.hlines(o[SI], SI, len(rows), color=BLUE, ls="--", lw=1.8)
ax.text(len(rows) + 1, o[SI] + 250, f"周日开盘 {o[SI]:,}", color=BLUE, fontsize=13, va="center", weight="bold")
ax.annotate("", xy=(SI + 2, o[SI]), xytext=(SI + 2, c[FI]), arrowprops=dict(arrowstyle="<->", color="white", lw=1.5))
ax.text(SI + 4, (o[SI] + c[FI]) / 2, "缺口 +6.0%", color="white", fontsize=15, weight="bold", va="center")
ax.text(108, 20680, "此后 3 年多，价格再也没回到 20,077\n这个缺口至今没补", color=DN, fontsize=15, weight="bold", va="center")
xt = list(range(0, len(rows), 24))
ax.set_xticks(xt)
ax.set_xticklabels([ts[x].strftime("%m/%d") for x in xt])
ax.set_xlim(-2, len(rows) + 2)
ax.set_ylim(19300, 27400)
save(fig, "01_什么是缺口.png")

# ---------- 2 headline: 97% filled ----------
fig = fig_base("传言是真的：96.8% 的缺口最终都补上了", "438 个周末缺口里，价格在开盘后多久回到了周五收盘价")
ax = fig.add_axes([0.08, 0.16, 0.84, 0.68])
style(ax, "y")
ax.bar(range(len(CP)), FILL_CP, color=GOLD, width=0.6)
for k, v in enumerate(FILL_CP):
    ax.text(k, v + 1.5, f"{v:.1f}%", color="white", fontsize=17, weight="bold", ha="center")
ax.set_xticks(range(len(CP)))
ax.set_xticklabels(CP, color="white", fontsize=15)
ax.set_ylim(0, 110)
ax.set_ylabel("已回补的比例（%）", color=TXT, fontsize=13)
ax.text(6, 50, f"没补的只有\n{len(UNFILLED)} 个\n其中就有\nSVB 周末", color="#131722", fontsize=14, ha="center", weight="bold")
save(fig, "02_回补率.png")

# ---------- 3 the twist: random line ----------
fig = fig_base("但是：随便画一条线，也有 96.6% 会被碰到", "同样大小的距离，换成随机时刻、随机方向画一条线 · 「多久被价格碰到」的比例")
ax = fig.add_axes([0.08, 0.16, 0.84, 0.68])
style(ax, "y")
x = np.arange(len(CP))
ax.bar(x - 0.2, FILL_CP, width=0.38, color=GOLD, label="CME 缺口回补位")
ax.bar(x + 0.2, RANDOM_CP, width=0.38, color=GREY, label="随机时刻、随机方向、同样距离的一条线")
for k in range(len(CP)):
    ax.text(x[k] - 0.2, FILL_CP[k] + 1.2, f"{FILL_CP[k]:.0f}", color=GOLD, fontsize=14, ha="center", weight="bold")
    ax.text(x[k] + 0.2, RANDOM_CP[k] + 1.2, f"{RANDOM_CP[k]:.0f}", color=TXT, fontsize=14, ha="center", weight="bold")
ax.set_xticks(x)
ax.set_xticklabels(CP, color="white", fontsize=15)
ax.set_ylim(0, 112)
ax.set_ylabel("被价格碰到的比例（%）", color=TXT, fontsize=13)
ax.legend(loc="upper left", facecolor="#1e222d", edgecolor=GRID_C, labelcolor=TXT, fontsize=13)
fig.text(0.5, 0.86, "两组几乎一模一样：缺口会补，只是因为比特币波动大，任何不太远的价格迟早都会被碰到", color=GOLD, fontsize=14, ha="center")
save(fig, "03_随机对照.png")

# ---------- 4 race curves ----------
gh = np.array(GRID_H) + 1
fig = fig_base("更扎心：反方向那条线，到得更快", "从周日开盘算起，价格碰到「缺口回补位」与碰到「反方向同样距离的位置」的累计比例")
ax = fig.add_axes([0.08, 0.16, 0.8, 0.68])
style(ax)
ax.plot(gh, FILL, color=GOLD, lw=3, label="缺口回补位（周五收盘价）")
ax.plot(gh, MIRROR, color=BLUE, lw=3, label="反方向、同样距离的位置")
ax.fill_between(gh, FILL, MIRROR, color=BLUE, alpha=0.12)
ax.set_xscale("log")
ticks = [1, 4, 24, 168, 720, 2160, 8760]
ax.set_xticks(ticks)
ax.set_xticklabels(["1小时", "4小时", "1天", "1周", "1个月", "3个月", "1年"])
ax.minorticks_off()
ax.set_ylim(0, 102)
ax.set_ylabel("已被碰到的比例（%）", color=TXT, fontsize=13)
ax.legend(loc="lower right", facecolor="#1e222d", edgecolor=GRID_C, labelcolor=TXT, fontsize=13)
ax.annotate(f"中位时间：反方向 {MED_MIRROR_H} 小时\n缺口回补 {MED_FILL_H} 小时", xy=(8, 50), xytext=(1.3, 75), color="white", fontsize=14,
            weight="bold", arrowprops=dict(arrowstyle="->", color="white"))
save(fig, "04_谁先到.png")

# ---------- 5 race bar ----------
ff, mf, tie = RACE["fill_first"], RACE["mirror_first"], RACE["same_hour"]
fig = fig_base("如果开盘就去「赌补缺口」：止盈缺口、止损同样距离", "438 个周末里，先碰到哪一边")
ax = fig.add_axes([0.08, 0.36, 0.84, 0.36])
ax.set_facecolor(BG)
tot = ff + mf + tie
parts = [(ff, GOLD, f"先补缺口\n{ff} 次（{ff / tot:.0%}）"), (mf, BLUE, f"先到反方向\n{mf} 次（{mf / tot:.0%}）"), (tie, GREY, f"同一小时内\n{tie} 次")]
left = 0
for v, col, lab in parts:
    ax.barh(0, v, left=left, color=col, height=0.6)
    ax.text(left + v / 2, 0, lab, color="#131722" if col != GREY else "white", fontsize=16, weight="bold", ha="center", va="center")
    left += v
ax.set_xlim(0, tot)
ax.axis("off")
fig.text(0.5, 0.25, f"排除同一小时的情况，先补缺口的概率只有 {ff / (ff + mf):.1%}，比抛硬币还差（二项检验 p ≈ 0.0003）\n"
         f"盈亏比 1:1 的话，平均每次 {(ff - mf) / (ff + mf):+.2f}R，还没算手续费",
         color=TXT, fontsize=15, ha="center", va="center", linespacing=1.8)
save(fig, "05_赌补缺口.png")

# ---------- 6 by size ----------
fig = fig_base("按缺口大小拆开：哪一档都没有「先补」的优势", "排除同一小时的情况后，「先补缺口」的比例 · 括号内为缺口个数")
ax = fig.add_axes([0.08, 0.16, 0.84, 0.66])
style(ax, "y")
labs = [b[0] for b in BUCKETS]
pct = [b[2] / (b[2] + b[3]) * 100 for b in BUCKETS]
ax.bar(range(len(BUCKETS)), pct, color=[GOLD if p >= 50 else BLUE for p in pct], width=0.6)
for k, (b, p) in enumerate(zip(BUCKETS, pct)):
    ax.text(k, p + 1.5, f"{p:.0f}%", color="white", fontsize=17, weight="bold", ha="center")
ax.axhline(50, color=TXT, ls="--", lw=1.2)
ax.text(4.45, 51, "抛硬币 50%", color=TXT, fontsize=12, ha="right")
ax.set_xticks(range(len(BUCKETS)))
ax.set_xticklabels([f"{b[0]}\n（{b[1]}）" for b in BUCKETS], color="white", fontsize=14)
ax.set_ylim(0, 75)
ax.set_ylabel("先补缺口的比例（%）", color=TXT, fontsize=13)
save(fig, "06_按缺口大小.png")

# ---------- 7 by year ----------
yrs = list(RACE_YEAR.keys())
p = [RACE_YEAR[y][0] / sum(RACE_YEAR[y]) * 100 for y in yrs]
fig = fig_base("按年份：2022 年之后，「补缺口」越来越不灵", "排除同一小时的情况后，「先补缺口」的比例")
ax = fig.add_axes([0.08, 0.16, 0.84, 0.66])
style(ax, "y")
ax.bar(range(len(yrs)), p, color=[GOLD if v >= 50 else BLUE for v in p], width=0.6)
for k, v in enumerate(p):
    ax.text(k, v + 1.5, f"{v:.0f}%", color="white", fontsize=15, weight="bold", ha="center")
ax.axhline(50, color=TXT, ls="--", lw=1.2)
ax.set_xticks(range(len(yrs)))
ax.set_xticklabels([str(y) + ("\n（到 5 月）" if y == 2026 else "") for y in yrs], color="white", fontsize=14)
ax.set_ylim(0, 70)
fig.text(0.5, 0.86, "2018–2021：先补缺口 47%（90 : 103，和抛硬币没区别）· 2022 年以后：35%（73 : 134）", color=GOLD, fontsize=14, ha="center")
save(fig, "07_按年份.png")
print("ok")
