import { EXPIRY, WEEK_MIN, YEAR_MIN } from './constants';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAY_MIN = 1_440;
const EXPIRY_WEEK_MIN = EXPIRY.day * DAY_MIN + EXPIRY.hour * 60 + EXPIRY.minute;

export function wallTime(min: number): string {
  const offset = Math.round(min);
  const weekMin = (((EXPIRY_WEEK_MIN - offset) % WEEK_MIN) + WEEK_MIN) % WEEK_MIN;
  const day = Math.floor(weekMin / DAY_MIN);
  const rem = weekMin % DAY_MIN;
  const hh = String(Math.floor(rem / 60)).padStart(2, '0');
  const mm = String(rem % 60).padStart(2, '0');
  return `${DAYS[day]} ${hh}:${mm}`;
}

export function timeLeft(min: number): string {
  const total = Math.max(0, Math.round(min));
  if (total <= 0) return 'Expired';
  const days = Math.floor(total / DAY_MIN);
  const hours = Math.floor((total % DAY_MIN) / 60);
  const mins = total % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export interface ThetaReadout {
  value: number;
  unit: '/day' | '/hr' | '/min';
}

export function thetaDisplay(thetaYear: number, min: number): ThetaReadout {
  if (min >= DAY_MIN) {
    const val = thetaYear / 365;
    return { value: val === 0 ? 0 : val, unit: '/day' };
  }
  if (min >= 60) {
    const val = thetaYear / (365 * 24);
    return { value: val === 0 ? 0 : val, unit: '/hr' };
  }
  const val = thetaYear / YEAR_MIN;
  return { value: val === 0 ? 0 : val, unit: '/min' };
}
