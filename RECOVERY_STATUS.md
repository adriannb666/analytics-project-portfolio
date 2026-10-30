# Coverage and source recovery

Snapshot date: 2026-10-30. See [PROJECTS.md](PROJECTS.md) for all 15 project summaries.

## Sources checked

Current local Codex project folders, relevant Desktop/Downloads artifacts, accessible recent and older GPT conversations (including 2024-2026 modeling/code discussions), the existing private application repository, and selected Google Drive project reports.

Historical code was recovered through both conversation tools and the signed-in history UI, including unfenced code in user messages. Exact duplicate copies and empty supplied assignment templates were omitted. Distinct historical versions remain separate.

## Second recovery pass

The first pass missed earlier messages in long conversations. Scrolling back and opening the older message window recovered the complete historical Python gold/Bitcoin EMA/VaR/CVaR backtest, including optimization, commissions, comparator plots, and drawdown calculations. It is now included at `research/gold-bitcoin-strategy/archive/ema_var_cvar_backtest.py`.

Archived chats also supplied Python/Pine indicator-conversion implementations and dependent snippets, plus a MATLAB image-MSE exercise. These are included under `practice/` with attribution and limitations.

## Remaining gaps

- Bitcoin dynamic-allocation capstone: description and methods confirmed; original implementation not recovered.
- Construction scheduling: report source recovered; standalone MATLAB script not recovered.
- Square-root Monte Carlo: component R code recovered; the final consolidated experiment file not recovered.
- Some original datasets, expired attachments, hidden branches, and earlier versions may not be accessible through the current search.

This inventory does not claim a complete lifetime export of all ChatGPT code. The remaining labels describe retrieval status, not evidence that the original files never existed. Search results, recent-turn summaries, and a single rendered conversation window are not exhaustive. The square-root report appendix was checked and contains a procedure outline rather than the final R source. New replacement implementations are not labeled as recovered originals.

## Publication treatment

Original files are preserved locally. A private local audit maps originals to public copies; it is not uploaded. Public notebooks contain code and headings, with outputs, embedded datasets, and metadata removed. Restricted datasets, full review text, private correspondence, account records, credentials, and personal records are excluded.

## Material held locally after publication review

The loan-approval report source contains course-derived result details and collaborator names. It is retained locally and is not included in the public repository. Its computational MATLAB code is included with a configurable input path.
