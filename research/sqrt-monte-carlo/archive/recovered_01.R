# 参数设置 ------------------------------------------------------------

lambda1 <- 1/10
lambda2 <- 1/250

# 1. 迭代函数 ----------------------------------------------------------
# sqrt_iter <- function(x, y0, n) { ... }

# 2. Phase I: n = 1, M1_fixed(y0, lambda) 用 integrate ----------
# 3. Phase I: n = 1, M1_prop(alpha, lambda) 用 integrate ----------
# 4. Phase I: 用 curve + optimize 找最优 y0, alpha ------------
# 5. Phase II: 用 Monte Carlo 版本的 Mn_fixed, Mn_prop ----------
