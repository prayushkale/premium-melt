import { describe, expect, it } from 'vitest';
import {
  COLS,
  DEFAULT_VIEW,
  HALF_WINDOW,
  ROWS,
  X_PER_POINT,
  type View,
} from './constants';
import { otmPremium } from './pricing';
import { fillHeights, rowFraction, snapStrike, strikeAt } from './terrain';

describe('terrain', () => {
  it('computes dense-near-expiry row fractions', () => {
    expect(rowFraction(0)).toBe(0);
    expect(rowFraction(ROWS - 1)).toBe(1);
    expect(rowFraction(1) - rowFraction(0)).toBeLessThan(
      rowFraction(ROWS - 1) - rowFraction(ROWS - 2),
    );
  });

  it('fills expiry row with zeros and keeps all heights finite and non-negative', () => {
    const out = new Float32Array(COLS * ROWS);
    fillHeights(out, DEFAULT_VIEW);

    for (let i = 0; i < COLS; i++) {
      expect(out[i]).toBe(0);
    }
    for (let idx = 0; idx < out.length; idx++) {
      expect(Number.isFinite(out[idx])).toBe(true);
      expect(out[idx]).toBeGreaterThanOrEqual(0);
    }
  });

  it('places the last-row peak at the spot column and matches otmPremium', () => {
    const view: View = { ...DEFAULT_VIEW, spot: 26_350 };
    const out = new Float32Array(COLS * ROWS);
    fillHeights(out, view);

    const lastRowOffset = (ROWS - 1) * COLS;
    let peakCol = 0;
    let peakVal = -1;
    for (let i = 0; i < COLS; i++) {
      const val = out[lastRowOffset + i];
      const expected = otmPremium(
        view.spot,
        strikeAt(i, view.centre),
        view.iv / 100,
        view.minutesLeft,
      );
      expect(val).toBeCloseTo(expected, 4);
      if (val > peakVal) {
        peakVal = val;
        peakCol = i;
      }
    }
    expect(strikeAt(peakCol, view.centre)).toBe(view.spot);
  });

  it('returns all zeros when minutesLeft is 0', () => {
    const out = new Float32Array(COLS * ROWS);
    fillHeights(out, { ...DEFAULT_VIEW, minutesLeft: 0 });
    for (let idx = 0; idx < out.length; idx++) {
      expect(out[idx]).toBe(0);
    }
  });

  it('never increases any height as the clock moves toward expiry', () => {
    const times = [10_080, 5_040, 1_440, 60, 0];
    let prev: Float32Array | null = null;
    for (const minutesLeft of times) {
      const cur = new Float32Array(COLS * ROWS);
      fillHeights(cur, { ...DEFAULT_VIEW, minutesLeft });
      if (prev) {
        for (let idx = 0; idx < cur.length; idx++) {
          expect(cur[idx]).toBeLessThanOrEqual(prev[idx] + 1e-5);
        }
      }
      prev = cur;
    }
  });

  it('snaps world x to nearest 50 strike and clamps at both edges', () => {
    const centre = 26_000;
    expect(snapStrike(0, centre)).toBe(26_000);
    expect(snapStrike(124 * X_PER_POINT, centre)).toBe(26_100);
    expect(snapStrike(126 * X_PER_POINT, centre)).toBe(26_150);
    expect(snapStrike(-999, centre)).toBe(centre - HALF_WINDOW);
    expect(snapStrike(999, centre)).toBe(centre + HALF_WINDOW);
  });
});
