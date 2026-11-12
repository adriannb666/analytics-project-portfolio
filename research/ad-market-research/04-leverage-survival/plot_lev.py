import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import numpy as np
from ldata import *

plt.rcParams["font.family"] = "Noto Sans CJK SC"
plt.rcParams["axes.unicode_minus"] = False
BG, GRID_C, TXT = "#131722", "#2a2e39", "#d1d4dc"
UP, DN, GOLD, BLUE, PURPLE, GREY = "#26a69a", "#ef5350", "#f5c542", "#42a5f5", "#b388ff", "#8f96a3"
WM = "Discord 搜「交易俱乐部」 · discord.gg/ad-market-research"
SRC = "数据：币安 BTCUSDT 5 分钟 K 线，2020/01 – 2026/11 · 15 万个随机开仓点 × 7 档杠杆 = 105 万个仓位 · 逐仓、不补保证金、维持保证金率 0.4%"
LCOL = {100: DN, 50: "#ff8a65", 20: GOLD, 10: UP, 5: BLUE, 3: PURPLE, 2: GREY}


def fig_base(title, subtitle):
    fig = plt.figure(figsize=(16, 9), dpi=110)
    fig.patch.set_facecolor(BG)
    fig.text(0.04, 0.945, title, color="white", fontsize=24, weight="bold")
    fig.text(0.04, 0.905, subtitle, color=GREY, fontsize=13)
    fig.text(0.04, 0.03, SRC, color=GREY, fontsize=10, va="bottom")
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


def dur(m):
    if m < 60:
        return f"{m:.0f} 分钟"
    if m < 1440:
        return f"{m / 60:.1f} 小时"
    return f"{m / 1440:.0f} 天" if m / 1440 >= 10 else f"{m / 1440:.1f} 天"


# ---------- 1 survival curves ----------
x = np.array(GRID) * 5  # minutes
fig = fig_base("爆仓存活曲线：开仓之后，还有多少仓位活着", "横轴：开仓后经过的时间（对数坐标）· 纵轴：还没爆仓的仓位比例")
ax = fig.add_axes([0.07, 0.17, 0.82, 0.67])
style(ax)
for lev in [2, 3, 5, 10, 20, 50, 100]:
    ax.plot(x, CURVE[lev], color=LCOL[lev], lw=3 if lev >= 20 else 2)
    ax.text(x[-1] * 1.12, CURVE[lev][-1] + {50: 2.2, 100: -1.2}.get(lev, 0), f"{lev}x", color=LCOL[lev], fontsize=14, weight="bold", va="center")
ax.set_xscale("log")
ticks = [5, 60, 240, 1440, 10080, 43200, 129600, 525600]
ax.set_xticks(ticks)
ax.set_xticklabels(["5分钟", "1小时", "4小时", "1天", "7天", "30天", "90天", "1年"])
ax.minorticks_off()
ax.axhline(50, color=TXT, lw=1, ls=":")
ax.text(6, 51.5, "一半仓位已爆", color=TXT, fontsize=12)
ax.set_ylim(0, 102)
ax.set_xlim(5, 525600 * 2.2)
ax.set_ylabel("存活率（%）", color=TXT, fontsize=13)
ax.annotate("100x：4.6 小时\n一半没了", xy=(275, 50), xytext=(40, 22), color=DN, fontsize=14, weight="bold",
            arrowprops=dict(arrowstyle="->", color=DN, lw=2))
save(fig, "01_存活曲线.png")

# ---------- 2 median lifetime ----------
levs = [100, 50, 20, 10, 5, 3]
med = [MED_MIN[l] for l in levs]
fig = fig_base("不同杠杆的「中位寿命」：一半仓位撑不过这个时间", "随机时间、随机方向开仓，逐仓不补保证金 · 对数坐标")
ax = fig.add_axes([0.1, 0.17, 0.8, 0.66])
style(ax, "x")
y = np.arange(len(levs))[::-1]
ax.barh(y, med, color=[LCOL[l] for l in levs], height=0.6)
for yy, l, m in zip(y, levs, med):
    ax.text(m * 1.2, yy, dur(m), color="white", fontsize=18, weight="bold", va="center")
ax.set_xscale("log")
ax.set_yticks(y)
ax.set_yticklabels([f"{l}x\n(反向 {DIST[l]:.1f}% 爆仓)" for l in levs], color="white", fontsize=13)
ax.set_xticks(ticks)
ax.set_xticklabels(["5分钟", "1小时", "4小时", "1天", "7天", "30天", "90天", "1年"])
ax.minorticks_off()
ax.set_xlim(30, 525600 * 6)
fig.text(0.9, 0.86, "2x：一年后仍有 57% 存活，中位寿命超过 1 年，未画出", color=GREY, fontsize=13, ha="right")
save(fig, "02_中位寿命.png")

# ---------- 3 survival table ----------
cols = ["1 小时", "1 天", "7 天", "30 天", "90 天", "1 年"]
rows_l = [100, 50, 20, 10, 5, 3, 2]
A = np.array([CP[l] for l in rows_l])
fig = fig_base("存活率速查表", "开仓后经过这么久，还没爆仓的仓位占比（%）")
ax = fig.add_axes([0.1, 0.16, 0.8, 0.68])
cmap = LinearSegmentedColormap.from_list("s", [DN, "#7a3b2e", "#2a2e39", "#1f6f66", UP])
ax.imshow(A, aspect="auto", cmap=cmap, vmin=0, vmax=100)
ax.set_xticks(range(len(cols)))
ax.set_xticklabels(cols, color="white", fontsize=15)
ax.xaxis.tick_top()
ax.set_yticks(range(len(rows_l)))
ax.set_yticklabels([f"{l}x" for l in rows_l], color="white", fontsize=16, weight="bold")
for i in range(A.shape[0]):
    for j in range(A.shape[1]):
        v = A[i, j]
        ax.text(j, i, f"{v:.0f}%" if v >= 10 else f"{v:.1f}%", ha="center", va="center", fontsize=17, color="white", weight="bold")
ax.tick_params(length=0)
for s in ax.spines.values():
    s.set_visible(False)
save(fig, "03_存活率速查表.png")

# ---------- 4 right direction but liquidated ----------
levs4 = [5, 10, 20, 50, 100]
fig = fig_base("最扎心的数字：方向看对了，还是爆仓", "在「到期时价格对自己有利」的仓位里，有多少在那之前就已经被强平")
ax = fig.add_axes([0.08, 0.17, 0.84, 0.66])
style(ax, "y")
xx = np.arange(len(levs4))
b1 = [RIGHT7[l] for l in levs4]
b2 = [RIGHT30[l] for l in levs4]
ax.bar(xx - 0.2, b1, width=0.38, color=GOLD, label="7 天后方向是对的")
ax.bar(xx + 0.2, b2, width=0.38, color=DN, label="30 天后方向是对的")
for k in range(len(levs4)):
    ax.text(xx[k] - 0.2, b1[k] + 1.5, f"{b1[k]:.0f}%" if b1[k] >= 1 else f"{b1[k]:.1f}%", color=GOLD, ha="center", fontsize=15, weight="bold")
    ax.text(xx[k] + 0.2, b2[k] + 1.5, f"{b2[k]:.0f}%" if b2[k] >= 10 else f"{b2[k]:.1f}%", color=DN, ha="center", fontsize=15, weight="bold")
ax.set_xticks(xx)
ax.set_xticklabels([f"{l}x" for l in levs4], color="white", fontsize=16, weight="bold")
ax.set_ylim(0, 105)
ax.set_ylabel("看对方向却先爆仓的比例（%）", color=TXT, fontsize=13)
ax.legend(loc="upper left", facecolor="#1e222d", edgecolor=GRID_C, labelcolor=TXT, fontsize=14)
save(fig, "04_看对方向仍爆仓.png")

# ---------- 5 long vs short ----------
levs5 = [2, 3, 5, 10, 20, 50, 100]
fig = fig_base("做多 vs 做空：一年后的存活率", "2020 年以来比特币涨了约 10 倍，做空的仓位死得更快")
ax = fig.add_axes([0.08, 0.17, 0.84, 0.66])
style(ax, "y")
xx = np.arange(len(levs5))
lo = [LONG365[l] for l in levs5]
sh = [SHORT365[l] for l in levs5]
ax.bar(xx - 0.2, lo, width=0.38, color=UP, label="做多")
ax.bar(xx + 0.2, sh, width=0.38, color=DN, label="做空")
for k in range(len(levs5)):
    ax.text(xx[k] - 0.2, lo[k] + 1.2, f"{lo[k]:.0f}%" if lo[k] >= 10 else f"{lo[k]:.1f}%", color=UP, ha="center", fontsize=14, weight="bold")
    ax.text(xx[k] + 0.2, sh[k] + 1.2, f"{sh[k]:.0f}%" if sh[k] >= 10 else f"{sh[k]:.1f}%", color=DN, ha="center", fontsize=14, weight="bold")
ax.set_xticks(xx)
ax.set_xticklabels([f"{l}x" for l in levs5], color="white", fontsize=16, weight="bold")
ax.set_ylim(0, 90)
ax.set_ylabel("365 天存活率（%）", color=TXT, fontsize=13)
ax.legend(loc="upper right", facecolor="#1e222d", edgecolor=GRID_C, labelcolor=TXT, fontsize=14)
save(fig, "05_多空对比.png")

# ---------- 6 by year ----------
yrs = list(YEAR_MED_100.keys())
v = [YEAR_MED_100[y] for y in yrs]
fig = fig_base("100 倍杠杆的中位寿命，按开仓年份", "波动越大的年份，死得越快：2021 年牛市里，一半仓位活不过 1 小时 40 分钟")
ax = fig.add_axes([0.08, 0.17, 0.84, 0.66])
style(ax, "y")
ax.bar(range(len(yrs)), [m / 60 for m in v], color=[DN if m == min(v) else GOLD for m in v], width=0.6)
for k, m in enumerate(v):
    ax.text(k, m / 60 + 0.15, dur(m), color="white", fontsize=16, weight="bold", ha="center")
ax.set_xticks(range(len(yrs)))
ax.set_xticklabels(yrs, color="white", fontsize=15)
ax.set_ylabel("中位寿命（小时）", color=TXT, fontsize=13)
ax.set_ylim(0, 10)
save(fig, "06_按年份.png")
print("ok")
