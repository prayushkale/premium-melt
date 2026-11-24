export const WEEK_MIN = 10_080;
export const YEAR_MIN = 525_600;
export const CLOCK_STEP = 15;

export const STRIKE_STEP = 50;
export const HALF_WINDOW = 1_200;
export const COL_STEP = 10;

export const SPOT_HALF = 800;
export const SPOT_STEP = 10;
export const CENTRE_STEP = 500;
export const SPOT_MIN = 10_000;
export const SPOT_MAX = 50_000;

export const IV_MIN = 8;
export const IV_MAX = 30;
export const IV_STEP = 0.5;

export const COLS = 241; // 10-point columns: every legal spot lands on a vertex
export const ROWS = 61;

export const X_PER_POINT = 0.01;
export const Y_PER_RUPEE = 0.02;
export const Z_FRONT = 7;
export const Z_BACK = -7;

export const EXPIRY = { day: 2, hour: 15, minute: 30 } as const; // Tuesday 15:30 IST

export interface View {
  spot: number;
  iv: number;
  minutesLeft: number;
  centre: number;
  strike: number | null;
}

export const DEFAULT_VIEW: View = {
  spot: 26_000,
  iv: 13,
  minutesLeft: WEEK_MIN,
  centre: 26_000,
  strike: null,
};
