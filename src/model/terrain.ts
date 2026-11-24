import {
  COLS,
  COL_STEP,
  HALF_WINDOW,
  ROWS,
  STRIKE_STEP,
  X_PER_POINT,
  type View,
} from './constants';
import { otmPremium } from './pricing';

export function rowFraction(j: number): number {
  const u = j / (ROWS - 1);
  return u * u;
}

export function strikeAt(i: number, centre: number): number {
  return centre - HALF_WINDOW + i * COL_STEP;
}

export function fillHeights(out: Float32Array, v: View): void {
  const vol = v.iv / 100;
  for (let j = 0; j < ROWS; j++) {
    const rowMin = v.minutesLeft * rowFraction(j);
    const rowOffset = j * COLS;
    if (rowMin <= 0) {
      out.fill(0, rowOffset, rowOffset + COLS);
      continue;
    }
    for (let i = 0; i < COLS; i++) {
      const K = strikeAt(i, v.centre);
      out[rowOffset + i] = otmPremium(v.spot, K, vol, rowMin);
    }
  }
}

export function snapStrike(x: number, centre: number): number {
  const raw = centre + x / X_PER_POINT;
  const snapped = Math.round(raw / STRIKE_STEP) * STRIKE_STEP;
  const minStrike = centre - HALF_WINDOW;
  const maxStrike = centre + HALF_WINDOW;
  return Math.max(minStrike, Math.min(maxStrike, snapped));
}
