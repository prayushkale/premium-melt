import { describe, expect, it } from 'vitest';
import { YEAR_MIN } from './constants';
import { delta, normCdf, otmPremium, otmSide, price, thetaPerYear } from './pricing';

describe('pricing', () => {
  it('computes standard normal CDF accurately', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 6);
    expect(normCdf(1)).toBeCloseTo(0.8413447, 6);
    expect(normCdf(1.96)).toBeCloseTo(0.9750021, 6);
    expect(normCdf(-1.96)).toBeCloseTo(0.0249979, 6);
  });

  it('matches the Hull textbook call and put values', () => {
    const call = price('CE', 42, 40, 0.2, 0.5, 0.1);
    const put = price('PE', 42, 40, 0.2, 0.5, 0.1);
    expect(Math.abs(call - 4.76)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(put - 0.81)).toBeLessThanOrEqual(0.01);
  });

  it('satisfies put-call parity across spots, strikes, vols, times, and rates', () => {
    const spots = [25_200, 26_000, 26_800];
    const vols = [0.08, 0.13, 0.3];
    const minutesList = [15, 60, 1_440, 10_080];
    const rates = [0, 0.06];

    let count = 0;
    let worstErr = 0;

    for (const S of spots) {
      for (let K = 24_800; K <= 27_200; K += 50) {
        for (const vol of vols) {
          for (const min of minutesList) {
            const T = min / YEAR_MIN;
            for (const r of rates) {
              const call = price('CE', S, K, vol, T, r);
              const put = price('PE', S, K, vol, T, r);
              const expected = S - K * Math.exp(-r * T);
              const err = Math.abs(call - put - expected);
              if (err > worstErr) worstErr = err;
              expect(err).toBeLessThanOrEqual(0.02);
              count += 1;
            }
          }
        }
      }
    }

    expect(count).toBe(3 * 49 * 3 * 4 * 2);
    expect(worstErr).toBeLessThan(0.02);
  });

  it('matches NIFTY ATM melt numbers at S=K=26,000, vol=13%, r=0', () => {
    expect(Math.abs(otmPremium(26_000, 26_000, 0.13, 10_080) - 186.73)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(otmPremium(26_000, 26_000, 0.13, 1_440) - 70.58)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(otmPremium(26_000, 26_000, 0.13, 60) - 14.41)).toBeLessThanOrEqual(0.01);
    expect(otmPremium(26_000, 26_000, 0.13, 0)).toBe(0);
  });

  it('handles T=0 cleanly with intrinsic price, zero theta, step delta, and no NaN', () => {
    // ITM call / OTM put
    expect(price('CE', 26_200, 26_000, 0.13, 0)).toBe(200);
    expect(price('PE', 26_200, 26_000, 0.13, 0)).toBe(0);
    expect(delta('CE', 26_200, 26_000, 0.13, 0)).toBe(1);
    expect(delta('PE', 26_200, 26_000, 0.13, 0)).toBe(0);
    expect(thetaPerYear('CE', 26_200, 26_000, 0.13, 0)).toBe(0);
    expect(thetaPerYear('PE', 26_200, 26_000, 0.13, 0)).toBe(0);

    // OTM call / ITM put
    expect(price('CE', 25_800, 26_000, 0.13, 0)).toBe(0);
    expect(price('PE', 25_800, 26_000, 0.13, 0)).toBe(200);
    expect(delta('CE', 25_800, 26_000, 0.13, 0)).toBe(0);
    expect(delta('PE', 25_800, 26_000, 0.13, 0)).toBe(-1);

    // Exactly at strike
    expect(price('CE', 26_000, 26_000, 0.13, 0)).toBe(0);
    expect(price('PE', 26_000, 26_000, 0.13, 0)).toBe(0);
    expect(delta('CE', 26_000, 26_000, 0.13, 0)).toBe(0.5);
    expect(delta('PE', 26_000, 26_000, 0.13, 0)).toBe(-0.5);
    expect(thetaPerYear('CE', 26_000, 26_000, 0.13, 0)).toBe(0);
    expect(thetaPerYear('PE', 26_000, 26_000, 0.13, 0)).toBe(0);

    expect(otmSide(26_000, 26_000)).toBe('CE');
    expect(otmSide(26_000, 26_100)).toBe('CE');
    expect(otmSide(26_000, 25_950)).toBe('PE');
  });

  it('matches finite-difference approximations for delta and theta', () => {
    const S = 26_000;
    const vol = 0.13;
    const hSpot = 10;

    for (const side of ['CE', 'PE'] as const) {
      for (const K of [25_600, 26_000, 26_400]) {
        const T = 2_880 / YEAR_MIN;
        const analyticDelta = delta(side, S, K, vol, T);
        const numericDelta =
          (price(side, S + hSpot, K, vol, T) - price(side, S - hSpot, K, vol, T)) / (2 * hSpot);
        expect(Math.abs(analyticDelta - numericDelta)).toBeLessThanOrEqual(0.01);
      }

      for (const min of [1_440, 4_320, 10_080]) {
        const T = min / YEAR_MIN;
        const dT = 60 / YEAR_MIN;
        const analyticTheta = thetaPerYear(side, S, S, vol, T);
        const numericTheta =
          (price(side, S, S, vol, T - dT) - price(side, S, S, vol, T + dT)) / (2 * dT);
        const relErr = Math.abs(analyticTheta - numericTheta) / Math.abs(numericTheta);
        expect(relErr).toBeLessThanOrEqual(0.02);
      }
    }
  });
});
