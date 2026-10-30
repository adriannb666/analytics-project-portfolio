# 加载ggplot2包
library(ggplot2)

# 回归系数图
coeffs <- summary(final_model)$coefficients
coeffs_df <- data.frame(Variable = rownames(coeffs), Estimate = coeffs[, "Estimate"])
ggplot(coeffs_df, aes(x = Variable, y = Estimate)) +
  geom_bar(stat = "identity", fill = "steelblue") +
  labs(title = "回归系数图", x = "变量", y = "估计系数") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

# 预测值与实际值的对比图
data$Predicted <- predict(final_model)
ggplot(data, aes(x = Predicted, y = Price)) +
  geom_point(color = "blue") +
  geom_abline(intercept = 0, slope = 1, color = "red") +
  labs(title = "预测值与实际值的对比", x = "预测价格", y = "实际价格")

# 残差分布图
ggplot(data, aes(x = final_model$residuals)) +
  geom_histogram(bins = 30, fill = "purple", color = "black") +
  labs(title = "残差分布图", x = "残差", y = "频数")
