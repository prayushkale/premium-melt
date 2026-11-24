# DESIGN.md — Premium Melt

## Core concept
**Premium is heat.** Option premium at the start of the NIFTY weekly expiry forms a tall, molten ridge centered on spot. As the expiry clock runs toward Tuesday 15:30 IST, time value drains out and the ridge cools into dark volcanic rock.

## Palette
- **Canvas & fog:** `#07090c` (deep matte obsidian, seamless fog blend)
- **HUD surfaces:** `#0d1217` solid fill, `1px solid #1e2830` hairline border, `4px` border radius (no frosted glass, no backdrop blur, no purple gradients)
- **Height heat ramp (₹0 → ₹250+):**
  1. `#10242b` — cooled slate-teal rock (₹0 / deep OTM / expired)
  2. `#1f5a5e` — warm deep teal (lower slopes)
  3. `#c2491d` — ember rust (mid premium)
  4. `#ff9a3c` — molten amber (high premium near ATM)
  5. `#fff0c9` — incandescent crest (peak weekly ATM premium)
- **Typography:** `#e9e4d8` primary warm parchment, `#8d938f` muted ash
- **Accent:** `#ff9a3c` reserved strictly for the expiry clock handle and the planted strike flag (plus the hot spot-line seam on the terrain)

## Typography
- Single family: **IBM Plex Sans Condensed** (weights 400, 500, 600), self-hosted via `@fontsource/ibm-plex-sans-condensed`.
- `font-variant-numeric: tabular-nums` globally so ticking premiums, Greeks, and timestamps never jitter horizontally.
- Sentence case everywhere. No all-caps eyebrows, no wide-tracked micro-labels, no serif display face, no emojis.

## Layout
Full-bleed interactive 3D viewport (`100vw × 100dvh`). Controls anchor cleanly to the perimeter so the glowing ridge commands the upper two thirds of the frame.

```
┌────────────────────────────────────────────────────────────────────┐
│ [TopBar: title, subtitle, notice]          [Copy link · credit]    │
│                                                                    │
│  [Sliders: Spot + IV]                              [FlagCard]      │
│                                                                    │
│                      3D NIFTY Premium Ridge                        │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ [ExpiryClock: time left, IST, ATM, % melted, Tue───Tue slider] │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

- **Desktop (1440×900, 1280×720):** Top bar spans the top edge; Spot/IV controls float top-left below the bar; Flag card floats top-right below the bar; Expiry clock spans the bottom edge.
- **Phone (390×844):** Camera pulls back so the ridge clears the HUD; Top bar stays compact with the advice notice visible; Spot/IV sit cleanly in a slim row; Flag card becomes a compact sheet anchored directly above the bottom clock with zero overlap.

## Interaction & motion principles
- **Fixed vertical scale:** `premium * 0.02` world units, never autoscaled, so the melt reads honestly against ₹100–₹400 height ticks and the start-of-week ghost profile.
- **On-demand rendering:** `frameloop="demand"` renders only on user input, keeping idle GPU usage at zero and slider drags smooth near 60 fps.
- **Tactile feedback:** The expiry clock handle uses a 44px touch target and cools smoothly in color from `#ff9a3c` toward `#1f5a5e` as remaining time drains to zero.
- **Keyboard & focus:** All interactive controls expose crisp visible focus rings (`2px solid #ff9a3c`, `2px` offset) and a keyboard button ("Flag the ATM strike") mirrors terrain click selection.
