library(car)

# 1. 显著性测试
# 查看模型中每个变量的系数和显著性
summary(final_model)  # 重新确认变量的显著性（p值）

# 2. 残差分析与模型假设验证
# 2.1 绘制残差图，检查模型假设
par(mfrow = c(2, 2))  # 显示四个图在同一页面上
plot(final_model)  # 自动生成残差图、QQ图、尺度-位置图和杠杆值图

# 解释各图：
# - 残差图：查看是否存在明显的模式，以验证线性假设
# - 正态QQ图：查看残差是否正态分布
# - 尺度-位置图：检查同方差性
# - 杠杆值图：识别潜在异常值和高杠杆点

# 3. 多重共线性检验
# 计算各变量的方差膨胀因子（VIF），通常认为VIF > 10表明多重共线性问题
vif_values <- vif(final_model)
print(vif_values)  # 显示各变量的VIF值

# 4. 模型的R平方值和调整后的R平方值
cat("模型的 R-squared:", summary(final_model)$r.squared, "\n")
cat("调整后的 R-squared:", summary(final_model)$adj.r.squared, "\n")

# 5. 模型显著性检验 (F检验)
# 使用 ANOVA 测试模型的整体显著性
anova(final_model)

# 6. 模型的残差统计
# 计算残差的均值和标准差，进一步检查是否满足正态性
cat("残差均值:", mean(final_model$residuals), "\n")
cat("残差标准差:", sd(final_model$residuals), "\n")
