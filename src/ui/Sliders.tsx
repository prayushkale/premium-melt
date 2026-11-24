import { useEffect, useState, type FormEvent } from 'react';
import {
  IV_MAX,
  IV_MIN,
  IV_STEP,
  SPOT_HALF,
  SPOT_MAX,
  SPOT_MIN,
  SPOT_STEP,
  type View,
} from '../model/constants';

interface SlidersProps {
  view: View;
  onSpotSlide: (spot: number) => void;
  onSpotCommit: (spot: number) => void;
  onIvChange: (iv: number) => void;
}

export function Sliders({
  view,
  onSpotSlide,
  onSpotCommit,
  onIvChange,
}: SlidersProps) {
  const [spotText, setSpotText] = useState(String(view.spot));

  useEffect(() => {
    setSpotText(String(view.spot));
  }, [view.spot]);

  const commitSpot = () => {
    const parsed = Number(spotText);
    if (!Number.isFinite(parsed)) {
      setSpotText(String(view.spot));
      return;
    }
    onSpotCommit(parsed);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    commitSpot();
  };

  const minSpot = Math.max(SPOT_MIN, view.centre - SPOT_HALF);
  const maxSpot = Math.min(SPOT_MAX, view.centre + SPOT_HALF);

  return (
    <section className="panel sliders-panel" aria-label="Market inputs">
      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="spot-slider">Spot</label>
          <form onSubmit={handleSubmit} className="spot-form">
            <input
              id="spot-input"
              type="number"
              className="spot-number"
              aria-label="Spot level"
              min={SPOT_MIN}
              max={SPOT_MAX}
              step={SPOT_STEP}
              value={spotText}
              onChange={(e) => setSpotText(e.target.value)}
              onBlur={commitSpot}
            />
          </form>
        </div>
        <input
          id="spot-slider"
          type="range"
          className="range-input"
          min={minSpot}
          max={maxSpot}
          step={SPOT_STEP}
          value={view.spot}
          onChange={(e) => onSpotSlide(Number(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="iv-slider">Implied volatility</label>
          <span className="slider-value">{view.iv.toFixed(1)}%</span>
        </div>
        <input
          id="iv-slider"
          type="range"
          className="range-input"
          min={IV_MIN}
          max={IV_MAX}
          step={IV_STEP}
          value={view.iv}
          onChange={(e) => onIvChange(Number(e.target.value))}
        />
      </div>

      <p className="model-footnote">Flat IV, zero rates, calendar time</p>
    </section>
  );
}
