Mn_prop_mc <- function(alpha, lambda, n, N = 10000) {
  if (alpha <= 0) return(Inf)
  X <- rexp(N, rate = lambda)
  # 对于每个 x_i 的 y0_i = alpha * x_i
  Yn <- mapply(
    function(x) {
      y0 <- alpha * x
      sqrt_iter(x, y0, n)
    },
    x = X
  )
  err_sq <- (Yn - sqrt(X))^2
  mean(err_sq)
}
