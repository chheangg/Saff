import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

const UCSD = new Coordinates(32.8801, -117.234);
const params = CalculationMethod.NorthAmerica();

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const LABEL = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

export function times(date = new Date()) {
  const pt = new PrayerTimes(UCSD, date, params);
  return PRAYERS.map((key) => ({ key, label: LABEL[key], time: pt[key] }));
}

export function nextPrayer(now = new Date()) {
  const upcoming = times(now).find((p) => p.time > now);
  if (upcoming) return upcoming;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return times(tomorrow)[0];
}

// The prayer whose time most recently began (what the demo "adhan" announces).
export function currentPrayer(now = new Date()) {
  const passed = times(now).filter((p) => p.time <= now);
  return passed.length ? passed[passed.length - 1] : times(now)[4];
}

export function fmtTime(d) {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

export function fmtIn(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  return h ? `${h}h ${mins % 60}m` : `${mins} min`;
}
