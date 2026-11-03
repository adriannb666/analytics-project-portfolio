opt_fixed_l1 <- optimize(
  f = M1_fixed,
  interval = c(0.1, 30),
  lambda = lambda1
)
opt_fixed_l2 <- optimize(
  f = M1_fixed,
  interval = c(0.1, 30),
  lambda = lambda2
)
