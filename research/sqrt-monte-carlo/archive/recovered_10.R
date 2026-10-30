opt_prop_l1 <- optimize(
  f = M1_prop,
  interval = c(0.05, 2),
  lambda = lambda1
)

opt_prop_l2 <- optimize(
  f = M1_prop,
  interval = c(0.05, 2),
  lambda = lambda2
)
