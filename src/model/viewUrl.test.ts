import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEW, type View } from './constants';
import { decodeView, encodeView } from './viewUrl';

describe('viewUrl', () => {
  it('round-trips a full view including strike', () => {
    const view: View = {
      spot: 26_150,
      iv: 18.5,
      minutesLeft: 1_440,
      centre: 26_000,
      strike: 26_300,
    };
    const encoded = encodeView(view);
    expect(encoded).toBe('?s=26150&iv=18.5&t=1440&k=26300&c=26000');
    expect(decodeView(encoded)).toEqual(view);
  });

  it('omits k when strike is null', () => {
    const encoded = encodeView(DEFAULT_VIEW);
    expect(encoded).toBe('?s=26000&iv=13&t=10080&c=26000');
    expect(decodeView(encoded)).toEqual(DEFAULT_VIEW);
  });

  it('returns defaults for empty or junk query strings', () => {
    expect(decodeView('')).toEqual(DEFAULT_VIEW);
    expect(decodeView('?s=abc&iv=NaN&t=Infinity&k=foo&c=bar')).toEqual(DEFAULT_VIEW);
  });

  it('clamps and snaps out-of-range values', () => {
    const decoded = decodeView('?s=99999&iv=2&t=100&c=26000');
    expect(decoded.spot).toBe(50_000);
    expect(decoded.iv).toBe(8);
    expect(decoded.minutesLeft).toBe(105);
    expect(decoded.centre).toBe(50_000);
    expect(decoded.strike).toBeNull();
  });

  it('recentres c when missing or more than 800 from spot', () => {
    const missingC = decodeView('?s=28340&iv=14&t=60');
    expect(missingC.spot).toBe(28_340);
    expect(missingC.centre).toBe(28_500);

    const farC = decodeView('?s=27000&c=25000');
    expect(farC.centre).toBe(27_000);
  });

  it('drops strike if outside window and snaps valid strikes to 50', () => {
    expect(decodeView('?s=26000&c=26000&k=29000').strike).toBeNull();
    expect(decodeView('?s=26000&c=26000&k=26124').strike).toBe(26_100);
  });
});
