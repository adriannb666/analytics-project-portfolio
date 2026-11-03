integrand_fixed <- function(x, y0, lambda) {
  y1 <- 0.5 * (y0 + x / y0)
  err_sq <- (y1 - sqrt(x))^2
  fx <- lambda * exp(-lambda * x)
  err_sq * fx
}
