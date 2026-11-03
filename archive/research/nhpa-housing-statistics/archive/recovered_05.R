library(car)

library(readr)#read the data into R
mydata <- read_csv("NHPA.csv") 


#check the structure of the data
str(mydata)

#-----------univariate analysis-----------
#set the plotting layout to a 2x3 grid
par(mfrow = c(2, 3))
# Create separate histograms for each predictor and the outcome variable
##graphically
p1 = hist(mydata$TransactionDate, prob=TRUE,
          main='The distribution of date of sale',
          xlab='Date of Sale')

p2 <- hist(mydata$HouseAge, prob=TRUE,
           main='The distribution of age of the house',
           xlab='Age of the House')

p3 <- hist(mydata$Dist2MRT, prob=TRUE,
           main='The distribution of distance to the nearest MRT station',
           xlab='Distance to the nearest MRT station')

p4 <- hist(mydata$NumConvenStores, prob=TRUE,
           main='The distribution of number of nearby convenience stores',
           xlab='Number of nearby convenience stores')

p5 <- hist(mydata$Latitude, prob=TRUE,
           main='The distribution of latitude',
           xlab='Latitude')

p6 <- hist(mydata$Longitude, prob=TRUE,
           main='The distribution of longitude',
           xlab='Longitude')

#reset the layout to default
par(mfrow = c(1, 1))

#distribution of the outcome variable
hist(mydata$Price, prob=TRUE,
     main = 'The distribution of house price per unit area',
     xlab='House price per unit area')

#descriptive statistics for each predictor and the outcome variable
#numerically
summary(mydata)


#-----------bivariate analysis-----------
#matrix of scatterplots (remove ID in the dataset)
pairs(mydata[-1])
#matrix of correlation coefficient
cor(mydata[-1])



#-----------full model-----------
m1 = lm(Price~TransactionDate + HouseAge + Dist2MRT + 
          NumConvenStores + Latitude + Longitude, data = mydata)
summary(m1)

#check multicolinearity
#keep an eye on Dist2MRT since it's the highest VIF (close to 5)
vif(m1)

#check conditions here
#it seems constant variance, linearity, normality are violated
plot(m1, 1:2)


#-----------revised model-----------
#apply a squared-root transformation to Dist2MRT because of its obvious skewed distributions
mydata$Dist2MRT_sqr = sqrt(mydata$Dist2MRT)
m2 = lm(Price ~ TransactionDate + HouseAge + Dist2MRT_sqr +
          NumConvenStores + Latitude + Longitude, data = mydata)
summary(m2)
#r^2 is better than the full model

#check conditions
#conditions are still no good
plot(m2, 1:2)


#interaction between Dist2MRT_sqr and NumConvenStores
m3 = lm(Price ~ TransactionDate + HouseAge + Dist2MRT_sqr*NumConvenStores + Latitude + Longitude_sqr, data = mydata)
summary(m3)

plot(m3, 1:2)

#nested F, interaction model is better
#a significant improvement when adding the interaction term
anova(m2, m3)

#log transformation of the response variable
mydata$log_Price <- log(mydata$Price)
m4 = lm(log_Price ~ TransactionDate + HouseAge + Dist2MRT_sqr*NumConvenStores + Latitude + Longitude, mydata)
summary(m4)

plot(m4, 1: 2)

#nested F, to see if adding Longitude will improve the overall fit
m4_reduced = lm(log_Price ~ TransactionDate + HouseAge + Dist2MRT_sqr*NumConvenStores + Latitude, mydata)
#high p-value, Longitude does not contribute significantly to predicting log_Price
#exclude it from the final model for better interpretability and simplicity
anova(m4_reduced, m4)


#final model should be m4_reduced
summary(m4_reduced)
plot(m4_reduced, 1:2)
