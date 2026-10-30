alpha_grid <- seq(0.05, 2, length.out = 50)
M1a_vals <- sapply(alpha_grid, M1_prop, lambda = lambda1)
plot(alpha_grid, M1a_vals, type = "l")
