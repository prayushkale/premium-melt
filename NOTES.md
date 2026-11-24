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
| 1 | read and build the @[PLAN.md] | Gemini 4 Neon (High) | Initial camera `[-8, 8.5, 18]` sat too close: front strike labels and "NIFTY strikes" clipped behind bottom clock bar, and left height ticks were off-frame | `shots/broken-01-camera-framing.png` | Pulled camera back to `[-6.5, 12.2, 26.5]` (fov 40) targeting `[-0.3, 0.4, 0.6]` and extended fog range | pending |
| 2 | read and build the @[PLAN.md] | Gemini 4 Neon (High) | At IV 30% (₹430.90), additive crestGlow + Bloom washed the ridge crest out to flat white and clipped the peak at top | `shots/broken-02-iv30-bloom-washout.png` | Lowered crestGlow to 0.08, raised Bloom luminanceThreshold to 0.96, lowered intensity to 0.25 | pending |
| 3 | read and build the @[PLAN.md] | Gemini 4 Neon (High) | Abramowitz-Stegun 7.1.26 approximation error (+4.2e-8 at x=0.006365) shifted S=K=26,000 weekly ATM premium from ₹186.7340 to ₹186.7351 (rounding to ₹186.74) | `e2e/smoke.spec.ts` Expected "₹186.73", Received "₹186.74" | Used exact Taylor series for `|x| < 0.05` before A-S 7.1.26 in `erf()`, restoring exact ₹186.73 | pending |

## Tests
Parity cases run: 3528 / Tests passing: 26/26 / Worst parity error: 6.31e-12
Deliberate parity check (not a model failure): changed `normCdf(-d1)` to `normCdf(d1)` in `price()` put branch -> `pricing.test.ts` failed with `AssertionError: expected 9.20603875582674 to be less than or equal to 0.02` (plus Hull put and finite-difference delta failures); restored immediately and all 26 tests passed.

## Measured
Build time spent: ~23 minutes (automated session) / Lines of code: 3,088 (`src/`) / Frame rate and machine: pending Chrome Performance check on Apple Silicon Mac (on-demand WebGL rendering) / Bundle size (gzip): 364.0 kB JS + 9.9 kB CSS + 0.7 kB HTML

## Assumptions checked
Expiry day source and date: NSE circulars NSE/FAOP/68685 (2025-06-23) and NSE/FAOP/68747 (2025-06-25) shifted NIFTY weekly expiry from Thursday to Tuesday effective 2025-09-01 (checked 2026-11-24).
