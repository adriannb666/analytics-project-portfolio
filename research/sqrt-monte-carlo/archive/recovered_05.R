y0_grid <- seq(0.5, 30, length.out = 50)
M1_vals <- sapply(y0_grid, M1_fixed, lambda = lambda1)
plot(y0_grid, M1_vals, type = "l")
