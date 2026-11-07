// Profile helpers shared by Onboarding and Edit profile, plus sign-out.
import { Platform } from 'react-native';
import { clearSaved } from './persist';
import { disableAlerts } from './alerts';

// Accept "@handle", "linkedin.com/in/x" or a full URL.
export const toUrl = (v, base) => {
  const t = (v ?? '').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  if (t.includes('.')) return `https://${t}`;
  return `${base}${t.replace(/^@/, '')}`;
};

export const linkedinUrl = (v) => toUrl(v, 'https://www.linkedin.com/in/');
export const instagramUrl = (v) => toUrl(v, 'https://www.instagram.com/');

// Campus email domain or a subdomain (e.g. student.sdccd.edu).
export const emailOk = (email, campus) => new RegExp(`[@.]${campus.domain.replace('.', '\\.')}$`, 'i').test((email ?? '').trim());

// Wipe this device (new device id, back to onboarding) and restart the app.
export async function signOut() {
  await disableAlerts();
  await clearSaved();
  if (Platform.OS === 'web') return window.location.reload();
  const Updates = await import('expo-updates');
  await Updates.reloadAsync().catch(() => {});
}
