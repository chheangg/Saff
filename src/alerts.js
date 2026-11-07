// Real adhan alerts: on by default after onboarding.
// 1) Local notifications at today's prayer times (work offline, rescheduled every launch).
// 2) An Expo push token sent to the server, so admin-fired adhans reach closed phones.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { scheduleToday } from './store';

let token = null;
export const getPushToken = () => token;

export async function enableAlerts(gender) {
  if (Platform.OS === 'web') return false;
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;
  await scheduleToday(gender).catch(() => {});
  if (!token) {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch {}
  }
  return true;
}

export async function disableAlerts() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}
