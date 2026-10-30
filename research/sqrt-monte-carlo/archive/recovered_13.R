# 先粗扫
y0_grid <- seq(0.5, 30, length.out = 20)
Mn_vals <- sapply(y0_grid, Mn_fixed_mc, lambda = lambda1, n = 2, N = 5000)
plot(y0_grid, Mn_vals, type = "l")

# 再在谷底附近用 optimize 精细找
opt_M2_fixed_l1 <- optimize(
  f = Mn_fixed_mc,
  interval = c(1, 20),
  lambda = lambda1,
  n = 2,
  N = 20000
)
