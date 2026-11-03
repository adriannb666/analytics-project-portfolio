integrand_prop <- function(x, alpha, lambda) {
  if (alpha <= 0) return(Inf)
  y0 <- alpha * x
  y1 <- 0.5 * (y0 + x / y0) # 或者 0.5 * (alpha * x + 1/alpha)
  err_sq <- (y1 - sqrt(x))^2
  fx <- lambda * exp(-lambda * x)
  err_sq * fx
}
