sqrt_iter <- function(x, y0, n) {
  y <- y0
  for (k in 1:n) {
    y <- 0.5 * (y + x / y)
  }
  return(y)
}
