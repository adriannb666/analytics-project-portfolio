alpha_grid <- seq(0.05, 2, length.out = 20)
Mn_vals_a <- sapply(alpha_grid, Mn_prop_mc, lambda = lambda1, n = 2, N = 5000)
plot(alpha_grid, Mn_vals_a, type = "l")

opt_M2_prop_l1 <- optimize(
  f = Mn_prop_mc,
  interval = c(0.05, 2),
  lambda = lambda1,
  n = 2,
  N = 20000
)
