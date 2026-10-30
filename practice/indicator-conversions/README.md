# Historical indicator conversion source

Recovered from two archived June 2025 conversations. These are AI-assisted adaptations of a user-supplied external formula historically called 黑龙狙击 / 狙击. Original authorship of that formula is not claimed. The source `.fml` database and conversation text are not bundled.

| File | Material |
| --- | --- |
| [historical_01.py](historical_01.py) | Dependent fragment or illustrative example |
| [historical_02.py](historical_02.py) | Historical implementation |
| [historical_03.py](historical_03.py) | Dependent fragment or illustrative example |
| [historical_04.pine](historical_04.pine) | Historical implementation |
| [historical_05.txt](historical_05.txt) | Dependent fragment or illustrative example |
| [historical_06.txt](historical_06.txt) | Dependent fragment or illustrative example |
| [historical_07.pine](historical_07.pine) | Historical implementation |
| [historical_08.txt](historical_08.txt) | Dependent fragment or illustrative example |
| [historical_09.txt](historical_09.txt) | Dependent fragment or illustrative example |
| [historical_10.pine](historical_10.pine) | Dependent fragment or illustrative example |
| [historical_11.pine](historical_11.pine) | Historical implementation |
| [historical_12.pine](historical_12.pine) | Dependent fragment or illustrative example |
| [historical_13.txt](historical_13.txt) | Dependent fragment or illustrative example |
| [historical_14.txt](historical_14.txt) | Dependent fragment or illustrative example |
| [historical_15.txt](historical_15.txt) | Dependent fragment or illustrative example |

## Limits

The Python implementation accepts caller-provided OHLC data; no market data is bundled. Short examples with ellipses require real input. The Pine v5 drafts contain a floating EMA period (`2.5`), which was identified as a compile error in the original conversation. A later full v6 variant replaces that period with `3`. The KDJ smoothing differs between the Python and Pine variants, so their signals should not be assumed identical. The user reported no visible signals; the strict combined conditions were not independently validated. Pine scripts have not been compiled in TradingView here. These files preserve historical work, not verified trading performance.
