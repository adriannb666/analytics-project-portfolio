# 张逸天 Yitian (Adrian) Zhang｜项目作品集

整理应用数学、商业分析、文本分析、量化决策和交易工具项目，保留可找到的历史源码，并说明每个项目的成果、团队背景与复现条件。

## 重点项目

| 项目 | 主要内容 | 当前材料 |
| --- | --- | --- |
| [交易研究与风险终端](projects/trading-terminal) | 交易计划、仓位计算、交易日志、交易前检查与风险监控 | React / JavaScript / TypeScript 源码快照 |
| [人才招聘与雇主对标](projects/early-career-talent) | 招聘广告与员工评论分析、关键词筛查、人工证据核对、商业建议 | Python 脚本与多个历史 Notebook；League of Page 团队，2026 BU ABA 黑客松冠军 |
| [Celonis 三家公司分析](projects/celonis-employer-analysis) | 原始字段保留、数据质量标记、评分清理、团队分析流程 | Python 预处理脚本和 Notebook |
| [纽约房产交易分析](projects/nyc-property-analysis) | 时期比较、K-means 聚类、可视化和双样本检验 | R 源码 |

另有 [TVEM Bands 指标](projects/tvem-bands) 和 [B-SIM 营销决策案例](projects/bsim-marketing)。完整的 15 项目录见 [PROJECTS.md](PROJECTS.md)。

## 数学建模与量化研究

`research/` 记录比特币动态配置、黄金与比特币策略、贷款审批、航空机队优化、施工排程、平方根算法蒙特卡洛、Auto MPG 正则化回归、鱼缸动态规划、房价统计分析。每个项目分别标注源码找回情况；暂时只有报告或经历描述的项目，不冒充已有完整可运行代码。

再次展开长对话的更早消息后，已补回黄金/比特币的完整 Python 历史回测脚本，包含 VaR/CVaR、权重优化、EMA 交易、手续费与回撤计算。代码保留当时的实现，运行条件和方法局限见项目说明。

继续翻查搜索结果的后续页，还找回了比特币毕业设计相关的两份 R 训练验证与绘图脚本。它们采用固定权重再平衡，已注明与最终 Bellman 动态规划模型的区别。

## 其他代码

- `practice/python-fundamentals/`：基础 Python 练习源码，与中大型项目分开。
- `practice/indicator-conversions/`：归档对话中找回的 Python/Pine 指标转换版本与片段，注明外部公式来源和历史报错。
- `practice/matlab-image-arithmetic/`：MATLAB 图像均方误差练习。
- `tools/resume-generator/`：中英文多方向简历生成脚本，联系方式已替换为占位符。

公开版本清除了 Notebook 输出、个人元数据和内嵌压缩数据，保留代码与必要说明。比赛原始数据、员工评论全文、真实交易账户、私密邮件和成绩单不在仓库中。团队项目与 AI 辅助范围均注明；仿真收益、关键词比例与未来建议不会写成真实业务成果。

具体运行条件见各项目 README；覆盖范围、待补材料和验证情况分别见 [RECOVERY_STATUS.md](RECOVERY_STATUS.md)、[VALIDATION.md](VALIDATION.md) 与 [DATA_POLICY.md](DATA_POLICY.md)。
