import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CENTRE_STEP,
  HALF_WINDOW,
  SPOT_MAX,
  SPOT_MIN,
  SPOT_STEP,
  STRIKE_STEP,
  WEEK_MIN,
  type View,
} from './model/constants';
import type { Baseline } from './model/explain';
import { decodeView, encodeView } from './model/viewUrl';
import { Scene } from './scene/Scene';
import { ExpiryClock } from './ui/ExpiryClock';
import { FlagCard } from './ui/FlagCard';
import { Sliders } from './ui/Sliders';
import { TopBar } from './ui/TopBar';

function clampSnap(val: number, min: number, max: number, step: number): number {
  const clamped = Math.max(min, Math.min(max, val));
  const snapped = Math.round(clamped / step) * step;
  return Math.max(min, Math.min(max, snapped));
}

export default function App() {
  const [view, setView] = useState<View>(() => decodeView(window.location.search));
  const [baseline, setBaseline] = useState<Baseline | null>(() => {
    const initial = decodeView(window.location.search);
    if (initial.strike === null) return null;
    return {
      spot: initial.spot,
      iv: initial.iv,
      minutesLeft: WEEK_MIN,
      from: 'week',
    };
  });

  const [isCompact, setIsCompact] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 700px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 700px)');
    const onChange = () => setIsCompact(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const debounceRef = useRef<number | null>(null);
  const viewRef = useRef<View>(view);
  viewRef.current = view;

  useEffect(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      const nextSearch = encodeView(view);
      if (window.location.search !== nextSearch) {
        try {
          window.history.replaceState(null, '', nextSearch);
        } catch {
          // Ignore browser rate-limit exceptions
        }
      }
    }, 250);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [view]);

  const handleSelectStrike = useCallback((strike: number) => {
    const cur = viewRef.current;
    setView((prev) => ({ ...prev, strike }));
    setBaseline({
      spot: cur.spot,
      iv: cur.iv,
      minutesLeft: cur.minutesLeft,
      from: 'flag',
    });
  }, []);

  const handleStepStrike = useCallback((nextStrike: number) => {
    const cur = viewRef.current;
    const clamped = Math.max(
      cur.centre - HALF_WINDOW,
      Math.min(cur.centre + HALF_WINDOW, nextStrike),
    );
    setView((prev) => ({ ...prev, strike: clamped }));
    setBaseline({
      spot: cur.spot,
      iv: cur.iv,
      minutesLeft: cur.minutesLeft,
      from: 'flag',
    });
  }, []);

  const handleRemoveFlag = useCallback(() => {
    setView((prev) => ({ ...prev, strike: null }));
    setBaseline(null);
  }, []);

  const handleFlagAtm = useCallback(() => {
    const cur = viewRef.current;
    const atm = Math.round(cur.spot / STRIKE_STEP) * STRIKE_STEP;
    const clamped = Math.max(
      cur.centre - HALF_WINDOW,
      Math.min(cur.centre + HALF_WINDOW, atm),
    );
    setView((prev) => ({ ...prev, strike: clamped }));
    setBaseline({
      spot: cur.spot,
      iv: cur.iv,
      minutesLeft: cur.minutesLeft,
      from: 'flag',
    });
  }, []);

  const handleSpotSlide = useCallback((spot: number) => {
    setView((prev) => ({ ...prev, spot }));
  }, []);

  const handleSpotCommit = useCallback((rawSpot: number) => {
    const spot = clampSnap(rawSpot, SPOT_MIN, SPOT_MAX, SPOT_STEP);
    const centre = clampSnap(spot, SPOT_MIN, SPOT_MAX, CENTRE_STEP);
    const cur = viewRef.current;
    const keepStrike =
      cur.strike !== null &&
      cur.strike >= centre - HALF_WINDOW &&
      cur.strike <= centre + HALF_WINDOW;

    setView((prev) => ({
      ...prev,
      spot,
      centre,
      strike: keepStrike ? prev.strike : null,
    }));
    if (!keepStrike) {
      setBaseline(null);
    }
  }, []);

  const handleIvChange = useCallback((iv: number) => {
    setView((prev) => ({ ...prev, iv }));
  }, []);

  const handleChangeMinutesLeft = useCallback((minutesLeft: number) => {
    setView((prev) => ({ ...prev, minutesLeft }));
  }, []);

  const handleCopyLink = useCallback(async () => {
    const nextSearch = encodeView(viewRef.current);
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    try {
      window.history.replaceState(null, '', nextSearch);
    } catch {
      // Ignore browser rate-limit exceptions
    }
    const url = `${window.location.origin}${window.location.pathname}${nextSearch}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return { ok: true, url };
      }
      return { ok: false, url };
    } catch {
      return { ok: false, url };
    }
  }, []);

  return (
    <div className="app-shell">
      <Scene
        view={view}
        isCompact={isCompact}
        onSelectStrike={handleSelectStrike}
      />

      <TopBar onCopyLink={handleCopyLink} />

      <Sliders
        view={view}
        onSpotSlide={handleSpotSlide}
        onSpotCommit={handleSpotCommit}
        onIvChange={handleIvChange}
      />

      <FlagCard
        view={view}
        baseline={baseline}
        onStepStrike={handleStepStrike}
        onRemoveFlag={handleRemoveFlag}
        onFlagAtm={handleFlagAtm}
      />

      <ExpiryClock
        view={view}
        onChangeMinutesLeft={handleChangeMinutesLeft}
      />
    </div>
  );
}
