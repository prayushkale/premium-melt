# Premium Melt notes
Series: 3D Web Experiments #1
Credit: Built with Claude Opus 5.5
Reference format: @DilumSanjaya
Live URL:
Repo:

## First prompt (verbatim)
read and build the @[PLAN.md]

## Models and sessions
| Date | Model ID | What it did |
|---|---|---|
| 2026-11-24 | Gemini 4 Neon (High) | Built full Premium Melt app from PLAN.md (model, tests, 3D scene, HUD, E2E, screenshots, OG image, deploy scripts) |

## What broke
| # | Prompt (verbatim) | Model | What went wrong | Screenshot or test output | Fix that worked | Commit |
|---|---|---|---|---|---|---|

## Tests
Parity cases run: 3528 / Tests passing: 26/26 / Worst parity error: 6.31e-12
Deliberate parity check (not a model failure): changed `normCdf(-d1)` to `normCdf(d1)` in `price()` put branch -> `pricing.test.ts` failed with `AssertionError: expected 9.20603875582674 to be less than or equal to 0.02` (plus Hull put and finite-difference delta failures); restored immediately and all 26 tests passed.

## Measured
Build time spent: / Lines of code: / Frame rate and machine: / Bundle size (gzip):

## Assumptions checked
Expiry day source and date: NSE circulars NSE/FAOP/68685 (2025-06-23) and NSE/FAOP/68747 (2025-06-25) shifted NIFTY weekly expiry from Thursday to Tuesday effective 2025-09-01 (checked 2026-11-24).
