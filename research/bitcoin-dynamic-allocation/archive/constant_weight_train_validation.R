# ===================== 基本设置 =====================
# 1) 路径与文件
data_path <- Sys.getenv("BTC_DATA_FILE")
if (!nzchar(data_path)) stop("Set BTC_DATA_FILE to a CSV with date and close columns.")
# 2) 数据列要求：date, close
# 3) 交易/评估参数
tc        <- 0.001        # 单边交易成本（0.1% = 0.001）
rebal_k   <- 5            # 每隔 k 个交易日再平衡（例如 5=周频）
rf        <- 0            # 无风险利率（用于夏普率；简单设为0）
lambda_grid <- seq(0, 1, by = 0.05)  # 待尝试的常数 λ 网格（目标权重）

# 4) 时间切分（按你的项目需要修改）
train_end <- as.Date("2023-12-31")   # 训练集结束（含当天）
val_end   <- as.Date("2025-10-12")   # 验证集结束（含当天）

# ===================== 工具函数 =====================
ann_factor <- function(n_days_per_year = 365) n_days_per_year

to_returns <- function(price_vec) {
  # 简单收益率
  r <- c(NA, diff(price_vec) / head(price_vec, -1))
  r[is.na(r)] <- 0
  r
}

max_drawdown <- function(equity) {
  # equity 为净值序列
  peak <- cummax(equity)
  drawdown <- equity / peak - 1
  min(drawdown, na.rm = TRUE)
}

stats_from_returns <- function(rets, n_days_per_year = 365, rf = 0) {
  # 年化收益、波动、夏普、最大回撤
  m <- mean(rets, na.rm = TRUE)
  s <- sd(rets,   na.rm = TRUE)
  ann_ret <- (1 + m)^(ann_factor(n_days_per_year)) - 1
  ann_vol <- s * sqrt(ann_factor(n_days_per_year))
  sharpe  <- ifelse(ann_vol == 0, NA, (ann_ret - rf) / ann_vol)
  # 由净值重算最大回撤
  equity <- cumprod(1 + rets)
  mdd <- max_drawdown(equity)
  list(ann_ret = ann_ret, ann_vol = ann_vol, sharpe = sharpe, mdd = mdd,
       last_equity = tail(equity, 1))
}

backtest_constant_weight <- function(returns, lambda, tc = 0, rebal_k = 1) {
  # returns: 向量，日收益率（标的为BTC），现金收益设为0
  # 策略：长期目标权重 w_t = lambda（0~1），每隔 rebal_k 天再平衡一次。
  # 成本处理：仅在再平衡的那天，根据 |w_target - w_prev| 扣除 tc * |Δw|。
  n <- length(returns)
  w_prev <- 0   # 初始从0仓位出发（你也可改为 lambda）
  rets_net <- numeric(n)

  for (t in 1:n) {
    # 当天标的收益
    r_btc <- returns[t]
    # 再平衡日判定
    is_rebal_day <- (t == 1) || ((t - 1) %% rebal_k == 0)

    if (is_rebal_day) {
      turnover  <- abs(lambda - w_prev)     # 权重变化的绝对值
      cost_rate <- tc * turnover            # 以净值为基数的比例成本
      w_prev    <- lambda                   # 执行再平衡
    } else {
      cost_rate <- 0
    }

    # 当日净收益：w * r_btc - 成本
    rets_net[t] <- w_prev * r_btc - cost_rate
  }
  return(rets_net)
}

evaluate_on_period <- function(df, lambda, tc, rebal_k) {
  # df:必须包含列 ret（BTC日收益）
  rets <- backtest_constant_weight(df$ret, lambda, tc = tc, rebal_k = rebal_k)
  stats_from_returns(rets)
}

# ===================== 读取与预处理 =====================
raw <- read.csv(data_path, stringsAsFactors = FALSE)
stopifnot(all(c("date", "close") %in% names(raw)))
raw$date  <- as.Date(raw$date)
raw       <- raw[order(raw$date), ]
raw$ret   <- to_returns(raw$close)

# 剪裁到 val_end 之前（避免未来数据泄漏）
raw <- raw[raw$date <= val_end, ]

# 切分集
train_df <- raw[raw$date <= train_end, ]
val_df   <- raw[raw$date >  train_end & raw$date <= val_end, ]

if (nrow(train_df) < 10) stop("训练集太短；请检查 train_end。")
if (nrow(val_df)   < 10) warning("验证集较短；建议延长验证区间。")

# ===================== 1) 在训练集上调参（选 λ*） =====================
train_results <- lapply(lambda_grid, function(lam) {
  st <- evaluate_on_period(train_df, lam, tc = tc, rebal_k = rebal_k)
  data.frame(lambda = lam,
             train_ann_ret = st$ann_ret,
             train_ann_vol = st$ann_vol,
             train_sharpe  = st$sharpe,
             train_mdd     = st$mdd,
             train_last_eq = st$last_equity,
             stringsAsFactors = FALSE)
})
train_table <- do.call(rbind, train_results)

# 选夏普率最高的 λ*
best_row <- train_table[which.max(train_table$train_sharpe), , drop = FALSE]
lambda_star <- best_row$lambda

cat("==== Grid Search on TRAIN ====\n")
print(train_table)
cat("\n**Best lambda (by Sharpe on train)**:", lambda_star, "\n\n")

# ===================== 2) 固定 λ*，在验证集上评估 =====================
val_stats <- evaluate_on_period(val_df, lambda_star, tc = tc, rebal_k = rebal_k)
val_table <- data.frame(
  lambda_star   = lambda_star,
  val_ann_ret   = val_stats$ann_ret,
  val_ann_vol   = val_stats$ann_vol,
  val_sharpe    = val_stats$sharpe,
  val_mdd       = val_stats$mdd,
  val_last_eq   = val_stats$last_equity,
  stringsAsFactors = FALSE
)

cat("==== Validation with lambda* ====\n")
print(val_table)

# ===================== 3) （可选）基准对比：全仓/空仓 =====================
# 仅作参考：lambda=1（长期满仓）和 lambda=0（全现金）在验证期的表现
bench_full  <- stats_from_returns(backtest_constant_weight(val_df$ret, 1, tc, rebal_k))
bench_cash  <- stats_from_returns(backtest_constant_weight(val_df$ret, 0, tc, rebal_k))
bench_table <- data.frame(
  strategy     = c("Full BTC (λ=1)", "All Cash (λ=0)", "Chosen λ*"),
  ann_ret      = c(bench_full$ann_ret, bench_cash$ann_ret, val_stats$ann_ret),
  ann_vol      = c(bench_full$ann_vol, bench_cash$ann_vol, val_stats$ann_vol),
  sharpe       = c(bench_full$sharpe,  bench_cash$sharpe,  val_stats$sharpe),
  mdd          = c(bench_full$mdd,     bench_cash$mdd,     val_stats$mdd),
  last_equity  = c(bench_full$last_equity, bench_cash$last_equity, val_stats$last_equity),
  stringsAsFactors = FALSE
)

cat("\n==== Validation Benchmarks Comparison ====\n")
print(bench_table)

# ===================== 4) （可选）导出结果 =====================
# write.csv(train_table, "train_grid_results.csv", row.names = FALSE)
# write.csv(val_table,   "validation_result.csv",  row.names = FALSE)
# write.csv(bench_table, "validation_benchmarks.csv", row.names = FALSE)

cat("\nDone.\n")