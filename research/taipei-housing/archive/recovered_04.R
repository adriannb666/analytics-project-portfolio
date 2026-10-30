# Display the equation of the final model (m4_reduced)
cat("Final Model Equation: log(Price) =", coef(m4_reduced)[1], "+",
    paste(names(coef(m4_reduced))[-1], "*", round(coef(m4_reduced)[-1], 3), collapse=" + "))

# Explain results in the context (Add your interpretations here for each coefficient)
# For example:
cat("Interpretation: For every additional unit increase in HouseAge, the log of house price per unit area decreases by", round(coef(m4_reduced)["HouseAge"], 3))

# Track model performance metrics for each model
model_metrics <- data.frame(
  Model = c("Full Model (m1)", "Square-root Transformation (m2)", "Interaction Model (m3)", "Log-transformed Model (m4)", "Final Model (m4_reduced)"),
  R_squared = c(summary(m1)$r.squared, summary(m2)$r.squared, summary(m3)$r.squared, summary(m4)$r.squared, summary(m4_reduced)$r.squared),
  Adj_R_squared = c(summary(m1)$adj.r.squared, summary(m2)$adj.r.squared, summary(m3)$adj.r.squared, summary(m4)$adj.r.squared, summary(m4_reduced)$adj.r.squared)
)
print(model_metrics)
