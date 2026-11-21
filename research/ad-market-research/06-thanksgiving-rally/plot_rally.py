"""Figures for the Thanksgiving / Santa Claus rally study (Chinese, Zhihu)."""
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.family"] = "Noto Sans CJK SC"
plt.rcParams["axes.unicode_minus"] = False
BG, GRID_C, TXT = "#131722", "#2a2e39", "#d1d4dc"
UP, DN, GOLD, BLUE, GREY = "#26a69a", "#ef5350", "#f5c542", "#42a5f5", "#8f96a3"
WM = "Discord 搜「交易俱乐部」 · discord.gg/ad-market-research"
SRC = "数据：Yahoo Finance 标普 500 指数日收盘价（不含股息）· 1950–2025 共 76 年"

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
    fig.savefig(f"figures/{name}", facecolor=BG, dpi=110)
    plt.close(fig)


# 1 ---- every year, Thanksgiving -> year end
fig = fig_base(f"感恩节到年底：76 年里 {int((TG > 0).sum())} 年上涨",
               "每年从感恩节前一个交易日（周三）收盘，持有到 12 月最后一个交易日收盘，标普 500 的涨跌幅")
ax = fig.add_axes([0.06, 0.14, 0.9, 0.7])
style(ax)
ax.bar(Y, TG, color=[UP if v > 0 else DN for v in TG], width=0.75)
ax.axhline(TG.mean(), color=GOLD, lw=2, ls="--")
ax.axhline(M["tg_sim_mean"], color=GREY, lw=2, ls=":")
box = dict(facecolor=BG, edgecolor=GRID_C, boxstyle="round,pad=0.5")
ax.text(1975, 14.2, f"- - -  感恩节→年底 平均 {TG.mean():+.2f}%", color=GOLD, fontsize=14, weight="bold", bbox=box)
ax.text(1975, 12.6, f"·······  一年里随便挑同样长的一段 平均 {M['tg_sim_mean']:+.2f}%", color=TXT, fontsize=13, weight="bold", bbox=box)
for yy, v in [(1971, 13.019), (1991, 10.766), (2002, -6.289), (2018, -5.399), (2022, -4.662)]:
    ax.text(yy, v + (0.3 if v > 0 else -0.3), f"{yy}\n{v:+.1f}%", color=TXT, fontsize=11, ha="center", va="bottom" if v > 0 else "top")
ax.set_ylabel("涨跌幅 (%)", color=TXT, fontsize=13)
ax.set_xlim(1948.5, 2026.5)
ax.set_ylim(-8.5, 15.5)
save(fig, "01_每年感恩节到年底.png")


# 2 ---- random control, two panels
def hist_panel(ax, h, real, simmean, p, title, color):
    style(ax)
    xs = np.array([a for a, _ in h]); cs = np.array([b for _, b in h])
    ax.bar(xs + 0.025, cs / cs.sum() * 100, width=0.048, color=GREY, alpha=0.75)
    ax.axvline(real, color=color, lw=3)
    top = (cs / cs.sum() * 100).max()
    ax.text(real - 0.03, top * 1.2, f"真实 {real:+.2f}%", color=color, fontsize=15, weight="bold", ha="right", va="bottom")
    ax.text(simmean, top * 1.03, f"随机平均 {simmean:+.2f}%", color=TXT, fontsize=13, ha="center", va="bottom")
    ax.set_title(title, color="white", fontsize=16, weight="bold", pad=12, loc="left")
    ax.set_ylim(0, top * 1.4)
    ax.set_xlabel("76 年的平均涨幅 (%)", color=TXT, fontsize=12)
    ax.text(0.02, 0.95, f"随机结果 ≥ 真实值的概率\np = {p}", transform=ax.transAxes, color=TXT, fontsize=13, ha="left", va="top")


fig = fig_base("和随机日子比：圣诞行情是真的，感恩节行情勉强及格",
               "灰色：模拟 10,000 次，每次在每一年里随机挑一个日子开始、持有同样多的交易日，算 76 年的平均涨幅")
ax1 = fig.add_axes([0.06, 0.15, 0.41, 0.66])
ax2 = fig.add_axes([0.55, 0.15, 0.41, 0.66])
hist_panel(ax1, d["tgHist"], M["tg_real_mean"], M["tg_sim_mean"], "0.04", "感恩节 → 年底（约 24 个交易日）", GOLD)
hist_panel(ax2, d["saHist"], M["santa_real_mean"], M["santa_sim_mean"], "0.0003", "圣诞行情：最后 5 天 + 新年头 2 天", UP)
ax2.set_xlim(-0.9, 1.45)
save(fig, "02_随机对照.png")


# 3 ---- day by day around year end
off = d["off"]
k = np.array([o[0] for o in off]); m = np.array([o[1] for o in off]); up = np.array([o[2] for o in off])
fig = fig_base("涨幅集中在哪几天：年底最后 5 天 + 新年头 2 天",
               "12 月最后一个交易日记为 0；每根柱子是 76 年里那一天的平均日涨幅")
ax = fig.add_axes([0.06, 0.14, 0.9, 0.7])
style(ax)
santa = (k >= -4) & (k <= 2)
ax.bar(k, m, color=[UP if s else "#4a5060" for s in santa], width=0.7)
ax.axhline(M["all_day_mean_pct"], color=GOLD, ls="--", lw=2)
ax.text(-15.3, M["all_day_mean_pct"] + 0.012, f"普通交易日平均 {M['all_day_mean_pct']:+.3f}%", color=GOLD, fontsize=13, weight="bold")
for kk, mm, uu in zip(k, m, up):
    if -4 <= kk <= 2:
        ax.text(kk, mm + 0.01, f"{mm:+.2f}%\n涨 {uu*100:.0f}%", color="white", fontsize=10.5, ha="center", va="bottom")
ax.axvline(0.5, color=GREY, lw=1, ls=":")
ax.text(0.6, -0.17, "新年 →", color=GREY, fontsize=13)
ax.text(-1, 0.42, "圣诞行情 7 天：平均每天 +0.18%，是普通日子的 5 倍", color=UP, fontsize=15, weight="bold", ha="center")
ax.set_xticks(k)
ax.set_xticklabels([("最后\n一天" if x == 0 else ("新年\n第%d天" % x if x > 0 else str(x))) for x in k], fontsize=11, rotation=0)
ax.set_ylim(-0.2, 0.48)
ax.set_ylabel("平均日涨幅 (%)", color=TXT, fontsize=13)
save(fig, "03_逐日拆解.png")


# 4 ---- Thanksgiving week day by day
to = d["toff"]
labels = {-5: "上周三", -4: "上周四", -3: "上周五", -2: "周一", -1: "周二", 0: "感恩节前\n周三", 1: "黑五", 2: "感恩节后\n周一", 3: "周二"}
kk = [o[0] for o in to]; mm = np.array([o[1] for o in to]); uu = [o[2] for o in to]
fig = fig_base("感恩节那一周：周三、黑五大涨，下周一还回去一半",
               "感恩节前一个交易日（周三）记为 0；每根柱子是 76 年里那一天的平均日涨幅和上涨年份占比")
ax = fig.add_axes([0.06, 0.17, 0.9, 0.67])
style(ax)
cols = [UP if x in (0, 1) else (DN if x == 2 else "#4a5060") for x in kk]
ax.bar(range(len(kk)), mm, color=cols, width=0.65)
ax.axhline(M["all_day_mean_pct"], color=GOLD, ls="--", lw=2)
ax.text(3, M["all_day_mean_pct"] + 0.03, f"普通交易日平均 {M['all_day_mean_pct']:+.3f}%", color=GOLD, fontsize=13, weight="bold", ha="center")
for i, (a, b) in enumerate(zip(mm, uu)):
    ax.text(i, a + (0.012 if a >= 0 else -0.012), f"{a:+.2f}%\n上涨 {b*100:.0f}%", color="white", fontsize=12, ha="center", va="bottom" if a >= 0 else "top")
ax.set_xticks(range(len(kk)))
ax.set_xticklabels([labels[x] for x in kk], fontsize=12, color=TXT)
ax.set_ylim(-0.42, 0.46)
ax.set_ylabel("平均日涨幅 (%)", color=TXT, fontsize=13)
save(fig, "04_感恩节那一周.png")


# 5 ---- fading by decade
decs = list(range(1950, 2030, 10))
sm = [SA[(Y >= a) & (Y < a + 10)].mean() for a in decs]
fig = fig_base("但它在变弱：2020 年代的圣诞行情，还不如普通的一周",
               "绿/红柱：每个年代圣诞行情 7 天的平均涨幅 · 灰柱：同一年代里随便挑 7 个交易日的平均涨幅")
ax = fig.add_axes([0.06, 0.14, 0.56, 0.7])
style(ax)
x = np.arange(len(decs))
ax.bar(x - 0.2, sm, width=0.38, color=[UP if a > DEC_BASE[b] else DN for a, b in zip(sm, decs)], label="圣诞行情 7 天")
ax.bar(x + 0.2, [DEC_BASE[b] for b in decs], width=0.38, color=GREY, alpha=0.8, label="普通 7 个交易日")
for i, (a, b) in enumerate(zip(sm, decs)):
    ax.text(i - 0.2, a + 0.05, f"{a:+.2f}", color="white", fontsize=11.5, ha="center")
ax.set_xticks(x)
ax.set_xticklabels([f"{b}s" if b < 2020 else "2020–25" for b in decs], fontsize=12, color=TXT)
ax.set_ylabel("平均涨幅 (%)", color=TXT, fontsize=13)
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
ax2.set_title("最近 10 次：连续 3 次失灵", color="white", fontsize=15, weight="bold", loc="left", pad=10)
save(fig, "05_按年代.png")


# 6 ---- "if Santa fails, bears come"?
pairs = [(s, n) for s, n in zip(SA, NY) if n is not None]
fail = [n for s, n in pairs if s <= 0]; ok = [n for s, n in pairs if s > 0]
fig = fig_base("「圣诞老人不来，熊市就会来」？数据不支持",
               "华尔街老话：圣诞行情如果没出现，第二年要小心。下面是每次圣诞行情之后，下一整年标普的涨跌幅")
ax = fig.add_axes([0.08, 0.14, 0.6, 0.7])
style(ax)
rng = np.random.default_rng(1)
for i, (vals, c, name) in enumerate([(ok, UP, "圣诞行情出现了"), (fail, DN, "圣诞行情没出现")]):
    xs = i + rng.uniform(-0.18, 0.18, len(vals))
    if i == 1:
        failx = xs
    ax.scatter(xs, vals, s=70, color=c, alpha=0.85, edgecolor="white", linewidth=0.5)
    mv = np.mean(vals)
    ax.hlines(mv, i - 0.3, i + 0.3, color="white", lw=3)
    ax.text(i + 0.33, mv, f"平均 {mv:+.1f}%\n上涨 {sum(v > 0 for v in vals)}/{len(vals)} 年", color="white", fontsize=13, va="center", weight="bold")
ax.set_xticks([0, 1])
ax.set_xticklabels(["圣诞行情出现了\n（58 次）", "圣诞行情没出现\n（17 次）"], fontsize=14, color=TXT)
ax.axhline(0, color=GREY, lw=1)
ax.set_ylabel("下一整年涨跌幅 (%)", color=TXT, fontsize=13)
ax.set_xlim(-0.5, 1.9)
for yy, s, n in zip(Y, SA, NY):
    if n is not None and s <= 0 and (n < -30 or yy in (2023, 2024)):
        ax.annotate(f"{yy + 1}年 {n:+.1f}%", (failx[fail.index(n)], n), xytext=(1.3, n - (4 if n > 0 else -4)), color=TXT, fontsize=11.5,
                    arrowprops=dict(arrowstyle="-", color=GREY))
txt = ("没出现圣诞行情的 17 次里，\n第二年照样有 12 次上涨，\n平均 +6.7%。\n\n真正大跌的只有 3 次：\n1969 年 -11.4%、2000 年 -10.1%、\n2008 年 -38.5%。\n\n2023 年底、2024 年底\n圣诞行情都没来，\n第二年分别 +23.3% 和 +16.4%。")
fig.text(0.72, 0.8, txt, color=TXT, fontsize=14, va="top", linespacing=1.5)
save(fig, "06_圣诞老人不来.png")


# 7 ---- only holding in Santa windows
fig = fig_base("真实但很小：76 年只拿这 7 天，赚 2.5 倍；一直拿着，411 倍",
               "左：每年只在圣诞行情 7 天持有、其余时间空仓，从 1950 年起 1 元的增长 · 右：同期一直持有")
ax = fig.add_axes([0.08, 0.14, 0.55, 0.64])
style(ax)
g = np.cumprod(1 + SA / 100)
ax.plot(Y, g, color=UP, lw=3)
ax.set_ylabel("1 元变成…（元）", color=TXT, fontsize=13)
ax.text(Y[-1], g[-1] + 0.05, f"{g[-1]:.2f} 元", color=UP, fontsize=15, weight="bold", ha="right", va="bottom")
ax.set_title("只在圣诞行情 7 天持有", color="white", fontsize=15, weight="bold", loc="left")
ax2 = fig.add_axes([0.7, 0.14, 0.26, 0.64])
style(ax2)
ax2.bar([0, 1], [2.52, 410.9], color=[UP, GOLD], width=0.6)
ax2.set_yscale("log")
ax2.set_xticks([0, 1])
ax2.set_xticklabels(["只拿 7 天", "一直持有"], fontsize=13, color=TXT)
ax2.text(0, 2.52 * 1.3, "2.5 倍", color="white", fontsize=15, weight="bold", ha="center")
ax2.text(1, 410.9 * 1.3, "411 倍", color="white", fontsize=15, weight="bold", ha="center")
ax2.set_ylim(1, 3000)
ax2.set_title("对数坐标", color=GREY, fontsize=12, loc="left")
fig.text(0.04, 0.855, "这 7 天只占全部交易日的 2.8%，却贡献了指数约 15% 的涨幅（按对数收益算）。效应是真的，但拿它来择时毫无意义。",
         color=GOLD, fontsize=13)
save(fig, "07_只拿这7天.png")
print("ok")
