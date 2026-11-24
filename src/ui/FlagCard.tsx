import {
  HALF_WINDOW,
  STRIKE_STEP,
  YEAR_MIN,
  type View,
} from '../model/constants';
import { thetaDisplay } from '../model/clock';
import { attribute, explainLine, type Baseline } from '../model/explain';
import { delta, otmSide, price, thetaPerYear, type Side } from '../model/pricing';

interface FlagCardProps {
  view: View;
  baseline: Baseline | null;
  onStepStrike: (nextStrike: number) => void;
  onRemoveFlag: () => void;
  onFlagAtm: () => void;
}

function fmtTheta(thetaYear: number, minutesLeft: number): string {
  const { value, unit } = thetaDisplay(thetaYear, minutesLeft);
  if (Math.abs(value) < 0.005) {
    return `₹0.00${unit}`;
  }
  const sign = value < 0 ? '-' : '';
  return `${sign}₹${Math.abs(value).toFixed(2)}${unit}`;
}

export function FlagCard({
  view,
  baseline,
  onStepStrike,
  onRemoveFlag,
  onFlagAtm,
}: FlagCardProps) {
  if (view.strike === null) {
    return (
      <aside className="panel flag-card flag-card-empty" aria-label="Strike inspector">
        <p className="flag-empty-text">Click any strike to plant a flag</p>
        <button type="button" className="btn-secondary" onClick={onFlagAtm}>
          Flag the ATM strike
        </button>
      </aside>
    );
  }

  const strike = view.strike;
  const minStrike = view.centre - HALF_WINDOW;
  const maxStrike = view.centre + HALF_WINDOW;
  const T = Math.max(0, view.minutesLeft) / YEAR_MIN;
  const vol = view.iv / 100;
  const onTerrain = otmSide(view.spot, strike);

  const sides: Side[] = ['CE', 'PE'];
  const effectiveBaseline: Baseline = baseline ?? {
    spot: view.spot,
    iv: view.iv,
    minutesLeft: view.minutesLeft,
    from: 'flag',
  };

  const attr = attribute(strike, effectiveBaseline, view);
  const heading = attr.total >= 0.05 ? 'Why did this rise?' : 'Why did this fall?';
  const explanation = explainLine(strike, effectiveBaseline, view);

  return (
    <aside className="panel flag-card" aria-label="Flagged strike details">
      <div className="flag-header">
        <div className="flag-strike-controls">
          <button
            type="button"
            className="btn-step"
            aria-label="Decrease strike by 50"
            disabled={strike <= minStrike}
            onClick={() => onStepStrike(strike - STRIKE_STEP)}
          >
            -50
          </button>
          <span className="flag-strike-value">{strike.toLocaleString('en-US')}</span>
          <button
            type="button"
            className="btn-step"
            aria-label="Increase strike by 50"
            disabled={strike >= maxStrike}
            onClick={() => onStepStrike(strike + STRIKE_STEP)}
          >
            +50
          </button>
        </div>
        <button
          type="button"
          className="btn-remove"
          aria-label="Remove flag"
          onClick={onRemoveFlag}
        >
          Remove
        </button>
      </div>

      <div className="flag-columns">
        {sides.map((side) => {
          const prem = price(side, view.spot, strike, vol, T, 0);
          const d = delta(side, view.spot, strike, vol, T, 0);
          const th = thetaPerYear(side, view.spot, strike, vol, T, 0);
          const active = side === onTerrain;
          return (
            <div
              key={side}
              className={`flag-col${active ? ' flag-col-active' : ''}`}
            >
              <div className="flag-col-head">
                <span className="flag-side">{side}</span>
                {active && <span className="flag-terrain-tag">on terrain</span>}
              </div>
              <dl className="flag-metrics">
                <div className="flag-metric">
                  <dt>Premium</dt>
                  <dd>₹{prem.toFixed(2)}</dd>
                </div>
                <div className="flag-metric">
                  <dt>Delta</dt>
                  <dd>{d.toFixed(2)}</dd>
                </div>
                <div className="flag-metric">
                  <dt>Theta</dt>
                  <dd>{fmtTheta(th, view.minutesLeft)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <div className="flag-explain">
        <h2 className="flag-explain-heading">{heading}</h2>
        <p className="flag-explain-line">{explanation}</p>
      </div>
    </aside>
  );
}
