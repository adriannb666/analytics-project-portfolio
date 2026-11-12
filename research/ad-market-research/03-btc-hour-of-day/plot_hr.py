import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm
import numpy as np
import pandas as pd
from hdata import *

plt.rcParams["font.family"] = "Noto Sans CJK SC"
plt.rcParams["axes.unicode_minus"] = False
BG, GRID, TXT = "#131722", "#2a2e39", "#d1d4dc"
UP, DN, GOLD, BLUE, PURPLE, GREY = "#26a69a", "#ef5350", "#f5c542", "#42a5f5", "#b388ff", "#8f96a3"
WM = "Discord 搜「交易俱乐部」 · discord.gg/ad-market-research"
SRC = "数据：币安 BTCUSDT 1 小时 K 线，2020/01/01 – 2026/11/08，60,064 根"


def fig_base(title, subtitle):
    fig = plt.figure(figsize=(16, 9), dpi=110)
    fig.patch.set_facecolor(BG)
    fig.text(0.04, 0.945, title, color="white", fontsize=24, weight="bold")
    fig.text(0.04, 0.905, subtitle, color=GREY, fontsize=13)
    fig.text(0.04, 0.03, SRC, color=GREY, fontsize=11, va="bottom")
    fig.text(0.96, 0.03, WM, color="white", alpha=0.55, fontsize=13, ha="right", va="bottom")
    return fig


def style(ax):
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color(GRID)
    ax.tick_params(colors=TXT, labelsize=12)
    ax.grid(color=GRID, linewidth=0.6, axis="y")


def save(fig, name):
    fig.savefig(f"figures/{name}", facecolor=BG, dpi=110)
    plt.close(fig)


hrs = list(range(24))
em = [EH[str(h)][1] for h in hrs]
et = [EH[str(h)][2] for h in hrs]
bm = [BH[str(h)][1] for h in hrs]
bt = [BH[str(h)][2] for h in hrs]

# ---------- 1 ET hour mean ----------
fig = fig_base("比特币最赚钱的一小时：美东下午 5 点", "每个小时的平均涨跌（基点，1 基点 = 0.01%）· 横轴为美东时间，已按夏令时自动换算")
ax = fig.add_axes([0.06, 0.15, 0.9, 0.68])
style(ax)
cols = [GOLD if h == 17 else (UP if v > 0 else DN) for h, v in zip(hrs, em)]
ax.bar(hrs, em, color=cols, width=0.72)
ax.axhline(0, color=TXT, lw=1)
ax.set_xticks(hrs)
ax.set_xticklabels([f"{h}" for h in hrs])
ax.set_xlabel("美东时间（点）", color=TXT, fontsize=13)
ax.set_ylabel("平均每小时涨跌（基点）", color=TXT, fontsize=13)
ax.annotate("17:00–18:00\n平均 +6.25 基点\n上涨概率 55.1%\n其余 23 小时平均只有 +0.13 基点", xy=(17, 6.25), xytext=(11.5, 5.2), color=GOLD,
            fontsize=14, weight="bold", arrowprops=dict(arrowstyle="->", color=GOLD, lw=2))
ax.text(17, -3.3, "＝北京时间\n冬令时 06:00\n夏令时 05:00", color=GREY, fontsize=11, ha="center", va="top")
ax.set_ylim(-4.8, 7.6)
save(fig, "01_每小时平均涨跌_美东.png")

# ---------- 2 t-stat Beijing vs ET ----------
fig = fig_base("同样的数据，换个时钟，信号强了七成", "每个小时平均涨跌的 t 值 · |t| > 3 才算「大概率不是巧合」（已考虑 24 次比较）")
for k, (vals, lab, col, x0) in enumerate([(bt, "按北京时间", BLUE, 0.06), (et, "按美东时间", GOLD, 0.53)]):
    ax = fig.add_axes([x0, 0.15, 0.42, 0.66])
    style(ax)
    c = [col if abs(v) >= 2 else GREY for v in vals]
    ax.bar(hrs, vals, color=c, width=0.72)
    ax.axhline(0, color=TXT, lw=1)
    for y in (3, -3):
        ax.axhline(y, color=DN, lw=1, ls="--")
    ax.text(23.4, 3.1, "t = 3", color=DN, fontsize=11, ha="right", va="bottom")
    ax.set_xticks(range(0, 24, 3))
    ax.set_ylim(-3.5, 5.5)
    ax.set_title(lab, color="white", fontsize=17, pad=10)
    i = int(np.argmax(vals))
    ax.text(i, vals[i] + 0.15, f"{i}点\nt={vals[i]:.2f}", color=col, fontsize=13, ha="center", va="bottom", weight="bold")
fig.text(0.5, 0.86, "北京时间 5–6 点的效应会随美国夏令时来回漂移；按美东时间对齐后，全部集中到 17 点 —— 说明它跟着美国的作息走",
         color=TXT, fontsize=13.5, ha="center")
save(fig, "02_北京vs美东.png")

# ---------- 3 cumulative ----------
rows = [list(map(int, x.split(","))) for x in CUM.split(";")]
d = pd.to_datetime("2020-01-01") + pd.to_timedelta([r[0] for r in rows], unit="D")
allm = np.exp(np.array([r[1] for r in rows]) / 1000)
e17 = np.exp(np.array([r[2] for r in rows]) / 1000)
oth = np.exp(np.array([r[3] for r in rows]) / 1000)
fig = fig_base("只拿一个小时 vs 拿剩下的 23 个小时", "2020 年初投入 1 元，不同持有方式的累计倍数（对数坐标）· 未扣手续费")
ax = fig.add_axes([0.07, 0.13, 0.78, 0.71])
style(ax)
ax.grid(color=GRID, linewidth=0.6)
ax.plot(d, allm, color=GREY, lw=2, label="一直拿着（24 小时）")
ax.plot(d, e17, color=GOLD, lw=2.6, label="每天只拿美东 17–18 点这 1 小时")
ax.plot(d, oth, color=BLUE, lw=2, label="拿着其余 23 个小时")
ax.set_yscale("log")
ax.set_yticks([0.5, 1, 2, 5, 10, 20])
ax.set_yticklabels(["0.5", "1", "2", "5", "10", "20"])
ax.axhline(1, color=GREY, lw=0.8, ls=":")
ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
for arr, col in [(allm, GREY), (e17, GOLD), (oth, BLUE)]:
    ax.text(d[-1] + pd.Timedelta(days=25), arr[-1], f"{arr[-1]:.1f} 倍", color=col, fontsize=15, weight="bold", va="center")
ax.legend(loc="upper left", facecolor="#1e222d", edgecolor=GRID, labelcolor=TXT, fontsize=13)
ax.set_ylim(0.45, 25)
save(fig, "03_累计收益对比.png")

# ---------- 4 by year ----------
yrs = list(YET.keys())
v17 = [YET[y][17] for y in yrs]
oth_avg = [np.mean([v for h, v in enumerate(YET[y]) if h != 17]) for y in yrs]
rank = [sorted(YET[y], reverse=True).index(YET[y][17]) + 1 for y in yrs]
fig = fig_base("不是某一年的运气：7 年里有 6 年是正的", "美东 17 点的平均涨跌 vs 其他 23 个小时的平均（基点）· 括号内为当年 24 个小时里的排名")
ax = fig.add_axes([0.07, 0.14, 0.86, 0.68])
style(ax)
x = np.arange(len(yrs))
ax.bar(x - 0.2, v17, width=0.38, color=GOLD, label="美东 17 点")
ax.bar(x + 0.2, oth_avg, width=0.38, color=GREY, label="其他小时平均")
for k in range(len(yrs)):
    ax.text(x[k] - 0.2, v17[k] + (0.4 if v17[k] >= 0 else -0.4), f"{v17[k]:+.1f}\n(第{rank[k]})", color=GOLD, fontsize=12,
            ha="center", va="bottom" if v17[k] >= 0 else "top")
ax.axhline(0, color=TXT, lw=1)
ax.set_xticks(x)
ax.set_xticklabels([f"{y}" + ("\n（截至11/08）" if y == "2026" else "") for y in yrs], color="white", fontsize=13)
ax.legend(loc="upper right", facecolor="#1e222d", edgecolor=GRID, labelcolor=TXT, fontsize=13)
ax.set_ylim(-4, 19)
save(fig, "04_分年稳健性.png")

# ---------- 5 weekday ----------
order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
cn = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
vals = [W17[k][0] for k in order]
pos = [W17[k][2] for k in order]
fig = fig_base("一个关键线索：周六这一小时就不灵了", "美东 17–18 点，按美东星期几拆开 · 平均涨跌（基点）和上涨概率")
ax = fig.add_axes([0.07, 0.14, 0.6, 0.68])
style(ax)
ax.bar(range(7), vals, color=[DN if v < 0 else GOLD for v in vals], width=0.62)
for k, (v, p) in enumerate(zip(vals, pos)):
    ax.text(k, v + (0.3 if v >= 0 else -0.3), f"{v:+.1f}\n涨 {p:.0f}%", color=TXT, fontsize=12, ha="center",
            va="bottom" if v >= 0 else "top")
ax.axhline(0, color=TXT, lw=1)
ax.set_xticks(range(7))
ax.set_xticklabels(cn, color="white", fontsize=14)
ax.set_ylim(-3.5, 13)
note = ("周一到周五：美股 16:00 收盘，\nCME 比特币期货 17:00–18:00 每日休市结算\n\n"
        "周日：CME 期货 18:00 重新开盘前的一小时\n\n周六：传统金融市场全部休息\n→ 效应消失\n\n"
        "这些时间点的重合，提示它和传统\n金融的作息有关。但这只是推测，\n数据本身证明不了原因。")
fig.text(0.70, 0.48, note, color=TXT, fontsize=13.5, va="center", linespacing=1.6,
         bbox=dict(boxstyle="round,pad=0.8", fc="#1e222d", ec=GOLD))
save(fig, "05_按星期拆分.png")

# ---------- 6 volatility by ET hour ----------
ab = [EH[str(h)][4] for h in hrs]
vs = [EH[str(h)][5] for h in hrs]
fig = fig_base("一天里最「刺激」的时段：美股开盘", "每小时平均波动幅度（|涨跌| 的平均，基点）与成交量占比 · 美东时间")
ax = fig.add_axes([0.06, 0.15, 0.84, 0.68])
style(ax)
ax.bar(hrs, ab, color=[PURPLE if h in (9, 10, 11) else BLUE for h in hrs], width=0.72, label="平均波动")
ax.set_ylabel("平均波动（基点）", color=TXT, fontsize=13)
ax.set_xticks(hrs)
ax.set_xlabel("美东时间（点）", color=TXT, fontsize=13)
ax2 = ax.twinx()
ax2.plot(hrs, vs, color=GOLD, lw=2.4, marker="o", label="成交量占比")
ax2.tick_params(colors=GOLD, labelsize=12)
ax2.set_ylabel("成交量占比（%）", color=GOLD, fontsize=13)
for s in ax2.spines.values():
    s.set_color(GRID)
ax.set_ylim(0, 65)
ax2.set_ylim(0, 8)
ax.annotate("美股 9:30 开盘后\n10 点波动 55.7 基点\n是凌晨 0 点的 1.8 倍", xy=(10, 55.7), xytext=(13.5, 57), color=PURPLE, fontsize=14,
            weight="bold", arrowprops=dict(arrowstyle="->", color=PURPLE))
save(fig, "06_波动与成交量.png")

# ---------- 7 heatmap volatility ----------
wd_order = [1, 2, 3, 4, 5, 6, 0]
wd_cn = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
A = np.array([HA[w] for w in wd_order])
fig = fig_base("波动热力图：周末和中午最安静", "平均每小时波动（基点）· 横轴北京时间 · 纵轴北京时间的星期")
ax = fig.add_axes([0.08, 0.13, 0.8, 0.7])
cmap = LinearSegmentedColormap.from_list("v", ["#131722", "#1f3b57", "#42a5f5", "#f5c542", "#ef5350"])
im = ax.imshow(A, aspect="auto", cmap=cmap, vmin=20, vmax=72)
ax.set_xticks(range(24))
ax.set_xticklabels(range(24), color=TXT, fontsize=11)
ax.set_yticks(range(7))
ax.set_yticklabels(wd_cn, color="white", fontsize=13)
for i in range(7):
    for j in range(24):
        ax.text(j, i, f"{A[i, j]}", ha="center", va="center", fontsize=9, color="white" if A[i, j] < 55 else "#131722")
ax.set_xlabel("北京时间（点）", color=TXT, fontsize=13)
cb = fig.colorbar(im, ax=ax, fraction=0.03, pad=0.02)
cb.ax.tick_params(colors=TXT)
for s in ax.spines.values():
    s.set_visible(False)
save(fig, "07_波动热力图.png")

# ---------- 8 heatmap returns ----------
M = np.array([HM[w] for w in wd_order])
fig = fig_base("收益热力图：大部分格子只是噪音", "平均每小时涨跌（基点）· 横轴北京时间 · 每格只有约 357 个样本，单格的红绿基本不可信")
ax = fig.add_axes([0.08, 0.13, 0.8, 0.7])
cmap2 = LinearSegmentedColormap.from_list("r", [DN, "#131722", UP])
im = ax.imshow(M, aspect="auto", cmap=cmap2, norm=TwoSlopeNorm(vmin=-11, vcenter=0, vmax=11))
ax.set_xticks(range(24))
ax.set_xticklabels(range(24), color=TXT, fontsize=11)
ax.set_yticks(range(7))
ax.set_yticklabels(wd_cn, color="white", fontsize=13)
for i in range(7):
    for j in range(24):
        ax.text(j, i, f"{M[i, j]:+.0f}", ha="center", va="center", fontsize=9, color="white")
ax.set_xlabel("北京时间（点）", color=TXT, fontsize=13)
ax.add_patch(plt.Rectangle((3.5, -0.5), 3, 6, fill=False, ec=GOLD, lw=2.5, clip_on=False))
ax.text(5, -0.62, "北京周一至周六早上 4–6 点（≈ 美东前一天 17 点）", color=GOLD, fontsize=12, ha="center", va="bottom", weight="bold")
cb = fig.colorbar(im, ax=ax, fraction=0.03, pad=0.02)
cb.ax.tick_params(colors=TXT)
for s in ax.spines.values():
    s.set_visible(False)
save(fig, "08_收益热力图.png")

# ---------- 9 fees ----------
gross = 15650
n = 2504
cases = [("一直拿着\n（参照）", 23405), ("只拿这 1 小时\n不算手续费", gross), ("合约挂单\n来回 0.04%", gross - n * 4),
         ("现货\n来回 0.2%", gross - n * 20)]
mult = [np.exp(v / 10000) for _, v in cases]
fig = fig_base("能不能拿来赚钱？手续费会把它吃光", "2020 年初投入 1 元，到 2026/11/08 的倍数 · 每天进出一次，共 2,504 次")
ax = fig.add_axes([0.08, 0.14, 0.84, 0.68])
style(ax)
cols = [GREY, GOLD, BLUE, DN]
ax.bar(range(4), mult, color=cols, width=0.6)
for k, m in enumerate(mult):
    ax.text(k, m * 1.15, f"{m:.2f} 倍" if m < 1 else f"{m:.1f} 倍", color=TXT, fontsize=16, ha="center", weight="bold")
ax.set_yscale("log")
ax.set_yticks([0.01, 0.1, 1, 10])
ax.set_yticklabels(["0.01", "0.1", "1", "10"])
ax.axhline(1, color=TXT, lw=1, ls=":")
ax.set_xticks(range(4))
ax.set_xticklabels([c for c, _ in cases], color="white", fontsize=14)
ax.set_ylim(0.003, 30)
fig.text(0.5, 0.84, "每小时平均只有 0.06% 的优势，比大多数人的一次来回手续费还小。还没算滑点和资金费率。", color=GOLD, fontsize=14, ha="center")
save(fig, "09_手续费.png")
print("ok")
