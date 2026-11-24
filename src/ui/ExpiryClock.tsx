import type { CSSProperties } from 'react';
import {
  CLOCK_STEP,
  STRIKE_STEP,
  WEEK_MIN,
  type View,
} from '../model/constants';
import { timeLeft, wallTime } from '../model/clock';
import { otmPremium } from '../model/pricing';

interface ExpiryClockProps {
  view: View;
  onChangeMinutesLeft: (minutesLeft: number) => void;
}

const DAY_TICKS = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function handleColor(minutesLeft: number): string {
  // Cools from molten amber (#ff9a3c) through ember (#c2491d) to deep teal (#1f5a5e)
  const remaining = Math.max(0, Math.min(1, minutesLeft / WEEK_MIN));
  if (remaining >= 0.45) {
    const t = (remaining - 0.45) / 0.55;
    return `rgb(${lerp(194, 255, t)}, ${lerp(73, 154, t)}, ${lerp(29, 60, t)})`;
  }
  const t = remaining / 0.45;
  return `rgb(${lerp(31, 194, t)}, ${lerp(90, 73, t)}, ${lerp(94, 29, t)})`;
}

export function ExpiryClock({ view, onChangeMinutesLeft }: ExpiryClockProps) {
  const elapsed = WEEK_MIN - view.minutesLeft;
  const remainingText = timeLeft(view.minutesLeft);
  const wall = wallTime(view.minutesLeft);
  const ariaValueText =
    view.minutesLeft <= 0
      ? `Expired, ${wall}`
      : `${remainingText} left, ${wall}`;

  const atmStrike = Math.round(view.spot / STRIKE_STEP) * STRIKE_STEP;
  const vol = view.iv / 100;
  const atmPrem = otmPremium(view.spot, atmStrike, vol, view.minutesLeft);
  const weekStartPrem = otmPremium(view.spot, atmStrike, vol, WEEK_MIN);
  const meltedPct =
    weekStartPrem > 0
      ? Math.max(0, Math.min(100, Math.round((1 - atmPrem / weekStartPrem) * 100)))
      : 100;

  const progressPct = (elapsed / WEEK_MIN) * 100;
  const thumbColor = handleColor(view.minutesLeft);

  const sliderStyle = {
    '--handle-color': thumbColor,
    '--elapsed-pct': `${progressPct}%`,
  } as CSSProperties;

  return (
    <section className="panel clock-bar" aria-label="Expiry clock panel">
      <div className="clock-readouts">
        <div className="clock-time-group">
          <label htmlFor="expiry-clock" className="clock-label">
            Expiry clock
          </label>
          <span className="clock-remaining" data-testid="time-left">
            {remainingText}
          </span>
          <span className="clock-wall">{wall} IST</span>
        </div>

        <div className="clock-atm-group">
          <span className="clock-atm-strike">
            ATM {atmStrike.toLocaleString('en-US')}
          </span>
          <span className="clock-atm-premium" data-testid="atm-premium">
            ₹{atmPrem.toFixed(2)}
          </span>
          <span className="clock-melted" data-testid="melted-pct">
            {meltedPct}% melted
          </span>
        </div>
      </div>

      <div className="clock-slider-wrap">
        <input
          id="expiry-clock"
          type="range"
          className="clock-range"
          style={sliderStyle}
          min={0}
          max={WEEK_MIN}
          step={CLOCK_STEP}
          value={elapsed}
          aria-label="Expiry clock"
          aria-valuetext={ariaValueText}
          onChange={(e) => onChangeMinutesLeft(WEEK_MIN - Number(e.target.value))}
        />
        <div className="clock-ticks" aria-hidden="true">
          {DAY_TICKS.map((day, idx) => (
            <span key={`${day}-${idx}`} className="clock-tick">
              {day}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
