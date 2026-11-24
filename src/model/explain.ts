import { YEAR_MIN } from './constants';
import { otmSide, price, type Side } from './pricing';

export interface Baseline {
  spot: number;
  iv: number;
  minutesLeft: number;
  from: 'flag' | 'week';
}

export interface CurrentState {
  spot: number;
  iv: number;
  minutesLeft: number;
}

export interface Attribution {
  side: Side;
  total: number;
  time: number;
  spot: number;
  iv: number;
  endPrice: number;
}

export function attribute(
  strike: number,
  baseline: Baseline,
  current: CurrentState,
): Attribution {
  const side = otmSide(baseline.spot, strike);
  const t0 = Math.max(0, baseline.minutesLeft) / YEAR_MIN;
  const t1 = Math.max(0, current.minutesLeft) / YEAR_MIN;
  const v0 = baseline.iv / 100;
  const v1 = current.iv / 100;

  const p0 = price(side, baseline.spot, strike, v0, t0);
  const p1 = price(side, baseline.spot, strike, v0, t1);
  const p2 = price(side, current.spot, strike, v0, t1);
  const p3 = price(side, current.spot, strike, v1, t1);

  return {
    side,
    total: p3 - p0,
    time: p1 - p0,
    spot: p2 - p1,
    iv: p3 - p2,
    endPrice: p3,
  };
}

function fmtStrike(strike: number): string {
  return strike.toLocaleString('en-US');
}

function fmtRupees(amount: number): string {
  return `₹${Math.abs(amount).toFixed(2)}`;
}

export function explainLine(
  strike: number,
  baseline: Baseline,
  current: CurrentState,
): string {
  const attr = attribute(strike, baseline, current);
  const parts: Array<{ label: string; delta: number }> = [
    { label: 'time', delta: attr.time },
    { label: 'spot', delta: attr.spot },
    { label: 'IV', delta: attr.iv },
  ]
    .filter((p) => Math.abs(p.delta) >= 0.05)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  if (Math.abs(attr.total) < 0.05 && parts.length === 0) {
    return 'Nothing has moved yet. Drag the clock.';
  }

  const origin =
    baseline.from === 'week' ? 'since the week began' : 'since you planted the flag';

  const verb =
    attr.total <= -0.05
      ? `fell ${fmtRupees(attr.total)}`
      : attr.total >= 0.05
        ? `rose ${fmtRupees(attr.total)}`
        : 'stayed flat';

  const breakdown = parts
    .map((p) => `${p.label} ${p.delta < 0 ? 'took' : 'added'} ${fmtRupees(p.delta)}`)
    .join(', ');

  let line = `${fmtStrike(strike)} ${attr.side} ${verb} ${origin}`;
  line += breakdown ? `: ${breakdown}.` : '.';

  if (current.minutesLeft <= 0 && attr.endPrice <= 1e-9) {
    line += ' Expired worthless.';
  }

  return line;
}
