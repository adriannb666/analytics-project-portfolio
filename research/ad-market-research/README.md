# AD市场研究 · Market Research

> **English summary.** Data studies on Bitcoin published on Zhihu (@阿德里安). Each folder has code that re-downloads Binance public market data and reproduces every number, the results, and the article figures. Highlights: a rule-based ICT strategy backtest (473 trades, −57R after fees; no better than on random-walk prices), an hour-of-day study (US Eastern 5–6 pm carries about two-thirds of BTC's 2020–2026 log return, t = 4.97), and a 1.05-million-position leverage survival simulation (median life of a 100x position: 4.6 hours).

加密货币与美股的数据研究、回测代码和配图。每一篇研究一个文件夹，包含：

- **代码**：从公开数据源重新下载数据、复现文中每一个数字
- **结果数据**：文章里用到的统计结果
- **配图**：文章里的全部图片（带水印）

作者：阿德里安（知乎 [@阿德里安](https://www.zhihu.com/people/ad_trading)）· Discord 搜「交易俱乐部」：discord.gg/ad-market-research

## 研究目录

| # | 日期 | 题目 | 一句话结论 |
| --- | --- | --- | --- |
| 01 | 2026-11-05 | [一笔完整的 ICT 交易：从扫流动性到 FVG 入场](01-ict-complete-trade/) | 用 11/03 的真实行情走完五步流程，约 +1.9R |
| 02 | 2026-11-09 | [把 ICT 策略写成代码，两年 BTC 回测 473 笔](02-ict-backtest/) | 扣费后 −57R；扣费前约等于随机；避开亚洲盘和周末后样本外 +0.15R/笔，但不显著 |
| 03 | 2026-11-09 | [比特币一天里哪个小时最赚钱](03-btc-hour-of-day/) | 美东 17–18 点贡献了 2020 年以来约 2/3 的对数涨幅，t = 4.97；但扣手续费后无法直接交易 |
| 04 | 2026-11-12 | [100 倍杠杆能活多久](04-leverage-survival/) | 105 万个随机仓位：100x 中位寿命 4.6 小时；7 天后方向看对的 100x 仓位里 85% 已提前爆仓 |

## 怎么复现

```bash
# Node.js 18+（计算），Python 3.10+（画图：matplotlib、pandas、numpy，中文字体 Noto Sans CJK SC）
cd research/ad-market-research/02-ict-backtest
node backtest.mjs      # 首次运行会从币安下载数据到 data/（已在 .gitignore 里）
python3 plot_bt.py     # 重新生成 figures/
```

数据来自币安公开行情接口 `data-api.binance.vision`，不需要 API Key。

## 免责声明

所有内容都是历史数据研究，不构成任何投资建议。
