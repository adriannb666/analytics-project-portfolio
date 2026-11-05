> **English portfolio:** [Open the main portfolio](README.md) · [All 15 projects](PROJECTS.md)
>
> 本页是中文简介，作品集和各项目文档以英文为主。

# 张逸天 Yitian (Adrian) Zhang｜分析与量化研究作品集

波士顿大学应用商业分析硕士（在读）· Kenyon College 应用数学学士

这里收录商业分析、运筹优化、统计建模和量化金融方面的项目。**其中 12 个项目已经从源码重新运行，结果和当初报告的数字一致**，详见 [复现汇总](REPRODUCTION.md)。

## 重点项目

| 项目 | 问题 → 结果 | 工具 |
| --- | --- | --- |
| [早期职业人才与雇主对标](projects/early-career-talent) 🏆 | 帮 Accenture 改进面向早期职业人才的雇佣方案和招聘信息：对比 Booz Allen、Capgemini 的 505 条招聘广告和员工评价，提出两个试点方案。**2026 BU ABA 黑客松冠军团队** | Python、文本筛查、证据核对 |
| [黄金与比特币交易策略](research/gold-bitcoin-strategy) | 2022 美赛 C 题：在 VaR/CVaR 约束下配置资产，再用 EMA 信号交易，1,000 美元增长到 13,236 美元（2016–2021），最大回撤从 81% 降到 47% | Python、SciPy 优化、风险指标 |
| [纽约 Murray Hill 房产交易](projects/nyc-property-analysis) | 比较 2020 年前后的交易：中位价下降，均价却上升；用 K-means 分出异常值；用 Welch t 检验比较建筑类型 | R、K-means、假设检验 |
| [航空机队优化](research/airline-optimization) | 在 1.6 亿美元预算内选机型、排航线的整数规划：购买 6 + 4 架飞机，每天利润 163,600 美元 | MATLAB、LP / MILP |
| [贷款审批预测](research/loan-approval) | 最小二乘分类器准确率 0.89（基准 0.73）；去掉信用分后降到 0.82 | MATLAB、线性代数 |
| [交易研究与风险终端](projects/trading-terminal) | 集交易计划、仓位计算、交易前检查、交易日志和 DEX 账户风险监控于一体的网页应用 | React、TypeScript、Base44 |

## 优化、统计与建模

| 项目 | 结果 | 已复现 |
| --- | --- | --- |
| [沼气厂施工排期（CPM）](research/construction-scheduling) | 工期 38 周；把原论文的 4 条关键路径更正为 2 条 | ✅ |
| [鱼缸库存动态规划](research/fish-tank-dp) | 7 天最优订货策略；需求变化时损失只有约 2.5% | ✅ |
| [平方根算法蒙特卡洛](research/sqrt-monte-carlo) | 1–3 次迭代的最优初值；证明两种初值方式其实等价 | ✅ |
| [Auto MPG：OLS 与岭回归](research/auto-mpg) | 在这组数据上正则化没有带来提升（RMSE 4.14） | ✅ |
| [新北房价回归](research/taipei-housing) | 对数价格模型 R² = 0.725；离捷运站的距离影响最大 | ✅ |
| [Celonis 雇主分析](projects/celonis-employer-analysis) | 不改动原始数据，预处理 758 条招聘广告和 933 条评价，并标记数据质量问题 | ✅ |
| [比特币动态配置（毕业设计）](research/bitcoin-dynamic-allocation) | 用 MDP / Bellman 方程求再平衡策略；辅助实验已复现，最终 DP 代码尚未找回 | 部分 |

另有 [TVEM Bands](projects/tvem-bands) TradingView 指标、[B-SIM 营销案例](projects/bsim-marketing)，以及 Python、R、MATLAB 练习代码和[中英文简历生成脚本](tools/resume-generator)。

每个 `reproduction/` 文件夹都有复现脚本、完整输出和结果对照页，并注明用到的公开数据集。比赛原始数据和纽约房产数据不在仓库中。团队项目注明了成员，AI 辅助情况写在各项目页里。历史回测只是研究练习，不代表实盘收益。
