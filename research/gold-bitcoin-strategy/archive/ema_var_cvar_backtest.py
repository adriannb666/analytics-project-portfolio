import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm
from scipy.optimize import minimize


gold_data = pd.read_csv('LBMA-GOLD.csv')
bitcoin_data = pd.read_csv('BCHAIN-MKPRU.csv')


gold_data['Date'] = pd.to_datetime(gold_data['Date'], format='%m/%d/%y')
gold_data = gold_data.set_index('Date')
gold_prices = gold_data['USD (PM)']




bitcoin_data['Date'] = pd.to_datetime(bitcoin_data['Date'], format='%m/%d/%y')
bitcoin_data = bitcoin_data.set_index('Date')
bitcoin_prices = bitcoin_data['Value']




gold_prices = gold_prices.dropna()
bitcoin_prices = bitcoin_prices.dropna()




gold_returns = gold_prices.pct_change().dropna()
bitcoin_returns = bitcoin_prices.pct_change().dropna()




def calculate_var_cvar(returns, confidence_level=0.95):
   mean_return = returns.mean()
   std_dev = returns.std()


   VaR = mean_return + std_dev * norm.ppf(confidence_level)


   CVaR = mean_return + std_dev * (norm.pdf(norm.ppf(confidence_level)) / (1 - confidence_level))


   return VaR, CVaR




confidence_level = 0.95
VaR_gold, CVaR_gold = calculate_var_cvar(gold_returns, confidence_level)




VaR_bitcoin, CVaR_bitcoin = calculate_var_cvar(bitcoin_returns, confidence_level)




print(f"Gold {confidence_level * 100}% VaR is: {VaR_gold}")
print(f"Gold {confidence_level * 100}% CVaR is : {CVaR_gold}")
print(f"Bitcoin {confidence_level * 100}% VaR is: {VaR_bitcoin}")
print(f"Bitcoin {confidence_level * 100}% CVaR is: {CVaR_bitcoin}")




returns = pd.concat([gold_returns, bitcoin_returns], axis=1, keys=['Gold', 'Bitcoin']).dropna()




def portfolio_return(weights, returns):
   return returns.dot(weights)




def calculate_portfolio_var_cvar(weights):
   portfolio_returns = returns.dot(weights)
   VaR, CVaR = calculate_var_cvar(portfolio_returns, confidence_level=0.95)
   return VaR, CVaR




def objective(weights):
   return -weights[1]




def constraint_total_weight(weights):
   return np.sum(weights) - 1




def constraint_var(weights):
   VaR, _ = calculate_portfolio_var_cvar(weights)
   return 0.05 - VaR




def constraint_cvar(weights):
   _, CVaR = calculate_portfolio_var_cvar(weights)
   return 0.07 - CVaR




initial_weights = np.array([0.5, 0.5])




bounds = [(0, 1), (0, 1)]




constraints = [
   {'type': 'eq', 'fun': constraint_total_weight},
   {'type': 'ineq', 'fun': constraint_var},
   {'type': 'ineq', 'fun': constraint_cvar}
]




result = minimize(objective, initial_weights, method='SLSQP', bounds=bounds, constraints=constraints)




optimized_weights = result.x
VaR_portfolio, CVaR_portfolio = calculate_portfolio_var_cvar(optimized_weights)




print(f"Optimized Weights: Gold = {optimized_weights[0]:.4f}, Bitcoin = {optimized_weights[1]:.4f}")
print(f"Portfolio {confidence_level * 100}% VaR is: {VaR_portfolio:.4f}")
print(f"Portfolio {confidence_level * 100}% CVaR is: {CVaR_portfolio:.4f}")




portfolio_returns = returns.dot(optimized_weights)




all_returns = pd.concat([gold_returns, bitcoin_returns, portfolio_returns], axis=1)
y_min, y_max = all_returns.min().min(), all_returns.max().max()




plt.figure(figsize=(12, 6))
plt.plot(bitcoin_returns, label='Bitcoin Daily Returns', color='blue', alpha=0.7)
plt.plot(gold_returns, label='Gold Daily Returns', color='gold', alpha=0.7)
plt.axhline(y=0, color='gray', linestyle='--', linewidth=1)
plt.xlabel("Date")
plt.ylabel("Daily Return")
plt.title("Comparison of Daily Returns: Gold vs. Bitcoin")
plt.legend()
plt.ylim(y_min, y_max)
plt.show()




plt.figure(figsize=(12, 6))
plt.plot(portfolio_returns, label='Hold Strategy Portfolio Returns', color='green', alpha=0.9)
plt.axhline(y=0, color='gray', linestyle='--', linewidth=1)
plt.xlabel("Date")
plt.ylabel("Daily Return")
plt.title("Daily Returns of Hold Strategy Portfolio")
plt.legend()
plt.ylim(y_min, y_max)
plt.show()




optimized_portfolio_values = []
optimized_cash = 1000
gold_allocated = optimized_weights[0] * optimized_cash
bitcoin_allocated = optimized_weights[1] * optimized_cash




gold_optimized_holdings = gold_allocated / gold_prices.iloc[0]
bitcoin_optimized_holdings = bitcoin_allocated / bitcoin_prices.iloc[0]


for date in gold_prices.index:
   current_gold_price = gold_prices[date]
   current_bitcoin_price = bitcoin_prices[date]
   portfolio_value = (
       gold_optimized_holdings * current_gold_price +
       bitcoin_optimized_holdings * current_bitcoin_price
   )
   optimized_portfolio_values.append(portfolio_value)


plt.figure(figsize=(12, 6))
plt.plot(gold_prices.index, optimized_portfolio_values, label='Hold Strategy Portfolio Value', color='blue', alpha=0.9)
plt.xlabel("Date")
plt.ylabel("Portfolio Value")
plt.title("Hold Strategy Portfolio Value Over Time")
plt.legend()
plt.show()


final_optimized_return = (optimized_portfolio_values[-1] - optimized_portfolio_values[0])


print(f"Final Return of Hold Strategy Portfolio: ${final_optimized_return:.4f}")



#ewm is the python function for Exponential Weighted functions, plug in window size,  combining
#with the mean function, we are able to calculate out the EMA using python
ema_window = 30
gold_ema = gold_prices.ewm(span=ema_window).mean()
bitcoin_ema = bitcoin_prices.ewm(span=ema_window).mean()




initial_cash = 1000
gold_weight = 0.3471
bitcoin_weight = 0.6529


gold_holdings = 0
bitcoin_holdings = 0
cash = initial_cash




gold_commission = 0.01
bitcoin_commission = 0.02




threshold = 0.01




portfolio_values = []
Gold_buy = 0
Gold_sell = 0
Bitcoin_buy = 0
Bitcoin_sell = 0




gold_can_sell = False
bitcoin_can_sell = False


portfolio_returns = []
portfolio_values_no_strategy = []


for date in gold_prices.index[ema_window:]:
   current_gold_price = gold_prices[date]
   current_bitcoin_price = bitcoin_prices[date]
   current_gold_ema = gold_ema[date]
   current_bitcoin_ema = bitcoin_ema[date]


   target_gold_cash = gold_weight * cash
   target_bitcoin_cash = bitcoin_weight * cash


   if not gold_can_sell and current_gold_price > current_gold_ema * (1 + threshold) and cash >= (target_gold_cash + gold_commission * target_gold_cash):
       trade_amount = target_gold_cash / current_gold_price
       commission = gold_commission * target_gold_cash
       gold_holdings += trade_amount
       cash -= (target_gold_cash + commission)
       Gold_buy += 1
       gold_can_sell = True
   elif gold_can_sell and current_gold_price < current_gold_ema * (1 - threshold + 0.01):
       trade_amount = gold_holdings * current_gold_price
       commission = gold_commission * trade_amount
       cash += (trade_amount - commission)
       gold_holdings = 0
       Gold_sell += 1
       gold_can_sell = False


   if not bitcoin_can_sell and current_bitcoin_price > current_bitcoin_ema * (1 + threshold) and cash >= (target_bitcoin_cash + bitcoin_commission * target_bitcoin_cash):
       trade_amount = target_bitcoin_cash / current_bitcoin_price
       commission = bitcoin_commission * target_bitcoin_cash
       bitcoin_holdings += trade_amount
       cash -= (target_bitcoin_cash + commission)
       Bitcoin_buy += 1
       bitcoin_can_sell = True
   elif bitcoin_can_sell and current_bitcoin_price < current_bitcoin_ema * (1 - threshold + 0.01):
       trade_amount = bitcoin_holdings * current_bitcoin_price
       commission = bitcoin_commission * trade_amount
       cash += (trade_amount - commission)
       bitcoin_holdings = 0
       Bitcoin_sell += 1
       bitcoin_can_sell = False


   portfolio_value = (
       gold_holdings * current_gold_price +
       bitcoin_holdings * current_bitcoin_price +
       cash
   )
   portfolio_values.append(portfolio_value)


   if len(portfolio_values) > 1:
       portfolio_return = (portfolio_values[-1] - portfolio_values[-2]) / portfolio_values[-2]
       portfolio_returns.append(portfolio_return)


if gold_can_sell and gold_holdings > 0:
   trade_amount = gold_holdings * gold_prices.iloc[-1]
   commission = gold_commission * trade_amount
   cash += (trade_amount - commission)
   Gold_sell += 1
   gold_holdings = 0


if bitcoin_can_sell and bitcoin_holdings > 0:
   trade_amount = bitcoin_holdings * bitcoin_prices.iloc[-1]
   commission = bitcoin_commission * trade_amount
   cash += (trade_amount - commission)
   Bitcoin_sell += 1
   bitcoin_holdings = 0




portfolio_returns_series = pd.Series(portfolio_returns)


confidence_level = 0.95
VaR, CVaR = calculate_var_cvar(portfolio_returns_series, confidence_level=confidence_level)




plt.figure(figsize=(12, 6))
plt.plot(gold_prices.index[ema_window:], portfolio_values, label='EMA Strategy Portfolio Value')
plt.xlabel('Date')
plt.ylabel('Portfolio Value')
plt.title('EMA Strategy Portfolio Value Over Time')
plt.legend()
plt.show()


final_portfolio_value = cash
print(f"Final EMA Strategy Portfolio Value: ${final_portfolio_value:.2f}")
print(f"Gold Buys: {Gold_buy}")
print(f"Gold Sells: {Gold_sell}")
print(f"Bitcoin Buys: {Bitcoin_buy}")
print(f"Bitcoin Sells: {Bitcoin_sell}")
print(f"Portfolio VaR (95%): {VaR:.4f}")
print(f"Portfolio CVaR (95%): {CVaR:.4f}")


plt.figure(figsize=(12, 6))
plt.plot(portfolio_returns_series, label='EMA Strategy Portfolio Returns', color='red', alpha=0.9)
plt.axhline(y=0, color='gray', linestyle='--', linewidth=1)
plt.xlabel("Date")
plt.ylabel("Daily Return")
plt.title("Daily Returns of EMA Strategy")
plt.legend()
plt.ylim(y_min, y_max)
plt.show()




def calculate_max_drawdown(values):
   values = np.array(values)
   peak = np.maximum.accumulate(values)
   drawdown = (values - peak) / peak
   max_drawdown = drawdown.min()
   return max_drawdown




max_drawdown_strategy = calculate_max_drawdown(portfolio_values)
print(f"Maximum Drawdown for EMA Strategy Portfolio: {max_drawdown_strategy:.4f}")




max_drawdown_optimized = calculate_max_drawdown(optimized_portfolio_values)
print(f"Maximum Drawdown for Hold Strategy Portfolio: {max_drawdown_optimized:.4f}")