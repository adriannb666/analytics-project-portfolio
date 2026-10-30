library(Ecdat)
library(ggplot2)

data("Housing")

# Build multiple linear regression model
new_model <- lm(price ~ lotsize + bedrooms + bathrms + stories,
                data = Housing)

# View regression results
summary(new_model)

# Get R-squared
summary(new_model)$r.squared

# Predict a house price
predict(new_model, newdata = data.frame(
  lotsize = 5000,
  bedrooms = 3,
  bathrms = 2,
  stories = 2
))

