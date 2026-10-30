M1_fixed <- function(y0, lambda) {
  # 避免 y0 <= 0
  if (y0 <= 0) return(Inf)

  res <- integrate(
    f = integrand_fixed,
    lower = 0,
    upper = Inf,
    y0 = y0,
    lambda = lambda,
    rel.tol = 1e-6
  )
  return(res$value)
}
