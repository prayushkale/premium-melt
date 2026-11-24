import { YEAR_MIN } from './constants';

export type Side = 'CE' | 'PE';

const INV_SQRT_2PI = 1 / Math.sqrt(2 * Math.PI);

const TWO_OVER_SQRT_PI = 2 / Math.sqrt(Math.PI);

function erf(x: number): number {
  const ax = Math.abs(x);
  if (ax < 0.05) {
    const x2 = x * x;
    return TWO_OVER_SQRT_PI * x * (1 - x2 / 3 + (x2 * x2) / 10 - (x2 * x2 * x2) / 42);
  }
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + 0.3275911 * ax);
  const poly =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
    t;
  return sign * (1 - poly * Math.exp(-ax * ax));
}

export function normCdf(x: number): number {
  return 0.5 * (1 + erf(x * Math.SQRT1_2));
}

function normPdf(x: number): number {
  return INV_SQRT_2PI * Math.exp(-0.5 * x * x);
}

export function price(
  side: Side,
  S: number,
  K: number,
  vol: number,
  T: number,
  r = 0,
): number {
  if (T <= 0 || vol <= 0) {
    return side === 'CE' ? Math.max(S - K, 0) : Math.max(K - S, 0);
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * T) / (vol * sqrtT);
  const d2 = d1 - vol * sqrtT;
  const disc = Math.exp(-r * T);

  if (side === 'CE') {
    return Math.max(0, S * normCdf(d1) - K * disc * normCdf(d2));
  }
  return Math.max(0, K * disc * normCdf(-d2) - S * normCdf(-d1));
}

export function delta(
  side: Side,
  S: number,
  K: number,
  vol: number,
  T: number,
  r = 0,
): number {
  if (T <= 0 || vol <= 0) {
    if (S === K) return side === 'CE' ? 0.5 : -0.5;
    if (side === 'CE') return S > K ? 1 : 0;
    return S < K ? -1 : 0;
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * T) / (vol * sqrtT);
  return side === 'CE' ? normCdf(d1) : normCdf(d1) - 1;
}

export function thetaPerYear(
  side: Side,
  S: number,
  K: number,
  vol: number,
  T: number,
  r = 0,
): number {
  if (T <= 0 || vol <= 0) {
    return 0;
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * T) / (vol * sqrtT);
  const common = -(S * normPdf(d1) * vol) / (2 * sqrtT);
  if (r === 0) {
    return common;
  }
  const d2 = d1 - vol * sqrtT;
  const disc = Math.exp(-r * T);
  return side === 'CE'
    ? common - r * K * disc * normCdf(d2)
    : common + r * K * disc * normCdf(-d2);
}

export function otmSide(S: number, K: number): Side {
  return K >= S ? 'CE' : 'PE';
}

export function otmPremium(
  S: number,
  K: number,
  vol: number,
  minutesLeft: number,
): number {
  const T = Math.max(0, minutesLeft) / YEAR_MIN;
  return price(otmSide(S, K), S, K, vol, T, 0);
}
