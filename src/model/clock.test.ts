import { describe, expect, it } from 'vitest';
import { thetaDisplay, timeLeft, wallTime } from './clock';

describe('clock', () => {
  it('formats wall time in IST relative to Tuesday 15:30 expiry', () => {
    expect(wallTime(10_080)).toBe('Tue 15:30');
    expect(wallTime(1_440)).toBe('Mon 15:30');
    expect(wallTime(60)).toBe('Tue 14:30');
    expect(wallTime(6_375)).toBe('Fri 05:15');
    expect(wallTime(0)).toBe('Tue 15:30');
  });

  it('formats remaining time concisely', () => {
    expect(timeLeft(6 * 1_440 + 4 * 60 + 15)).toBe('6d 4h 15m');
    expect(timeLeft(1_440)).toBe('1d 0h 0m');
    expect(timeLeft(60)).toBe('1h 0m');
    expect(timeLeft(45)).toBe('45m');
    expect(timeLeft(0)).toBe('Expired');
  });

  it('scales theta units by remaining time', () => {
    const thetaYear = -365 * 24 * 60; // -1 rupee per minute, -60 per hour, -1440 per day
    expect(thetaDisplay(thetaYear, 1_440)).toEqual({ value: -1_440, unit: '/day' });
    expect(thetaDisplay(thetaYear, 10_080)).toEqual({ value: -1_440, unit: '/day' });
    expect(thetaDisplay(thetaYear, 1_439)).toEqual({ value: -60, unit: '/hr' });
    expect(thetaDisplay(thetaYear, 60)).toEqual({ value: -60, unit: '/hr' });
    expect(thetaDisplay(thetaYear, 59)).toEqual({ value: -1, unit: '/min' });
    expect(thetaDisplay(0, 0)).toEqual({ value: 0, unit: '/min' });
  });
});
