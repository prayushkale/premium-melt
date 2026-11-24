import { describe, expect, it } from 'vitest';
import { WEEK_MIN } from './constants';
import { attribute, explainLine, type Baseline } from './explain';

describe('explain', () => {
  it('attributes total change exactly to time, spot, and IV', () => {
    const base: Baseline = { spot: 26_000, iv: 13, minutesLeft: WEEK_MIN, from: 'week' };
    const cur = { spot: 26_250, iv: 19, minutesLeft: 1_440 };
    const attr = attribute(26_100, base, cur);

    expect(attr.side).toBe('CE');
    expect(Math.abs(attr.time + attr.spot + attr.iv - attr.total)).toBeLessThan(1e-6);
    expect(attr.time).toBeLessThan(0);
    expect(attr.spot).toBeGreaterThan(0);
    expect(attr.iv).toBeGreaterThan(0);
  });

  it('explains the 26,000 ATM melt from 10,080 to 60 minutes', () => {
    const base: Baseline = { spot: 26_000, iv: 13, minutesLeft: WEEK_MIN, from: 'week' };
    const line = explainLine(26_000, base, { spot: 26_000, iv: 13, minutesLeft: 60 });
    expect(line).toContain('26,000 CE fell ₹172.3');
    expect(line).toContain('since the week began: time took ₹172.3');
  });

  it('explains a rise since planting a flag, ordered largest part first', () => {
    const base: Baseline = { spot: 26_000, iv: 13, minutesLeft: WEEK_MIN, from: 'flag' };
    const line = explainLine(26_100, base, { spot: 26_300, iv: 13, minutesLeft: 4_320 });
    expect(line).toMatch(/^26,100 CE rose ₹\d+\.\d{2} since you planted the flag: spot added ₹\d+\.\d{2}, time took ₹\d+\.\d{2}\.$/);
  });

  it('shows prompt when nothing has moved yet', () => {
    const base: Baseline = { spot: 26_000, iv: 13, minutesLeft: WEEK_MIN, from: 'flag' };
    const line = explainLine(26_000, base, { spot: 26_000, iv: 13, minutesLeft: WEEK_MIN });
    expect(line).toBe('Nothing has moved yet. Drag the clock.');
  });

  it('appends Expired worthless when expired with zero value', () => {
    const base: Baseline = { spot: 26_000, iv: 13, minutesLeft: WEEK_MIN, from: 'week' };
    const line = explainLine(26_200, base, { spot: 26_000, iv: 13, minutesLeft: 0 });
    expect(line).toContain('fell ₹');
    expect(line).toContain('Expired worthless.');
  });
});
