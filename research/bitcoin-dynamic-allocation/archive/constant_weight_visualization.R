# ============================================================
# Visualization for Math/Stat Capstone – Portfolio Rebalancing
# ============================================================

# 依赖包 ------------------------------------------------------
library(ggplot2)
library(dplyr)
library(scales)

# ----------------------- 数据读取 ----------------------------
data_path <- Sys.getenv("BTC_DATA_FILE")
if (!nzchar(data_path)) stop("Set BTC_DATA_FILE to a CSV with date and close columns.")
raw <- read.csv(data_path, stringsAsFactors = FALSE)
raw$date <- as.Date(raw$date)
raw <- raw[order(raw$date), ]
raw$ret <- c(NA, diff(raw$close) / head(raw$close, -1))
raw$ret[is.na(raw$ret)] <- 0

train_end <- as.Date("2023-12-31")
val_end   <- as.Date("2025-10-12")
train_df  <- raw[raw$date <= train_end, ]
val_df    <- raw[raw$date > train_end & raw$date <= val_end, ]

tc        <- 0.001
lambda_grid <- seq(0, 1, by = 0.1)

# ----------------------- 函数定义 -----------------------------
backtest_constant_weight <- function(returns, lambda, tc = 0.001) {
  w <- lambda
  equity <- numeric(length(returns))
  equity[1] <- 1
  for (i in 2:length(returns)) {
    equity[i] <- equity[i-1] * (1 + w * returns[i] - tc * abs(w - w))
  }
  data.frame(equity = equity, ret = c(0, diff(equity)/head(equity,-1)))
}

stats_from_returns <- function(rets){
  ann_factor <- 365
  ann_ret <- (1 + mean(rets))^ann_factor - 1
  ann_vol <- sd(rets) * sqrt(ann_factor)
  sharpe  <- ifelse(ann_vol==0, NA, ann_ret / ann_vol)
  data.frame(ann_ret, ann_vol, sharpe)
}

# ---------------------- 训练期调参 ----------------------------
train_stats <- lapply(lambda_grid, function(l){
  bt <- backtest_constant_weight(train_df$ret, l, tc)
  st <- stats_from_returns(bt$ret)
  cbind(lambda = l, st)
}) %>% bind_rows()

best_lambda <- train_stats$lambda[which.max(train_stats$sharpe)]

# ---------------------- 验证期评估 ----------------------------
val_stats <- lapply(lambda_grid, function(l){
  bt <- backtest_constant_weight(val_df$ret, l, tc)
  st <- stats_from_returns(bt$ret)
  cbind(lambda = l, st)
}) %>% bind_rows()

# =============================================================
# 1️⃣ 图1：价格曲线 + 训练/验证分割
# =============================================================
ggplot(raw, aes(x = date, y = close)) +
  geom_line(color = "#0072B2", size = 1) +
  geom_vline(xintercept = as.numeric(train_end), linetype = "dashed", color = "red", size = 1) +
  annotate("text", x = train_end - 150, y = max(raw$close), label = "Training", color = "blue", size = 4) +
  annotate("text", x = train_end + 150, y = max(raw$close), label = "Validation", color = "orange", size = 4) +
  labs(title = "Bitcoin Price (2019–2025) with Train/Validation Split",
       x = "Date", y = "Price (USD)") +
  theme_minimal()

# =============================================================
# 2️⃣ 图2：训练 vs 验证 夏普率对比柱状图
# =============================================================
combined_stats <- merge(train_stats, val_stats, by = "lambda", suffixes = c("_train", "_val"))
ggplot(combined_stats, aes(x = lambda)) +
  geom_col(aes(y = sharpe_train), fill = "#0072B2", alpha = 0.7) +
  geom_col(aes(y = sharpe_val), fill = "#E69F00", alpha = 0.7) +
  geom_vline(xintercept = best_lambda, linetype = "dashed", color = "red") +
  annotate("text", x = best_lambda, y = max(c(combined_stats$sharpe_train, combined_stats$sharpe_val), na.rm=TRUE),
           label = paste0("Best λ = ", best_lambda), color = "red", vjust = -0.5) +
  labs(title = "Sharpe Ratios across λ Values",
       x = "λ (constant weight)", y = "Sharpe Ratio",
       caption = "Blue = Training, Orange = Validation") +
  theme_minimal()

# =============================================================
# 3️⃣ 图3：风险-收益散点图（Risk–Return Tradeoff）
# =============================================================
risk_return <- rbind(
  data.frame(set = "Train", lambda = train_stats$lambda, ann_ret = train_stats$ann_ret, ann_vol = train_stats$ann_vol),
  data.frame(set = "Validation", lambda = val_stats$lambda, ann_ret = val_stats$ann_ret, ann_vol = val_stats$ann_vol)
)
ggplot(risk_return, aes(x = ann_vol, y = ann_ret, color = set, label = lambda)) +
  geom_point(size = 3) +
  geom_text(vjust = -0.7, size = 3) +
  geom_vline(xintercept = risk_return$ann_vol[risk_return$lambda == best_lambda & risk_return$set == "Train"], linetype = "dashed", color = "red") +
  geom_hline(yintercept = risk_return$ann_ret[risk_return$lambda == best_lambda & risk_return$set == "Train"], linetype = "dashed", color = "red") +
  labs(title = "Risk–Return Tradeoff across λ",
       x = "Annualized Volatility", y = "Annualized Return",
       caption = "Dashed lines = best λ from training") +
  theme_minimal()

# =============================================================
# 4️⃣ 图4：验证集净值曲线（突出最优 λ）
# =============================================================
val_equity <- backtest_constant_weight(val_df$ret, best_lambda, tc)
val_df$equity_best <- val_equity$equity
ggplot(val_df, aes(x = date, y = equity_best)) +
  geom_line(color = "#009E73", size = 1) +
  labs(title = paste0("Validation Equity Curve (λ* = ", best_lambda, ")"),
       x = "Date", y = "Portfolio Value (normalized)") +
  theme_minimal()

# =============================================================
# 导出所有图（可选）
# =============================================================
# ggsave("1_price_split.png", width = 8, height = 4)
# ggsave("2_sharpe_compare.png", width = 8, height = 4)
# ggsave("3_risk_return.png", width = 6, height = 5)
# ggsave("4_validation_equity.png", width = 8, height = 4)