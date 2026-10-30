library(tidyverse)

all_nyc <- read.csv(file.choose())

# Convert square footage to numbers
all_nyc$gross_square_feet <- parse_number(
  all_nyc$gross_square_feet
)

# Filter Murray Hill using the assignment requirements
murray_hill <- filter(
  all_nyc,
  neighborhood == "MURRAY HILL",
  tax_class_at_time_of_sale %in% c(1, 2),
  !str_detect(building_class_category, "CONDO"),
  sale_price > 10000,
  gross_square_feet > 100
)

# Divide sales into two periods
before_2020 <- filter(
  murray_hill,
  sale_date < "2020-01-01"
)

from_2020 <- filter(
  murray_hill,
  sale_date >= "2020-01-01"
)

# 1a: Number of sales from 2020 onward
nrow(from_2020)

# 1b: Mean sale price and gross square footage
mean(before_2020$sale_price)
mean(from_2020$sale_price)

mean(before_2020$gross_square_feet)
mean(from_2020$gross_square_feet)

# 1c: Five-number summaries
fivenum(before_2020$sale_price)
fivenum(from_2020$sale_price)

fivenum(before_2020$gross_square_feet)
fivenum(from_2020$gross_square_feet)

# 1d: Standard deviation of sale prices
sd(before_2020$sale_price)
sd(from_2020$sale_price)

# 1e: Correlation between price and square footage
cor(before_2020$sale_price,
    before_2020$gross_square_feet)

cor(from_2020$sale_price,
    from_2020$gross_square_feet)


# Question 2: K-means Clustering

# Select numeric variables
cluster_data <- select(
  murray_hill,
  sale_price,
  gross_square_feet
)

# Standardize the variables
scaled_data <- scale(cluster_data)

# Create a model with three clusters
set.seed(123)

model <- kmeans(
  scaled_data,
  centers = 3,
  nstart = 25
)

# Display cluster centroids
model$centers

# Display the number of sales in each cluster
model$size

# Add cluster labels to the original data
murray_hill$cluster <- as.factor(model$cluster)

# Display cluster means in original units
murray_hill %>%
  group_by(cluster) %>%
  summarise(
    mean_price = mean(sale_price),
    mean_sqft = mean(gross_square_feet)
  )

# Plot 1: Sale price versus gross square footage
ggplot(
  murray_hill,
  aes(
    x = gross_square_feet,
    y = sale_price,
    color = cluster
  )
) +
  geom_point() +
  labs(
    title = "Sale Price and Square Footage by Cluster",
    x = "Gross Square Footage (sq ft)",
    y = "Sale Price ($)",
    color = "Cluster"
  )

# Plot 2: Sale price by cluster
ggplot(
  murray_hill,
  aes(
    x = cluster,
    y = sale_price,
    fill = cluster
  )
) +
  geom_boxplot() +
  labs(
    title = "Sale Price by Cluster",
    x = "Cluster",
    y = "Sale Price ($)",
    fill = "Cluster"
  )

# Plot 3: Gross square footage by cluster
ggplot(
  murray_hill,
  aes(
    x = cluster,
    y = gross_square_feet,
    fill = cluster
  )
) +
  geom_boxplot() +
  labs(
    title = "Gross Square Footage by Cluster",
    x = "Cluster",
    y = "Gross Square Footage (sq ft)",
    fill = "Cluster"
  )

# Plot 4: Residential units by cluster
ggplot(
  murray_hill,
  aes(
    x = cluster,
    y = residential_units,
    fill = cluster
  )
) +
  geom_boxplot() +
  labs(
    title = "Residential Units by Cluster",
    x = "Cluster",
    y = "Number of Residential Units",
    fill = "Cluster"
  )



# Question 3: Two-sample t-tests

# Count sales by building class
murray_hill %>%
  count(building_class_as_of_final, sort = TRUE)

# Select the two most common classes
class1 <- filter(
  murray_hill,
  building_class_as_of_final == "C5"
)

class2 <- filter(
  murray_hill,
  building_class_as_of_final == "A4"
)

# Number of sales
nrow(class1)
nrow(class2)

# Mean sale prices
mean(class1$sale_price)
mean(class2$sale_price)

# T-test for sale price
t.test(
  class1$sale_price,
  class2$sale_price
)

# Mean gross square footage
mean(class1$gross_square_feet)
mean(class2$gross_square_feet)

# T-test for gross square footage
t.test(
  class1$gross_square_feet,
  class2$gross_square_feet
)
