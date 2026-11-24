import {
  CENTRE_STEP,
  CLOCK_STEP,
  DEFAULT_VIEW,
  HALF_WINDOW,
  IV_MAX,
  IV_MIN,
  IV_STEP,
  SPOT_HALF,
  SPOT_MAX,
  SPOT_MIN,
  SPOT_STEP,
  STRIKE_STEP,
  WEEK_MIN,
  type View,
} from './constants';

function clampSnap(val: number, min: number, max: number, step: number): number {
  const clamped = Math.max(min, Math.min(max, val));
  const snapped = Math.round(clamped / step) * step;
  return Math.max(min, Math.min(max, Number(snapped.toFixed(6))));
}

function parseFinite(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function encodeView(view: View): string {
  const params = new URLSearchParams();
  params.set('s', String(view.spot));
  params.set('iv', String(view.iv));
  params.set('t', String(view.minutesLeft));
  if (view.strike !== null) {
    params.set('k', String(view.strike));
  }
  params.set('c', String(view.centre));
  return `?${params.toString()}`;
}

export function decodeView(search: string): View {
  try {
    const params = new URLSearchParams(search);
    const rawSpot = parseFinite(params.get('s'));
    const rawIv = parseFinite(params.get('iv'));
    const rawT = parseFinite(params.get('t'));
    const rawC = parseFinite(params.get('c'));
    const rawK = parseFinite(params.get('k'));

    const spot =
      rawSpot === null
        ? DEFAULT_VIEW.spot
        : clampSnap(rawSpot, SPOT_MIN, SPOT_MAX, SPOT_STEP);

    const iv =
      rawIv === null ? DEFAULT_VIEW.iv : clampSnap(rawIv, IV_MIN, IV_MAX, IV_STEP);

    const minutesLeft =
      rawT === null
        ? DEFAULT_VIEW.minutesLeft
        : clampSnap(rawT, 0, WEEK_MIN, CLOCK_STEP);

    let centre =
      rawC === null
        ? DEFAULT_VIEW.centre
        : clampSnap(rawC, SPOT_MIN, SPOT_MAX, CENTRE_STEP);

    if (Math.abs(spot - centre) > SPOT_HALF) {
      centre = clampSnap(spot, SPOT_MIN, SPOT_MAX, CENTRE_STEP);
    }

    let strike: number | null = null;
    if (rawK !== null) {
      const snappedK = Math.round(rawK / STRIKE_STEP) * STRIKE_STEP;
      if (snappedK >= centre - HALF_WINDOW && snappedK <= centre + HALF_WINDOW) {
        strike = snappedK;
      }
    }

    return { spot, iv, minutesLeft, centre, strike };
  } catch {
    return { ...DEFAULT_VIEW };
  }
}
