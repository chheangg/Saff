// On-device persistence: stable device id + profile/streak survive app restarts.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'saff.v1';
const newId = () => `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function loadSaved() {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
    if (saved?.deviceId) return saved;
  } catch {}
  const fresh = { deviceId: newId(), onboarded: false, me: null };
  AsyncStorage.setItem(KEY, JSON.stringify(fresh)).catch(() => {});
  return fresh;
}

export async function clearSaved() {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}

export function save(data) {
  AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
}
