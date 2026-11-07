// Real walk times from where you are. Location is only requested when the group chat opens
// and stays on the phone (never sent to the server).
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

let last = null; // { lat, lng } cached so other screens (Home's Live card) can reuse it
const listeners = new Set();

const toRad = (d) => (d * Math.PI) / 180;
export function meters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ~80 m per minute walking, +20% because paths aren't straight lines.
const walkMins = (m) => Math.max(1, Math.round((m * 1.2) / 80));
const ON_CAMPUS_M = 3000; // farther than this, keep the default estimates

export async function requestLocation() {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    last = { lat: p.coords.latitude, lng: p.coords.longitude };
    listeners.forEach((f) => f(last));
    return last;
  } catch {
    return null;
  }
}

// Spots with `walk` replaced by real minutes from you (when you're on/near that campus).
export function useWalkTimes(spots, { ask = false } = {}) {
  const [pos, setPos] = useState(last);
  useEffect(() => {
    listeners.add(setPos);
    if (ask && !last) requestLocation();
    return () => listeners.delete(setPos);
  }, [ask]);
  if (!pos) return { spots, located: false };
  const near = spots.some((s) => meters(pos, s) < ON_CAMPUS_M);
  if (!near) return { spots, located: false };
  return { spots: spots.map((s) => ({ ...s, walk: walkMins(meters(pos, s)) })), located: true };
}
