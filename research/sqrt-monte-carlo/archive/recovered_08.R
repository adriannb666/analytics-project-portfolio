M1_prop <- function(alpha, lambda) {
  if (alpha <= 0) return(Inf)
  res <- integrate(
    f = integrand_prop,
    lower = 0,
    upper = Inf,
    alpha = alpha,
    lambda = lambda,
    rel.tol = 1e-6
  )
  res$value
}
