# Reproduction: Pete's Pet Supply fish-tank inventory DP

**Status: reproduced. The recomputed optimal policies match the policy tables hard-coded in the original script for both weeks.**

`fish_dp.py` ports the most complete script, [`recovered_08.m`](../archive/recovered_08.m), to Python. The model is a 7-day finite-horizon backward induction. The state is inventory 0–5, and an order brings stock up to at most 5. Revenue is $500 per sale and each tank ordered costs $200. Holding cost is 5x + 3x² and the terminal cleaning cost is 25x + 3x². There are two demand distributions on {0,…,4}, one for week 1 and one for week 2. It needs no data. Run `python3 fish_dp.py`. The full output is in [`output.txt`](output.txt).

| Check | Result |
| --- | --- |
| Week 1 optimal policy vs the `policy_week1` table in the original | Identical (6 × 7) |
| Week 2 optimal policy vs the `policy_week2` table in the original | Identical (6 × 7) |
| Expected 7-day profit, optimal policy, starting with 3 tanks | Week 1: $3,631.34 · Week 2: $2,858.34 |

## Robustness check

The original script tests each week's policy under the other week's demand with a 100-run simulation using `rng(1)`. The port computes the exact expected value instead, averaging over a uniformly random starting inventory as the simulation does:

| Policy applied | Expected reward | Optimal for that demand | Cost of using the wrong policy |
| --- | --- | --- | --- |
| Week 1 policy under week 2 demand | $2,593.20 | $2,660.23 | $67.03 (2.5%) |
| Week 2 policy under week 1 demand | $3,316.41 | $3,400.45 | $84.04 (2.5%) |

The policy is fairly robust to the change in demand: using the wrong week's policy costs about 2.5% of expected profit.

## Check against the original local file

`archive/original_single_week.m` was later found on Adrian's laptop. It is the single-week model with the week-2 demand distribution (0.2231, 0.3347, 0.2510, 0.1255, 0.0657) and the same revenue, order, holding and terminal costs. Ported line for line, it gives the same week-2 optimal policy table as above and the same expected profits (V on day 1 for inventory 0–5: 1898.0, 2320.0, 2627.0, 2858.3, 3045.0, 3213.0). This confirms the parameters in the recovered script against an original file.
