import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "01-ict-complete-trade"))
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.patches import Rectangle, FancyBboxPatch
import numpy as np
import pandas as pd
from btdata import *
from data import m15

plt.rcParams["font.family"] = "Noto Sans CJK SC"
plt.rcParams["axes.unicode_minus"] = False
BG, GRID, TXT = "#131722", "#2a2e39", "#d1d4dc"
UP, DN, GOLD, BLUE, PURPLE, GREY = "#26a69a", "#ef5350", "#f5c542", "#42a5f5", "#b388ff", "#8f96a3"
WM = "Discord 搜「交易俱乐部」 · discord.gg/ad-market-research"
T0 = pd.Timestamp("2024-11-09", tz="UTC")


def fig_base(title, subtitle):
    fig = plt.figure(figsize=(16, 9), dpi=110)
    fig.patch.set_facecolor(BG)
    fig.text(0.04, 0.945, title, color="white", fontsize=24, weight="bold")
    fig.text(0.04, 0.905, subtitle, color=GREY, fontsize=13)
    fig.text(0.96, 0.03, WM, color="white", alpha=0.55, fontsize=13, ha="right", va="bottom")
    return fig


def style(ax):
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color(GRID)
    ax.tick_params(colors=TXT, labelsize=12)
    ax.grid(color=GRID, linewidth=0.6)


def save(fig, name):
    fig.savefig(f"figures/{name}", facecolor=BG, dpi=110)
    plt.close(fig)


def parse_eq(s):
    a = np.array([list(map(float, x.split(","))) for x in s.split(";")])
    d = T0 + pd.to_timedelta(a[:, 0], unit="D")
    return d, a[:, 1]


# ---------- 1 rules ----------
fig = fig_base("回测规则：把「扫流动性 + FVG」写成机器能执行的条件", "多空对称，下面以做多为例 · 所有条件提前定死，不看结果调参")
steps = [
    ("1", "扫流动性", "15m 摆动低点（左右各 5 根）\n被刺破，1 小时内收盘收回\n刺破深度不超过 1%", GOLD),
    ("2", "位置过滤", "扫点位于过去 5 天\n高低点区间的下半部分\n（折价区才做多）", BLUE),
    ("3", "结构转变", "扫点后 6 小时内\n收盘站上第一个反弹高点\n（激进版 CHoCH）", PURPLE),
    ("4", "FVG 入场", "取突破过程中最近的 FVG\n缺口 ≥ 0.03%，上沿挂限价单\n6 小时内不回踩就撤单", UP),
    ("5", "离场", "止损：扫点下方 0.05%\n止盈：2R\n最长持仓 24 小时", DN),
]
for k, (n, t, s, c) in enumerate(steps):
    x = 0.04 + k * 0.19
    fig.patches.append(FancyBboxPatch((x, 0.24), 0.165, 0.52, boxstyle="round,pad=0.008,rounding_size=0.02",
                                      transform=fig.transFigure, fc="#1e222d", ec=c, lw=2.5))
    fig.text(x + 0.0825, 0.68, n, color=c, fontsize=38, weight="bold", ha="center", va="center")
    fig.text(x + 0.0825, 0.58, t, color="white", fontsize=20, weight="bold", ha="center", va="center")
    fig.text(x + 0.0825, 0.42, s, color="#b2b5be", fontsize=13.5, ha="center", va="center", linespacing=1.8)
fig.text(0.5, 0.15, "数据：币安 BTCUSDT 15 分钟，2024/11/09 – 2026/11/08，共 70,080 根 K 线  ·  手续费：挂单 0.02%，止损/超时市价 0.05%",
         color=TXT, fontsize=14, ha="center")
save(fig, "01_规则.png")

# ---------- 2 funnel ----------
fig = fig_base("两年里，信号是怎么一层层被筛掉的", "BTCUSDT 15 分钟 · 多空合计 · 激进版 + 折价/溢价过滤")
ax = fig.add_axes([0.08, 0.14, 0.84, 0.7])
style(ax)
labels = ["识别到扫流动性", "位置合格 + 出现结构转变", "突破中留下合格 FVG", "价格回踩、限价单成交"]
vals = [4163, 826, 590, 473]
cols = [GOLD, PURPLE, BLUE, UP]
ax.barh(range(4)[::-1], vals, color=cols, height=0.62)
for i, (l, v) in enumerate(zip(labels, vals)):
    y = 3 - i
    ax.text(-60, y, l, color="white", fontsize=17, ha="right", va="center", weight="bold")
    ax.text(v + 60, y, f"{v:,}", color=TXT, fontsize=17, va="center", weight="bold")
    if i:
        ax.text(v + 520, y, f"（上一步的 {v / vals[i - 1]:.0%}）", color=GREY, fontsize=13, va="center")
ax.set_xlim(-1400, 5200)
ax.set_yticks([])
ax.set_xticks([])
ax.grid(False)
for s in ax.spines.values():
    s.set_visible(False)
ax.text(800, -0.75, "4,163 次扫流动性里，只有 826 次同时满足位置和结构条件 —— 扫低不等于见底", color=GOLD, fontsize=15)
save(fig, "02_信号漏斗.png")

# ---------- 3 equity baseline ----------
da, ea = parse_eq(EQA)
df, ef = parse_eq(EQF)
fig = fig_base("结果：按规则全部照做，两年亏掉 57R", "累计收益（单位 R，1R = 每笔固定风险）· 已扣手续费 · 473 笔交易")
ax = fig.add_axes([0.07, 0.12, 0.86, 0.72])
style(ax)
ax.plot(da, ea, color=DN, lw=2.2)
ax.fill_between(da, ea, 0, color=DN, alpha=0.08)
ax.axhline(0, color=GREY, lw=1)
ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y/%m"))
ax.text(da[-1], ea[-1] + 5, f"{ea[-1]:.1f}R", color=DN, fontsize=16, weight="bold", ha="right")
i = np.argmin(ea)
pk = np.argmax(ea[:i + 1])
ax.annotate(f"最大回撤 {ea[pk] - ea[i]:.1f}R", xy=(da[i], ea[i]), xytext=(da[i] - pd.Timedelta(days=170), ea[i] - 6),
            color=GOLD, fontsize=14, arrowprops=dict(arrowstyle="->", color=GOLD))
ax.text(da[5], -66, "胜率 35.3%   平均每笔 −0.12R   盈亏因子 0.82   最长连亏 10 笔", color=TXT, fontsize=14,
        bbox=dict(boxstyle="round,pad=0.5", fc="#1e222d", ec=GRID))
ax.set_ylim(-82, 8)
save(fig, "03_资金曲线_基础版.png")

# ---------- 4 variants ----------
var = [
    ("基础版（激进 + 过滤 + 2R）", 473, -0.019, -0.121),
    ("保守版 MSS", 400, -0.039, -0.132),
    ("不做溢价/折价过滤", 802, -0.007, -0.111),
    ("入场改在 FVG 中线（CE）", 428, -0.064, -0.178),
    ("收回时间放宽到 2 小时", 511, -0.015, -0.117),
    ("只做 ≥0.1% 的大 FVG", 310, 0.012, -0.074),
    ("止盈 1R", 448, 0.032, -0.056),
    ("止盈 1.5R", 469, 0.007, -0.089),
    ("止盈 3R", 477, -0.095, -0.203),
]
fig = fig_base("换参数也救不回来：每一种变体扣费后都是负的", "平均每笔收益（R）· 灰色 = 扣费前，彩色 = 扣费后")
ax = fig.add_axes([0.30, 0.1, 0.62, 0.75])
style(ax)
y = np.arange(len(var))[::-1]
g = [v[2] for v in var]
nt = [v[3] for v in var]
ax.barh(y + 0.18, g, height=0.34, color=GREY, alpha=0.7, label="扣费前")
ax.barh(y - 0.18, nt, height=0.34, color=[UP if v > 0 else DN for v in nt], label="扣费后")
ax.axvline(0, color=TXT, lw=1)
ax.set_yticks(y)
ax.set_yticklabels([f"{v[0]}  ({v[1]} 笔)" for v in var], color="white", fontsize=13)
for yy, a, b in zip(y, g, nt):
    ax.text(b - 0.006 if b < 0 else b + 0.006, yy - 0.18, f"{b:+.3f}", color=TXT, fontsize=11, va="center",
            ha="right" if b < 0 else "left")
    ax.text(a + 0.006 if a >= 0 else a - 0.006, yy + 0.18, f"{a:+.3f}", color=GREY, fontsize=11, va="center",
            ha="left" if a >= 0 else "right")
ax.set_xlim(-0.26, 0.09)
ax.legend(loc="upper left", facecolor="#1e222d", edgecolor=GRID, labelcolor=TXT, fontsize=12)
fig.text(0.30, 0.86, "扣费前基本在 0 附近：这套规则本身没有明显优势，手续费再拿走约 0.1R", color=GOLD, fontsize=14)
save(fig, "04_参数变体.png")

# ---------- 5 year-1 breakdown ----------
fig = fig_base("拆开第一年：亏损集中在三个地方", "样本内：2024/11/09 – 2025/11/08 · 平均每笔收益（R，扣费后）· 括号内为笔数")
groups = [
    ("交易时段（美东）", [("亚洲盘\n19–02点", -0.346, 51), ("伦敦盘\n02–08点", -0.328, 59), ("纽约盘\n08–16点", -0.187, 95), ("收盘后\n16–19点", 0.23, 29)]),
    ("星期", [("工作日", -0.147, 166), ("周末", -0.35, 68)]),
    ("止损距离", [("≥ 0.5%", -0.073, 164), ("< 0.5%", -0.517, 70)]),
]
xs = [0.06, 0.52, 0.76]
ws = [0.42, 0.2, 0.2]
for (title, items), x0, w in zip(groups, xs, ws):
    ax = fig.add_axes([x0, 0.14, w, 0.66])
    style(ax)
    vals = [v for _, v, _ in items]
    cols = [UP if v > 0 else DN for v in vals]
    ax.bar(range(len(items)), vals, color=cols, width=0.62)
    ax.axhline(0, color=TXT, lw=1)
    ax.set_xticks(range(len(items)))
    ax.set_xticklabels([l for l, _, _ in items], color="white", fontsize=12)
    for k, (_, v, n) in enumerate(items):
        ax.text(k, v + (0.02 if v > 0 else -0.02), f"{v:+.2f}\n({n})", color=TXT, fontsize=12, ha="center",
                va="bottom" if v > 0 else "top")
    ax.set_ylim(-0.7, 0.4)
    ax.set_title(title, color="white", fontsize=16, pad=10)
save(fig, "05_第一年拆解.png")

# ---------- 6 out-of-sample ----------
fig = fig_base("用第一年找到的过滤条件，去第二年检验", "过滤：只做工作日 + 避开亚洲盘 + 止损距离 ≥ 0.5% · 平均每笔收益（R，扣费后）")
ax = fig.add_axes([0.1, 0.14, 0.55, 0.68])
style(ax)
cats = ["第一年（样本内）", "第二年（样本外）"]
base = [-0.206, -0.038]
filt = [0.034, 0.153]
nb = [234, 239]
nf = [110, 109]
x = np.arange(2)
ax.bar(x - 0.2, base, width=0.38, color=DN, label="不过滤")
ax.bar(x + 0.2, filt, width=0.38, color=UP, label="加过滤")
for k in range(2):
    ax.text(k - 0.2, base[k] - 0.015, f"{base[k]:+.3f}\n{nb[k]} 笔", color=TXT, ha="center", va="top", fontsize=13)
    ax.text(k + 0.2, filt[k] + 0.012, f"{filt[k]:+.3f}\n{nf[k]} 笔", color=TXT, ha="center", va="bottom", fontsize=13)
ax.axhline(0, color=TXT, lw=1)
ax.set_xticks(x)
ax.set_xticklabels(cats, color="white", fontsize=15)
ax.set_ylim(-0.3, 0.25)
ax.legend(loc="upper left", facecolor="#1e222d", edgecolor=GRID, labelcolor=TXT, fontsize=13)
note = ("样本外 109 笔：\n胜率 45%\n平均 +0.15R / 笔\n盈亏因子 1.29\n最大回撤 6.3R\n\n"
        "但标准误约 ±0.13R，\n离「统计上显著」还差很远。\n这只能算一个值得继续\n跟踪的假设，不是结论。")
fig.text(0.70, 0.5, note, color=TXT, fontsize=15, va="center", linespacing=1.6,
         bbox=dict(boxstyle="round,pad=0.8", fc="#1e222d", ec=GOLD))
save(fig, "06_样本外检验.png")

# ---------- 7 equity compare ----------
fig = fig_base("同一套规则，加上三条过滤之后", "累计收益（R，扣费后）· 竖线左边是找规律用的第一年，右边是从没看过的第二年")
ax = fig.add_axes([0.07, 0.12, 0.86, 0.72])
style(ax)
ax.plot(da, ea, color=DN, lw=2, label=f"不过滤（473 笔，{ea[-1]:.1f}R）")
ax.plot(df, ef, color=UP, lw=2.4, label=f"加过滤（219 笔，{ef[-1]:+.1f}R）")
split = pd.Timestamp("2025-11-09", tz="UTC")
ax.axvline(split, color=GOLD, ls="--", lw=1.5)
ax.text(split + pd.Timedelta(days=5), 26, "样本外 →", color=GOLD, fontsize=14)
ax.text(split - pd.Timedelta(days=5), 26, "← 样本内", color=GOLD, fontsize=14, ha="right")
ax.axhline(0, color=GREY, lw=1)
ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y/%m"))
ax.legend(loc="lower left", facecolor="#1e222d", edgecolor=GRID, labelcolor=TXT, fontsize=14)
ax.set_ylim(-82, 32)
save(fig, "07_过滤前后对比.png")

# ---------- 8 monthly (filtered) ----------
ks = list(MF.keys())
fig = fig_base("加过滤之后，每个月的表现", "月度收益（R，扣费后）· 25 个月里 14 个月为正（首尾两个月不完整）")
ax = fig.add_axes([0.06, 0.16, 0.88, 0.68])
style(ax)
v = [MF[k] for k in ks]
ax.bar(range(len(ks)), v, color=[UP if x > 0 else DN for x in v], width=0.7)
ax.axhline(0, color=TXT, lw=1)
ax.set_xticks(range(len(ks)))
ax.set_xticklabels([k[2:].replace("-", "/") for k in ks], rotation=45, color=TXT, fontsize=11)
for k, x in enumerate(v):
    ax.text(k, x + (0.2 if x > 0 else -0.2), f"{x:+.1f}", color=TXT, fontsize=10, ha="center", va="bottom" if x > 0 else "top")
ax.set_ylim(-6.5, 11)
save(fig, "08_月度收益.png")


# ---------- candles helper ----------
def candles(ax, o, h, l, c, w=0.62):
    for x in range(len(o)):
        col = UP if c[x] >= o[x] else DN
        ax.vlines(x, l[x], h[x], color=col, lw=1.2)
        lo, hi = sorted([o[x], c[x]])
        ax.add_patch(Rectangle((x - w / 2, lo), w, max(hi - lo, 1), color=col))


def hl(ax, y, x0, x1, col, lab, ls="--"):
    ax.hlines(y, x0, x1, color=col, ls=ls, lw=1.6)
    ax.text(x1 + 0.5, y, lab, color=col, fontsize=12, va="center", weight="bold")


# ---------- 9 win example (11/04) ----------
a, b = 44, 112
d = m15.iloc[a:b]
fig = fig_base("回测里的一笔赢单：就是上一篇的那笔交易", "BTCUSDT 15 分钟 · 2026/11/03–04（美东）· 规则自动识别，结果 +1.97R（扣费后）")
ax = fig.add_axes([0.06, 0.11, 0.72, 0.74])
style(ax)
candles(ax, d.o.values, d.h.values, d.l.values, d.c.values)
E, S, Tg = 76645, 75698, 78538
x0 = 66 - a
ax.add_patch(Rectangle((x0, S), b - a - x0, E - S, color=DN, alpha=0.12))
ax.add_patch(Rectangle((x0, E), b - a - x0, Tg - E, color=UP, alpha=0.08))
hl(ax, E, x0, b - a, TXT, "入场 76,645", ls="-")
hl(ax, S, x0, b - a, DN, "止损 75,698")
hl(ax, Tg, x0, b - a, UP, "止盈 2R 78,538")
ax.annotate("扫流动性", xy=(60 - a, 75736), xytext=(60 - a - 12, 75650), color=GOLD, fontsize=13, weight="bold",
            arrowprops=dict(arrowstyle="->", color=GOLD))
ax.add_patch(Rectangle((63 - a - 0.3, 76566), 6, 79, color=UP, alpha=0.45))
ax.set_xlim(-1, b - a + 1)
xt = list(range(0, b - a, 8))
ax.set_xticks(xt)
ax.set_xticklabels([d.t.dt.tz_convert("America/New_York").iloc[x].strftime("%m/%d %H:%M") for x in xt])
ax.set_ylim(75400, 79000)
save(fig, "09_示例_赢单.png")

# ---------- 10 loss example (11/06) ----------
rows = [list(map(int, x.split(","))) for x in LOSS.split(";")]
o, h, l, c = map(np.array, zip(*rows))
ts = pd.to_datetime([LOSS_T0 + i * 900000 for i in range(len(rows))], unit="ms", utc=True).tz_convert("America/New_York")
fig = fig_base("回测里的一笔输单：形态一样完整，照样止损", "BTCUSDT 15 分钟 · 2026/11/05–06（美东）· 结果 −1.06R（扣费后）")
ax = fig.add_axes([0.06, 0.11, 0.72, 0.74])
style(ax)
candles(ax, o, h, l, c)
I = LOSS_IDX
E, S, Tg = LOSS_TRADE["entry"], LOSS_TRADE["stop"], LOSS_TRADE["target"]
n = len(rows)
ax.add_patch(Rectangle((I["fi"], S), n - I["fi"], E - S, color=DN, alpha=0.12))
hl(ax, E, I["fi"], n, TXT, f"入场 {E:,}", ls="-")
hl(ax, S, I["fi"], n, DN, f"止损 {S:,}")
hl(ax, Tg, I["fi"], n, UP, f"止盈 2R {Tg:,}")
hl(ax, 75361, 22, I["lb"] + 3, GOLD, "")
ax.annotate("扫掉前低 75,361\n最低 75,304", xy=(I["lb"], 75304), xytext=(I["lb"] - 16, 75000), color=GOLD, fontsize=13,
            weight="bold", arrowprops=dict(arrowstyle="->", color=GOLD))
ax.annotate("放量阳线突破\n留下 FVG", xy=(I["m"], 76125), xytext=(I["m"] - 14, 76420), color=PURPLE, fontsize=13,
            weight="bold", arrowprops=dict(arrowstyle="->", color=PURPLE))
ax.annotate("回踩成交", xy=(I["fi"], 76100), xytext=(I["fi"] + 4, 76420), color=TXT, fontsize=13,
            arrowprops=dict(arrowstyle="->", color=TXT))
ax.annotate("横盘 5 小时后向下\n再扫一次，打掉止损", xy=(I["ei"], 74888), xytext=(I["ei"] - 22, 74780), color=DN,
            fontsize=13, weight="bold", arrowprops=dict(arrowstyle="->", color=DN))
ax.set_xlim(-1, n + 1)
xt = list(range(0, n, 8))
ax.set_xticks(xt)
ax.set_xticklabels([ts[x].strftime("%m/%d %H:%M") for x in xt])
ax.set_ylim(74600, 77950)
save(fig, "10_示例_输单.png")
print("ok")
