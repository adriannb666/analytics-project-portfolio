# Step 1: Load packages
library(Ecdat)
library(ggplot2)

# Step 2: Load dataset
data("Housing")
View(Housing)

# Step 3: Build simple linear regression
model <- lm(price ~ lotsize, data = Housing)

# Step 4: Get R-squared
summary(model)
summary(model)$r.squared

# Step 5: Predict a house price
predict(model, newdata = data.frame(lotsize = 5000))

# Step 6: Create a scatter plot with best-fit line
ggplot(Housing, aes(x = lotsize, y = price)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE)

