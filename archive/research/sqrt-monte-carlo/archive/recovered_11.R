Mn_fixed_mc <- function(y0, lambda, n, N = 10000) {
  if (y0 <= 0) return(Inf)
  X <- rexp(N, rate = lambda)  # 生成 N 个指数分布样本
  Yn <- sapply(X, function(x) sqrt_iter(x, y0, n))
  err_sq <- (Yn - sqrt(X))^2
  mean(err_sq)
}
