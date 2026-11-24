# PLAN.md: Premium Melt

An explorable 3D landscape of one NIFTY weekly expiry. Strikes run left to right, time to expiry runs front to back, and height is the option premium from Black-Scholes. Drag the expiry clock and the ridge melts.

All decisions are made. Build only what is here. The one pause is a single go-ahead before the first public deploy (section 5), because it creates resources in the creator's accounts.

---

## 1. Context

**What:** one static page. A glowing terrain shows the out-of-the-money (OTM) premium at every strike for the rest of the week. Controls: an expiry clock, spot, implied volatility (IV) and a flag for any strike. The URL stores the view.

**Who:** Prayush Kale (X: @prayushkale), senior full-stack engineer in Nagpur, India, who builds AI coding agents and Indian equity-market tools. The page should show real shipped work, explained plainly.

**Reference post (format only):** @DilumSanjaya, "Asked GPT-6 Astra to create a highly detailed, interactive visualization…"

**Pattern:** Launch-day model test. The model is named in the first line, one interactive result fills the video, and a link lets the reader try it. Copy the post's shape, not the author's visuals, subject or code.

**Series:** 3D Web Experiments #1.

**Live trend:** none. No model release appeared in the last 48 hours of researched trends. Borrow the format without claiming a launch. Never write "just dropped", "new model" or similar.

**Why it should spread:** labs repost work that names their model in line one, and options traders share a link that opens on their own spot, IV and strike.

**Hook (verbatim):**
> Asked Claude Opus 5.5 to build a 3D landscape of a NIFTY weekly expiry. Drag the clock and watch the option premium melt. Link to try it:

**Demo shot:** Camera sits over a glowing mountain ridge labelled NIFTY strikes. A cursor drags the clock toward expiry and the whole ridge melts almost flat.

### Model decisions

| Decision | Value | Reason |
|---|---|---|
| Height | `min(call, put)`, the OTM premium | Calls alone form a ramp because of intrinsic value. OTM premium forms a ridge at spot and reaches zero at expiry |
| Interest rate and dividends | 0 in the app | Puts the ridge exactly on spot. The pricing function still takes `r`, so tests can check parity with discounting |
| IV | One flat number for all strikes | Teaching model: no smile or skew |
| Time | Calendar minutes / 525,600 | Simple and stated on the page. Real markets treat nights and weekends differently |
| Expiry | Tuesday 15:30 IST | Current NIFTY weekly schedule as far as this plan knows. Check NSE before launch; if it changed, edit one constant and its tests |
| Clock | 10,080 minutes (7 days) to 0, 15-minute steps | One weekly cycle |
| Depth axis | Front edge = expiry, back edge = now. Row `u` has `minutesLeft * u` left | The terrain maps the option's remaining life. Moving the clock lowers every row |
| Strikes | Window centre ±1,200; flags snap to 50 | NIFTY strike step |
| Spot | Window centre ±800, step 10; default 26,000 | A round teaching number, never presented as a quote |
| IV range | 8% to 30%, step 0.5, default 13% | Ridge stays in frame |
| Height scale | Fixed: `premium * 0.02` world units | Never autoscale, or the melt disappears |
| Units | Rupees per unit of the option | No lot sizes, which change |

Visible on the page at all times: **"Teaching model, not advice. Not affiliated with NSE."**

---

## 2. Stack and setup

TypeScript, React Three Fiber, Three.js and AWS (S3 + CloudFront). Development tooling: Vite, Vitest, Playwright. No backend, analytics, state library, CSS framework or paid assets. Everything in the scene is procedural, so fal and Blender are not needed.

Start the session with `claude --model claude-opus-5-5` so the credit is true. If another model does any of the work, log it in `NOTES.md`.

Run in the project folder, which contains only this file. Do not use a Vite scaffold command: it prompts or overwrites in a non-empty folder.

```bash
git init -b main
npm init -y
npm pkg set name=premium-melt type=module scripts.dev="vite" scripts.test="vitest run" \
  scripts.build="tsc --noEmit && vite build" scripts.preview="vite preview --port 4173" \
  scripts.e2e="playwright test"
npm pkg set private=true --json
npm pkg delete main
npm i react react-dom three @react-three/fiber @react-three/drei @react-three/postprocessing @fontsource/ibm-plex-sans-condensed
npm i -D typescript vite @vitejs/plugin-react vitest @playwright/test @types/node @types/react @types/react-dom @types/three
npx playwright install chromium
mkdir -p src/model src/scene src/ui e2e scripts public shots demo
```

If npm reports a peer conflict, use Context7 to find the React, R3F, drei and postprocessing versions that work together, pin them, and log it. Do not use `--force`.

### Files

```
PLAN.md  NOTES.md  DESIGN.md  .gitignore
index.html  tsconfig.json  vite.config.ts  playwright.config.ts
public/og.png
scripts/deploy-setup.sh  scripts/deploy.sh
src/main.tsx  src/App.tsx  src/styles.css  src/vite-env.d.ts
src/model/constants.ts
src/model/pricing.ts   pricing.test.ts
src/model/terrain.ts   terrain.test.ts
src/model/clock.ts     clock.test.ts
src/model/explain.ts   explain.test.ts
src/model/viewUrl.ts   viewUrl.test.ts
src/scene/Scene.tsx  Terrain.tsx  terrainShader.ts  Axes.tsx  label.ts  Flag.tsx  GhostLine.tsx
src/ui/ExpiryClock.tsx  Sliders.tsx  FlagCard.tsx  TopBar.tsx
e2e/smoke.spec.ts
shots/  demo/
```

---

## 3. Build steps

Commit after each step. Screenshots go in `shots/` as `NN-name.png`. Keep screenshots of broken versions, because the thread needs them.

### Saturday morning: model

**Step 1. Project files and notes.**
- `NOTES.md`: use the template in section 7. Paste the exact message that started this session under "First prompt".
- `.gitignore`: `node_modules`, `dist`, `.deploy.env`, `test-results`, `playwright-report`, `demo/*.mov`.
- `tsconfig.json`: strict; `target` ES2022; `module` ESNext; `moduleResolution` bundler; `jsx` react-jsx; `noEmit`; `skipLibCheck`; include `src`.
- `vite.config.ts`: `defineConfig` from `vitest/config`, the React plugin, `test: { include: ['src/**/*.test.ts'] }`.
- `src/vite-env.d.ts`: `/// <reference types="vite/client" />`.
- `index.html`: title "Premium Melt: a NIFTY weekly expiry in 3D", `#root`, viewport meta, the script tag for `src/main.tsx`, an inline SVG data-URI favicon, and Open Graph plus `twitter:card=summary_large_image` tags. The image is `%VITE_SITE_URL%/og.png` (Vite substitutes env values in HTML).
- `src/main.tsx`: mounts `App`, imports `styles.css` and font weights 400, 500 and 600.
- `src/App.tsx`: placeholder for now.
- Check: `npm run dev` opens with no console errors.

**Step 2. Constants: `src/model/constants.ts`.**
```ts
export const WEEK_MIN = 10_080, YEAR_MIN = 525_600, CLOCK_STEP = 15;
export const STRIKE_STEP = 50, HALF_WINDOW = 1_200, COL_STEP = 10;
export const SPOT_HALF = 800, SPOT_STEP = 10, CENTRE_STEP = 500;
export const IV_MIN = 8, IV_MAX = 30, IV_STEP = 0.5;
export const COLS = 241, ROWS = 61;          // 10-point columns: every legal spot lands on a vertex
export const X_PER_POINT = 0.01, Y_PER_RUPEE = 0.02, Z_FRONT = 7, Z_BACK = -7;
export const EXPIRY = { day: 2, hour: 15, minute: 30 }; // Tuesday 15:30 IST
export const DEFAULT_VIEW = { spot: 26_000, iv: 13, minutesLeft: WEEK_MIN, centre: 26_000, strike: null };
```

**Step 3. Pricing, test first: `pricing.test.ts`, then `pricing.ts`.** Run the tests and see them fail before implementing.

Tests:
1. CDF: N(0)=0.5, N(1)=0.8413447, N(1.96)=0.9750021, N(-1.96)=0.0249979, within 1e-6.
2. Textbook case: S=42, K=40, r=0.10, vol=0.20, T=0.5 gives call 4.76 and put 0.81, within 0.01.
3. Put-call parity: `call - put` equals `S - K*exp(-r*T)` within 0.02, over spot 25,200/26,000/26,800, every 50 strike from 24,800 to 27,200, vol 8/13/30%, minutes 15/60/1,440/10,080 and r 0/0.06.
4. Melt numbers, S=K=26,000, vol 13%, r=0: 10,080 min gives 186.73; 1,440 gives 70.58; 60 gives 14.41; 0 gives 0. Within 0.01.
5. At T=0, price is intrinsic, theta is 0, and delta is 0, ±1, or ±0.5 exactly at the strike. No NaN.
6. Delta matches a central difference in spot (h=10 points) within 0.01. Theta matches a central difference in time (h=60 minutes) within 2% at the money with at least 1 day left.

Parity alone is not proof. It can pass with a wrong CDF, because the CDF's symmetry cancels the error. Tests 1 and 2 exist for that reason; this is a good point for the thread.

Implementation:
```ts
export type Side = 'CE' | 'PE';
export function normCdf(x: number): number
export function price(side: Side, S: number, K: number, vol: number, T: number, r = 0): number
export function delta(side: Side, S: number, K: number, vol: number, T: number, r = 0): number
export function thetaPerYear(side: Side, S: number, K: number, vol: number, T: number, r = 0): number
export function otmSide(S: number, K: number): Side          // K >= S ? 'CE' : 'PE'
export function otmPremium(S: number, K: number, vol: number, minutesLeft: number): number
```
- `normCdf`: Abramowitz-Stegun 7.1.26 erf with p=0.3275911, a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429. Then `N(x) = 0.5 * (1 + erf(x / sqrt(2)))`.
- Compute call and put with separate formulas. Do not derive the put from parity, or the parity test proves nothing.
- Clamp prices at 0. `vol` is a fraction (0.13); the UI holds a percentage.
- With `r = 0`, call theta and put theta are equal: `-S * phi(d1) * vol / (2 * sqrt(T))`.

**Step 4. Terrain, test first: `terrain.test.ts`, then `terrain.ts`.**
```ts
export function rowFraction(j: number): number              // (j/(ROWS-1))**2: dense near expiry
export function strikeAt(i: number, centre: number): number // centre - HALF_WINDOW + i*COL_STEP
export function fillHeights(out: Float32Array, v: View): void // row-major, rupees; row 0 = expiry
export function snapStrike(x: number, centre: number): number // world x to nearest 50, clamped
```
Put the shared `View` type (`spot, iv, minutesLeft, centre, strike`) in `constants.ts`. Tests: the expiry row is all 0; all values are finite and >= 0; the last-row peak is at the spot column; the last row matches `otmPremium`; `minutesLeft=0` gives all zeros; heights never increase as the clock moves toward expiry; `snapStrike` clamps at both edges.

**Step 5. Clock, test first: `clock.test.ts`, then `clock.ts`.**
- `wallTime(min)`: 10080 is "Tue 15:30", 1440 is "Mon 15:30", 60 is "Tue 14:30", 6375 is "Fri 05:15". Use plain arithmetic on `EXPIRY`, so no browser time zone is involved.
- `timeLeft(min)`: "6d 4h 15m", "45m", "Expired".
- `thetaDisplay(thetaYear, min)` returns `{ value, unit }`: per day at 1,440 min or more, per hour from 60 to 1,439, per minute below 60. One hour before expiry the ATM premium is about ₹14 while standard theta reads about -₹173 a day, which is correct maths and useless to a reader.

**Step 6. "Why did this fall?", test first: `explain.test.ts`, then `explain.ts`.**
- `type Baseline = { spot; iv; minutesLeft; from: 'flag' | 'week' }`.
- Track the leg that was OTM at the baseline. Reprice in order: time, then spot, then IV. Each difference is that cause's share.
- `attribute(...)` returns `{ side, total, time, spot, iv }`; parts sum to the total within 1e-6.
- `explainLine(...)` copy rules: largest part first; leave out parts smaller than ₹0.05; negative parts "took", positive parts "added".
  - Fell: `26,000 CE fell ₹172.33 since the week began: time took ₹172.33.`
  - Rose: `26,100 CE rose ₹64.20 since you planted the flag: spot added ₹80.10, time took ₹15.90.` (example format, not a fixture)
  - No change: `Nothing has moved yet. Drag the clock.`
  - Append `Expired worthless.` when expired with zero value.
- Test each branch, plus the 26,000 case from 10,080 to 60 minutes (contains "fell ₹172.3").

**Step 7. URL, test first: `viewUrl.test.ts`, then `viewUrl.ts`.**
- Format: `?s=26000&iv=13&t=10080&k=26100&c=26000`. `c` is the strike-window centre, so a shared view looks the same. Omit `k` with no flag.
- `encodeView(view)` and `decodeView(search)`. Decoding never throws: missing or non-numeric values use defaults; values clamp and snap to their steps; spot is limited to 10,000 to 50,000; if spot is more than 800 from `c`, set `c` to spot rounded to 500; drop `k` if outside the window.
- Tests: round trip, empty string, junk, out-of-range values, missing `c`, invalid strike.

Run `npm test`; all green. Commit.

### Saturday afternoon: scene

Invoke `threejs-game-director` for steps 8 to 11; it routes to the other `threejs-*` skills. Check current R3F, drei, postprocessing and Three.js APIs in Context7 first. Use the threejs-devtools MCP, if connected, to inspect the live scene.

**Step 8. `DESIGN.md`.** Idea: premium is heat. Tall terrain is molten; as it loses height it cools to dark rock.
- Background `#07090c`; fog the same colour. Height ramp: `#10242b`, `#1f5a5e`, `#c2491d`, `#ff9a3c`, `#fff0c9`.
- Text `#e9e4d8`, muted `#8d938f`. Accent `#ff9a3c` only for the clock handle and flag.
- IBM Plex Sans Condensed throughout, tabular numbers, sentence case. No purple gradients, frosted glass, emoji, serif display face or tiny wide-tracked caps.
- Full-bleed canvas with HUD controls at the edges. Solid dark panels, 4px radius.

**Step 9. Terrain: `terrainShader.ts`, `Terrain.tsx`.**
- One indexed `BufferGeometry`, COLS x ROWS. x = `(strike - centre) * X_PER_POINT`; z runs from `Z_FRONT` (expiry) to `Z_BACK` (now) by `rowFraction`; y = rupees * `Y_PER_RUPEE`.
- On view change, run `fillHeights`, write y, set `position.needsUpdate`, call `computeVertexNormals()`, `computeBoundingSphere()` and `invalidate()`. Reuse arrays. A stale bounding sphere makes clicks miss.
- `shaderMaterial`: height ramp over ₹0 to ₹250, soft directional light from normals, strike lines every 100 with brighter lines every 500 (using `fwidth`), contour lines every ₹25, and a hot line along x = spot. Memoise the uniforms object. End the fragment shader with `#include <tonemapping_fragment>` and `#include <colorspace_fragment>`.

**Step 10. Scene: `Scene.tsx`, `Axes.tsx`, `label.ts`, `GhostLine.tsx`.**
- `Canvas` with `dpr={[1,2]}`, `frameloop="demand"`, starting camera `[-8, 8.5, 18]`, fov 38, looking at `[0, 1.2, 0]`. Tune by screenshot so the full ridge fills the upper two thirds.
- drei `OrbitControls`: no pan, polar 0.5 to 1.45, azimuth ±1.2, distance 12 to 34.
- Bloom through `@react-three/postprocessing`, only when the pointer is not coarse.
- `label.ts`: text drawn to a canvas texture after `document.fonts.ready`, at double resolution. No CDN font fetch.
- `Axes.tsx`: strike numbers every 200 on the front edge, a large "NIFTY strikes" label, "Expiry" at the front, "Now" at the back, and height ticks at ₹100, ₹200, ₹300 and ₹400. Dispose textures on change.
- `GhostLine.tsx`: a thin line above the back edge showing the start-of-week profile at the current spot and IV, so the melted amount is visible.
- If WebGL is unavailable, show: "This page needs WebGL to draw the terrain."
- Screenshot full week, 1 day left, 1 hour left, expired. Fix and repeat.

**Step 11. Flag: `Flag.tsx`.**
- Terrain `onClick`: ignore when `e.delta > 4` (that was an orbit drag), then `snapStrike(e.point.x, centre)`.
- Pole and pennant at the strike on the "Now" edge, resting on the terrain and dropping with it. Label shows the strike.

### Sunday morning: controls and state

Use the `frontend-design` skill for steps 12 to 14 and follow `DESIGN.md`.

**Step 12. `App.tsx` state.**
- Initialise `View` from `decodeView(location.search)`; keep `baseline` in state. A new flag sets the baseline to the current spot, IV and time. A flag loaded from the URL uses its spot and IV at the start of the week.
- Write the URL with `history.replaceState`, debounced 250 ms. Safari throws on rapid calls.
- Render order: canvas, top bar, sliders, flag card, clock.

**Step 13. Clock and sliders.**
- `ExpiryClock.tsx`: full-width bottom control. Native `<input type="range">` of elapsed minutes, left = week start, right = expiry, label "Expiry clock", `aria-valuetext` such as "1d 0h 0m left, Mon 15:30". Day ticks Tue to Tue, a large handle (44px touch target) that cools in colour with time. Beside it: time left, wall time with "IST", nearest-50 ATM strike, its premium, and "92% melted" compared with the week start at the same spot and IV.
- `Sliders.tsx`: spot range (centre ±800) plus a number field that recentres the strike window on commit; IV range. Recentre drops a flag that leaves the window. A small line reads "Flat IV, zero rates, calendar time".

**Step 14. Flag card and top bar.**
- `FlagCard.tsx`: strike with -50 and +50 buttons, a remove button, and CE and PE columns with premium, delta and theta (from `thetaDisplay`). Mark the OTM column "on terrain". Below: heading "Why did this fall?" (or "Why did this rise?") and the line from `explainLine`.
- With no flag, show "Click any strike to plant a flag" and a "Flag the ATM strike" button, so keyboard users have a path.
- `TopBar.tsx`: "Premium Melt", "One NIFTY weekly expiry, priced with Black-Scholes", a "Copy link" button that changes to "Link copied" (on clipboard failure, show the URL in a selected text field), the advice notice, and "Built with Claude Opus 5.5 by @prayushkale".
- Copy link must write the current URL immediately, not wait for the debounce.

**Step 15. Responsive pass.** `styles.css`: visible focus states; no overlap at 1440x900, 1280x720 and 390x844. On phones the flag card becomes a compact sheet above the clock and the camera moves back. The advice notice stays visible. Use `impeccable` for one polish pass, then screenshot, fix and repeat.

**Step 16. Browser test: `playwright.config.ts`, `e2e/smoke.spec.ts`.**
Config: `testDir: 'e2e'`, build then `npm run preview` as web server on port 4173, Chromium with `--use-angle=metal` on macOS. If the canvas is blank headless, run headed and log it.
1. Default page: canvas visible, no console errors, ATM premium ₹186.73.
2. `?s=26000&iv=13&t=60&k=26000&c=26000`: ₹14.41, "92% melted", "fell ₹172.3".
3. Focus the clock and press End: "Expired", ATM premium ₹0.00.
4. Click the terrain: flag card appears and the URL gains `k`.
5. Raise IV: the ATM premium rises.
6. Copy link, open that URL in a new page: the same spot, IV, strike and time.
7. Junk parameters: the page loads with defaults.
8. Save screenshots of every view in section 6 to `shots/`.

**Step 17. Social image.** Capture a 1200x630 default view as `public/og.png`, ridge and strike labels legible.

---

## 4. Demo recording

Record the deployed page, 20 to 24 seconds, no sound needed. The creator records it by hand, because scripted browsers do not show a real cursor.

1. Open a clean window:
```bash
open -na "Google Chrome" --args --app="$SITE_URL" --window-size=1280,720
```
2. Hide notifications. Place the cursor on the clock handle.
3. Press Cmd+Shift+5, choose Record Selected Portion around the window, turn on Show Mouse Pointer, and record.

| Seconds | Action |
|---|---|
| 0-2 | Full glowing ridge with "NIFTY strikes" in frame, cursor already on the handle. Drag starts by 0.3s; the ridge is almost flat by 2s |
| 2-5 | Drag back to the week start |
| 5-9 | Raise IV from 13 to 22, then return it |
| 9-13 | Plant a flag near 26,100; the card appears |
| 13-19 | Drag slowly to the last hour; the "Why did this fall?" line updates |
| 19-23 | Move spot, then click Copy link |

Trim so frame one is the full ridge (install ffmpeg with `brew install ffmpeg` if missing; change `-ss` to the moment before the drag):
```bash
ffmpeg -ss 1.0 -i demo/raw.mov -t 23 -vf "scale=1920:-2,fps=60" -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart -an demo/premium-melt.mp4
ffmpeg -y -i demo/premium-melt.mp4 -vf "select='eq(n,0)+eq(n,115)'" -fps_mode vfr demo/check-%d.png
```
`check-1.png` must show the full ridge and `check-2.png` an almost flat one. If not, record again.

---

## 5. Deploy

Host: private S3 bucket behind CloudFront. It matches the stack and gives HTTPS. CloudFront's free allowance has been 1 TB out and 10 million requests a month; check the current pricing page for this account. The site is a few MB, so S3 storage should cost under a cent a month even without a free tier.

Check tools and login:
```bash
aws --version && aws sts get-caller-identity
gh auth status
```
If AWS is not signed in, ask the creator to sign in and continue afterwards. Show the account and the list (one bucket, one CloudFront distribution, one public GitHub repo) and get **one go-ahead** before creating anything.

**`scripts/deploy-setup.sh`** (run once):
```bash
#!/usr/bin/env bash
set -euo pipefail
test ! -f .deploy.env || { echo "Already set up"; exit 1; }
REGION=ap-south-1
BUCKET="premium-melt-$(openssl rand -hex 4)"
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
aws s3api create-bucket --bucket "$BUCKET" --region $REGION \
  --create-bucket-configuration LocationConstraint=$REGION
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
OAC=$(aws cloudfront create-origin-access-control --origin-access-control-config \
  "Name=$BUCKET,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
  --query OriginAccessControl.Id --output text)
TMP=$(mktemp -d)
cat > "$TMP/dist.json" <<JSON
{
  "CallerReference": "$BUCKET", "Comment": "premium-melt", "Enabled": true,
  "DefaultRootObject": "index.html", "PriceClass": "PriceClass_200",
  "Origins": { "Quantity": 1, "Items": [{
    "Id": "s3", "DomainName": "$BUCKET.s3.$REGION.amazonaws.com",
    "OriginAccessControlId": "$OAC", "S3OriginConfig": { "OriginAccessIdentity": "" } }] },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3", "ViewerProtocolPolicy": "redirect-to-https", "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6" }
}
JSON
read -r DIST_ID DOMAIN <<< "$(aws cloudfront create-distribution --distribution-config "file://$TMP/dist.json" \
  --query 'Distribution.[Id,DomainName]' --output text)"
cat > "$TMP/policy.json" <<JSON
{ "Version": "2012-10-17", "Statement": [{
  "Effect": "Allow", "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject", "Resource": "arn:aws:s3:::$BUCKET/*",
  "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT:distribution/$DIST_ID" } } }] }
JSON
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "file://$TMP/policy.json"
printf 'BUCKET=%s\nDIST_ID=%s\nSITE_URL=https://%s\n' "$BUCKET" "$DIST_ID" "$DOMAIN" > .deploy.env
aws cloudfront wait distribution-deployed --id "$DIST_ID"
cat .deploy.env
```
PriceClass_200 is deliberate: PriceClass_100 leaves out India. The policy ID is AWS's managed CachingOptimized policy; confirm it in current AWS docs. If the script stops halfway, list what was created before rerunning.

**`scripts/deploy.sh`** (every release):
```bash
#!/usr/bin/env bash
set -euo pipefail
source .deploy.env
npm test
VITE_SITE_URL="$SITE_URL" npm run build
aws s3 sync dist "s3://$BUCKET" --exclude "assets/*" --cache-control "no-cache"
aws s3 sync dist/assets "s3://$BUCKET/assets" --cache-control "public,max-age=31536000,immutable"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/" "/index.html" "/og.png"
echo "$SITE_URL"
```

Run:
```bash
chmod +x scripts/*.sh
./scripts/deploy-setup.sh
./scripts/deploy.sh
git add -A && git commit -m "Premium Melt: 3D NIFTY weekly expiry"
gh repo create premium-melt --public --source=. --push
```
Before pushing, confirm `git ls-files` has no `.deploy.env`, keys or account IDs, and that `NOTES.md` has no private details. Do not post to social media; the creator posts.

---

## 6. Verification

Do not call it done until every line has been run and seen.

- [ ] `npm test` green; the put-call parity test ran, not skipped.
- [ ] Break the put formula on purpose, see parity fail, restore it. Record the failing output in `NOTES.md` as a deliberate check, not as a model failure.
- [ ] `npm run build` and `npm run e2e` pass.
- [ ] Screenshots opened and inspected, desktop 1440x900: default, 1 day left, 1 hour left, expired, IV 8, IV 30, spot at both ends, flag card with explanation.
- [ ] Phone 390x844: default and flag card, nothing overlapping.
- [ ] Dragging the clock stays near 60 fps on the creator's Mac (Chrome Performance panel). Write the measured number in `NOTES.md`. If slow, drop Bloom before lowering grid size.
- [ ] Live URL opens in a private window with no console errors or failed requests.
- [ ] A live shared link restores spot, IV, strike and time in another browser.
- [ ] `curl -sI "$SITE_URL"` returns 200, and `curl -s "$SITE_URL" | grep og:image` shows the full image URL.
- [ ] Expiry day checked against NSE; source and date in `NOTES.md`.
- [ ] Advice notice visible in every screenshot.
- [ ] Demo check frames pass.

---

## 7. Launch notes

Update `NOTES.md` when something happens, not at the end. Record only real failures and measured numbers. If little broke, the thread says so.

```markdown
# Premium Melt notes
Series: 3D Web Experiments #1
Credit: Built with Claude Opus 5.5
Reference format: @DilumSanjaya
Live URL:
Repo:

## First prompt (verbatim)

## Models and sessions
| Date | Model ID | What it did |

## What broke
| # | Prompt (verbatim) | Model | What went wrong | Screenshot or test output | Fix that worked | Commit |

## Tests
Parity cases run: / Tests passing: / Worst parity error:

## Measured
Build time spent: / Lines of code: / Frame rate and machine: / Bundle size (gzip):

## Assumptions checked
Expiry day source and date:
```

Likely things to watch (log only if they happen): a call-only ramp in place of a ridge; terrain jitter when spot falls between vertices; clicks missing after geometry updates; theta per day exceeding the premium near expiry; washed-out Bloom colours; Safari URL-update errors.

Thread outline, written later from these notes:
1. Hook verbatim, live link, demo video.
2. The first prompt, verbatim.
3. Each version that broke: screenshot, cause, fix.
4. The test that checks prices against put-call parity, and why a CDF check was needed too.
5. One thing the melt shows: at 13% IV, the model's 26,000 ATM option goes from ₹186.73 with 7 days left to ₹70.58 with 1 day and ₹14.41 with 1 hour.
6. Model limits, repo link, **Built with Claude Opus 5.5**.

Tone: first person, plain words, real numbers, no hype verbs or emoji walls. Make no trading recommendation.

---

## 8. Out of scope

- Live or historical market data, broker APIs, scraping
- Option chains, IV smile or skew, American options, dividends, interest-rate controls
- Positions, P&L, lot sizes, multi-leg strategies, signals or advice
- BANKNIFTY, SENSEX, stocks or monthly expiries
- Accounts, backend, database, analytics, saved views beyond the URL
- Autoplay, sound, physics, guided tours, imported 3D models, VR
- Custom domain, CI pipeline, light theme, translations
- Posting to any social network

**Weekend budget:** Saturday morning steps 1-7, Saturday afternoon 8-11, Sunday morning 12-15, Sunday afternoon 16-17, deploy, verify and record. If time runs short, cut in this order: ghost line, Bloom, contour lines. Never cut the tests, the shared URL, the flag explanation, the advice notice or the live link.
