# Fish Tank Inventory Dynamic Programming

**Question:** How many fish tanks should Pete's Pet Supply order each day over a 7-day week to maximize expected profit, given random demand and holding costs?

**Result:** The optimal policy is an order-up-to rule that winds down toward the end of the week. For example, with an empty shop, order 3 tanks on days 1–5, 1–2 on day 6 and none on day 7. Expected weekly profit from 3 tanks in stock is $3,631 under week-1 demand and $2,858 under week-2 demand. Using the wrong week's policy costs only about 2.5% of expected profit, so the policy is robust to this change in demand.

**Methods:** Finite-horizon stochastic dynamic programming (backward induction). The state is inventory 0–5, the action is the order quantity, and the model includes a terminal cleaning cost. Robustness is checked by evaluating each policy under the other week's demand.

**Reproduced:** ✅ The recomputed optimal policies match the policy tables saved in the original script, cell for cell. See [reproduction results](reproduction/RESULTS.md).

Files: `archive/recovered_08.m` is the most complete script. `archive/original_single_week.m` is the original single-week base model, found as a local file; it reproduces the week-2 policy exactly. The other files are earlier scenario variants; run them separately rather than as one program ([SOURCE_INDEX.md](SOURCE_INDEX.md)).
