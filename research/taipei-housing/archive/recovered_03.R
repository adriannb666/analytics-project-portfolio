# Load necessary packages
library(ggplot2)

# 1. Regression Coefficients Plot
coeffs <- summary(final_model)$coefficients
coeffs_df <- data.frame(Variable = rownames(coeffs), Estimate = coeffs[, "Estimate"])
ggplot(coeffs_df, aes(x = Variable, y = Estimate)) +
  geom_bar(stat = "identity", fill = "steelblue") +
  labs(title = "Regression Coefficients Plot", x = "Variable", y = "Estimated Coefficient") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

# 2. Predicted vs Actual Values Plot
data$Predicted <- predict(final_model)
ggplot(data, aes(x = Predicted, y = Price)) +
  geom_point(color = "blue") +
  geom_abline(intercept = 0, slope = 1, color = "red") +
  labs(title = "Predicted vs Actual Prices", x = "Predicted Price", y = "Actual Price")

# 3. Residual Distribution Plot
ggplot(data, aes(x = final_model$residuals)) +
  geom_histogram(bins = 30, fill = "purple", color = "black") +
  labs(title = "Residual Distribution", x = "Residuals", y = "Frequency")
