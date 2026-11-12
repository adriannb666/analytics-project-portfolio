import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyBboxPatch
from data import m15, h4

plt.rcParams["font.family"] = "Noto Sans CJK SC"
plt.rcParams["axes.unicode_minus"] = False

BG = "#131722"
GRID = "#2a2e39"
TXT = "#d1d4dc"
UP = "#26a69a"
DN = "#ef5350"
GOLD = "#f5c542"
BLUE = "#42a5f5"
PURPLE = "#b388ff"
WM = "Discord 搜「交易俱乐部」 · discord.gg/ad-market-research"

for d in (m15, h4):
    d["et"] = d.t.dt.tz_convert("America/New_York")


def base(title, subtitle):
    fig, ax = plt.subplots(figsize=(16, 9), dpi=110)
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color(GRID)
    ax.tick_params(colors=TXT, labelsize=11)
    ax.grid(color=GRID, linewidth=0.6)
    fig.text(0.04, 0.945, title, color="white", fontsize=24, weight="bold")
    fig.text(0.04, 0.905, subtitle, color="#8f96a3", fontsize=13)
    fig.text(0.96, 0.03, WM, color="white", alpha=0.55, fontsize=13, ha="right", va="bottom")
    fig.subplots_adjust(left=0.07, right=0.79, top=0.87, bottom=0.11)
    return fig, ax


def candles(ax, d, a, b, w=0.62, fade_from=None):
    for x, i in enumerate(range(a, b)):
        r = d.iloc[i]
        col = UP if r.c >= r.o else DN
        alpha = 0.3 if (fade_from is not None and i >= fade_from) else 1
        ax.vlines(x, r.l, r.h, color=col, linewidth=1.2, alpha=alpha)
        lo, hi = sorted([r.o, r.c])
        ax.add_patch(Rectangle((x - w / 2, lo), w, max(hi - lo, 1), color=col, alpha=alpha))
    ax.set_xlim(-1, b - a + 1)


def xticks(ax, d, a, b, step, fmt):
    xs = list(range(0, b - a, step))
    ax.set_xticks(xs)
    ax.set_xticklabels([d.et.iloc[a + x].strftime(fmt) for x in xs])


def hline(ax, y, x0, x1, color, label, ls="--", side="right", dy=0, fs=12):
    ax.hlines(y, x0, x1, color=color, linestyle=ls, linewidth=1.6)
    ha = "left" if side == "right" else "right"
    xt = x1 + 0.4 if side == "right" else x0 - 0.4
    ax.text(xt, y + dy, label, color=color, fontsize=fs, va="center", ha=ha, weight="bold")


def note(ax, x, y, s, color=TXT, fs=13, ha="left"):
    ax.text(x, y, s, color=color, fontsize=fs, ha=ha, va="center",
            bbox=dict(boxstyle="round,pad=0.4", fc="#1e222d", ec=color, lw=1))


def save(fig, name):
    fig.savefig(f"figures/{name}", facecolor=BG, dpi=110)
    plt.close(fig)


# ---------------- Fig 1: model flow ----------------
fig = plt.figure(figsize=(16, 9), dpi=110)
fig.patch.set_facecolor(BG)
fig.text(0.5, 0.9, "一笔完整的 ICT 交易：五步流程", color="white", fontsize=30, weight="bold", ha="center")
steps = [
    ("1", "高周期定方向", "溢价区 / 折价区\n流动性在哪一侧", BLUE),
    ("2", "等扫流动性", "前低被刺破\n收盘收回", GOLD),
    ("3", "结构转变", "放量反转\n突破短期高点", PURPLE),
    ("4", "回踩 FVG 入场", "缺口内挂单\n止损放扫点下方", UP),
    ("5", "对侧流动性离场", "前高 / 高周期高点\n分批止盈", DN),
]
for k, (n, t, s, c) in enumerate(steps):
    x = 0.04 + k * 0.19
    fig.patches.append(FancyBboxPatch((x, 0.3), 0.16, 0.42, boxstyle="round,pad=0.008,rounding_size=0.02",
                                      transform=fig.transFigure, fc="#1e222d", ec=c, lw=2.5))
    fig.text(x + 0.08, 0.64, n, color=c, fontsize=40, weight="bold", ha="center", va="center")
    fig.text(x + 0.08, 0.52, t, color="white", fontsize=19, weight="bold", ha="center", va="center")
    fig.text(x + 0.08, 0.41, s, color="#b2b5be", fontsize=14, ha="center", va="center", linespacing=1.6)
    if k < 4:
        fig.text(x + 0.175, 0.51, "›", color="#5d606b", fontsize=40, ha="center", va="center")
fig.text(0.5, 0.18, "核心：先让市场把别人的止损拿走，再顺着真正的方向上车", color=TXT, fontsize=16, ha="center")
fig.text(0.96, 0.03, WM, color="white", alpha=0.55, fontsize=13, ha="right", va="bottom")
save(fig, "01_流程.png")

# ---------------- Fig 2: HTF 4H context ----------------
a, b = 150, 188
fig, ax = base("第 1 步：4H 定方向", "BTCUSDT 4小时 · 真实行情（币安）· 时间为美东")
candles(ax, h4, a, b)
xticks(ax, h4, a, b, 6, "%m/%d")
hi_i = h4.iloc[a:b].h.idxmax()
RH, RL = h4.h[hi_i], 76326
EQ = (RH + RL) / 2
n = b - a
ax.axhspan(EQ, RH, xmin=0, xmax=1, color=DN, alpha=0.06)
ax.axhspan(RL, EQ, color=UP, alpha=0.06)
hline(ax, RH, hi_i - a, n, "#8f96a3", f"区间高点 {RH:,}")
hline(ax, EQ, 0, n, "#8f96a3", f"50% 平衡位 {EQ:,.0f}", ls=":")
ax.text(9, RH - 300, "溢价区：只找空", color=DN, fontsize=15, weight="bold")
ax.text(9, EQ - 300, "折价区：只找多", color=UP, fontsize=15, weight="bold")
sl_idx = [i - a for i in range(a, b) if h4.l[i] <= 76545 and h4.l[i] >= 76300]
hline(ax, 76389, min(sl_idx) - 1, n, GOLD, "卖方流动性 SSL\n（多个相近低点 ~76,300–76,500）", dy=-250)
sw = 187 - a
ax.annotate("扫流动性\n低点 75,736", xy=(sw, 75736), xytext=(sw - 9, 75000), color=GOLD, fontsize=14,
            weight="bold", arrowprops=dict(arrowstyle="->", color=GOLD, lw=2))
ax.set_ylim(74600, RH + 600)
save(fig, "02_4H定方向.png")

# ---------------- Fig 3: sweep on 15m ----------------
a, b = 30, 68
fig, ax = base("第 2 步：扫流动性（Liquidity Sweep）", "BTCUSDT 15分钟 · 2026/11/03 美东晚间 · 真实行情")
candles(ax, m15, a, b)
xticks(ax, m15, a, b, 4, "%H:%M")
n = b - a
hline(ax, 76389, 0, n, GOLD, "4H 前低 76,389\n下方堆着多头止损", dy=0)
sw = 60 - a
ax.annotate("刺破前低 → 拿走止损\n最低 75,736", xy=(sw, 75736), xytext=(sw - 16, 75850), color=GOLD,
            fontsize=14, weight="bold", arrowprops=dict(arrowstyle="->", color=GOLD, lw=2))
ax.annotate("下一根直接收回前低上方\n= 假跌破，不是趋势延续", xy=(61 - a, 76350), xytext=(sw - 22, 76900), color=UP,
            fontsize=14, weight="bold", arrowprops=dict(arrowstyle="->", color=UP, lw=2))
ax.annotate("卖压起点 77,984", xy=(46 - a, 77984), xytext=(46 - a + 3, 78150), color="#8f96a3", fontsize=12,
            arrowprops=dict(arrowstyle="->", color="#8f96a3"))
ax.set_ylim(75500, 78300)
save(fig, "03_扫流动性.png")

# ---------------- Fig 4: MSS + FVG ----------------
a, b = 44, 78
fig, ax = base("第 3 步：结构转变 + 留下 FVG", "BTCUSDT 15分钟 · 真实行情")
candles(ax, m15, a, b)
xticks(ax, m15, a, b, 4, "%H:%M")
n = b - a
hline(ax, 76600, 62 - a, n, PURPLE, "扫点后第一个反弹高点 76,600\n23:00 放量收在上方 = 短期结构转变（CHoCH）", fs=11)
hline(ax, 77209, 56 - a, n, BLUE, "下跌途中最后一个反弹高点 77,209\n23:45 收在上方 = 确认 MSS", fs=11)
ax.add_patch(Rectangle((63 - a - 0.3, 76566), 9, 76645 - 76566, color=UP, alpha=0.35))
ax.annotate("FVG 76,566–76,645\n23:00 大阳线前后两根 K 线\n影线之间留下的缺口", xy=(63 - a, 76605), xytext=(1, 76250), color=UP, fontsize=12, weight="bold", arrowprops=dict(arrowstyle="->", color=UP, lw=1.5))
ax.add_patch(Rectangle((66 - a - 0.3, 76991), 10, 77274 - 76991, color=BLUE, alpha=0.18))
note(ax, 66 - a - 1, 77450, "第二个 FVG 76,991–77,274", BLUE, 12, ha="right")
ax.annotate("23:30 回踩到 76,600\n刚好是缺口中线（CE 76,605）", xy=(66 - a, 76600), xytext=(66 - a + 2.5, 76150),
            color=GOLD, fontsize=13, weight="bold", arrowprops=dict(arrowstyle="->", color=GOLD, lw=2))
ax.set_ylim(75600, 78300)
save(fig, "04_结构转变与FVG.png")

# ---------------- Fig 5: entry, stop, targets ----------------
a, b = 52, 112
E, S, T1, T2 = 76645, 75700, 78063, 78878
R = E - S
fig, ax = base("第 4–5 步：入场、止损、目标", "BTCUSDT 15分钟 · 真实行情 · 仅作教学复盘，不构成投资建议")
candles(ax, m15, a, b)
xticks(ax, m15, a, b, 6, "%m/%d %H:%M")
n = b - a
x0 = 66 - a
ax.add_patch(Rectangle((x0, S), n - x0, E - S, color=DN, alpha=0.12))
ax.add_patch(Rectangle((x0, E), n - x0, T2 - E, color=UP, alpha=0.08))
hline(ax, E, x0, n, TXT, f"入场 {E:,}（FVG 上沿挂单）", ls="-")
hline(ax, S, x0, n, DN, f"止损 {S:,}（扫点下方）  风险 {R:,}")
hline(ax, T1, x0, n, UP, f"目标1 {T1:,}  前高买方流动性  {(T1 - E) / R:.1f}R")
hline(ax, T2, x0, n, UP, f"目标2 {T2:,}  4H 高点  {(T2 - E) / R:.1f}R")
ax.annotate("11/04 01:30 触及目标1", xy=(74 - a, 78068), xytext=(74 - a - 14, 78500), color=UP, fontsize=12,
            arrowprops=dict(arrowstyle="->", color=UP))
ax.annotate("09:45 触及目标2\n随后最高到 81,196", xy=(107 - a, 79100), xytext=(107 - a - 22, 79500), color=UP,
            fontsize=12, arrowprops=dict(arrowstyle="->", color=UP))
ax.set_ylim(75400, 79900)
save(fig, "05_入场止损目标.png")

# ---------------- Fig 6: review on 4H ----------------
a, b = 168, 200
fig, ax = base("复盘：交易之后发生了什么", "BTCUSDT 4小时 · 截至 2026/11/05 · 真实行情")
candles(ax, h4, a, b)
xticks(ax, h4, a, b, 4, "%m/%d %H:%M")
n = b - a
ax.annotate("扫流动性 75,736\n→ 我们的入场", xy=(187 - a, 75736), xytext=(187 - a - 12, 75300), color=GOLD,
            fontsize=13, weight="bold", arrowprops=dict(arrowstyle="->", color=GOLD, lw=2))
ax.annotate("一路拉到 81,196\n两个目标都已止盈", xy=(190 - a, 81196), xytext=(190 - a - 13, 80900), color=UP,
            fontsize=13, weight="bold", arrowprops=dict(arrowstyle="->", color=UP, lw=2))
ax.annotate("11/05 一根大阴线全部吐回\n又扫掉 75,736 下方的流动性", xy=(196 - a, 75568), xytext=(196 - a - 15, 74800),
            color=DN, fontsize=13, weight="bold", arrowprops=dict(arrowstyle="->", color=DN, lw=2))
ax.set_ylim(74300, 81900)
save(fig, "06_复盘.png")
print("ok")
