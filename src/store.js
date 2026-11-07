import { createContext, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const native = Platform.OS !== 'web';
import { ME, BOTS, JOIN_TIMES, CHAT_SCRIPT, REPLY, DEMO_SPOT_STATS, DEMO_NETWORK } from './data';
import { currentPrayer, fmtTime, times } from './prayer';

const GROUP_MS = 30 * 60 * 1000;
// spotStats: { spotId: { count, last } } from the server (demo: seeded stand-ins)
const emptyGroup = () => ({ members: [], messages: [], expiresAt: null, spot: null, spotStats: { ...DEMO_SPOT_STATS } });

export const initialState = {
  onboarded: false,
  tab: 'home', // 'home' | 'chat' | 'food' | 'profile'
  me: { ...ME },
  adhan: null, // { key, label, timeLabel, at }
  response: null, // 'free' | 'no' | 'prayed'
  group: emptyGroup(),
  chatOpen: false,
  streakSheet: null, // { from, to }
  profile: null, // user shown in profile sheet
  network: { ...DEMO_NETWORK }, // { prayers, campuses } across the Manara network today
};

let msgId = 0;
const msg = (userId, text) => ({ id: String(++msgId), userId, text, at: Date.now() });

export function reducer(s, a) {
  switch (a.type) {
    case 'HYDRATE':
      return { ...s, onboarded: a.onboarded, me: a.me ? { ...s.me, ...a.me, id: 'me' } : s.me };
    case 'ONBOARD':
      return { ...s, onboarded: true, me: { ...s.me, ...a.profile } };
    case 'ADHAN':
      return { ...s, adhan: { ...a.prayer, at: Date.now() }, response: null, group: emptyGroup(), chatOpen: false };
    case 'JOIN': {
      if (s.group.members.some((m) => m.id === a.user.id)) return s;
      return {
        ...s,
        group: { ...s.group, members: [...s.group.members, a.user], expiresAt: s.group.expiresAt ?? Date.now() + GROUP_MS },
      };
    }
    case 'RESPOND':
      if (a.answer !== 'free') return { ...s, response: a.answer };
      return reducer({ ...s, response: 'free', tab: 'chat' }, { type: 'JOIN', user: s.me });
    case 'TAB':
      return { ...s, tab: a.tab };
    case 'OPEN_CHAT':
      return { ...s, chatOpen: true };
    case 'MESSAGE':
      return { ...s, group: { ...s.group, messages: [...s.group.messages, msg(a.userId, a.text)] } };
    case 'PRAYED': {
      const from = s.me.streak;
      const me = { ...s.me, streak: from + 1, prayedToday: { ...s.me.prayedToday, [s.adhan.key]: true } };
      const network = { ...s.network, prayers: s.network.prayers + 1 }; // live mode: server overwrites
      return { ...s, me, network, response: 'prayed', chatOpen: false, tab: 'home', streakSheet: { from, to: me.streak } };
    }
    case 'CLOSE_STREAK':
      return { ...s, streakSheet: null };
    case 'PIN_SPOT': {
      if (s.group.spot === a.spotId) return s;
      const stats = { ...s.group.spotStats };
      if (s.group.spot && stats[s.group.spot]) stats[s.group.spot] = { ...stats[s.group.spot], count: Math.max(0, stats[s.group.spot].count - 1) };
      stats[a.spotId] = { ...stats[a.spotId], count: (stats[a.spotId]?.count ?? 0) + 1 };
      return { ...s, group: { ...s.group, spot: a.spotId, spotStats: stats } };
    }
    case 'NETWORK':
      return { ...s, network: a.network };
    case 'GROUP':
      return { ...s, group: a.group };
    case 'ME':
      return { ...s, me: { ...s.me, ...a.me } };
    case 'PROFILE':
      return { ...s, profile: a.user };
    case 'RESET':
      return { ...initialState, onboarded: s.onboarded, me: { ...s.me, streak: ME.streak, prayedToday: { ...ME.prayedToday } } };
    default:
      return s;
  }
}

export const Store = createContext(null);
export const useStore = () => useContext(Store);

// ---------- Demo engine (deterministic, replayable) ----------
let timers = [];
let demoActive = false;
export const isDemoActive = () => demoActive;
const later = (ms, fn) => timers.push(setTimeout(fn, ms));

export function stopDemo() {
  timers.forEach(clearTimeout);
  timers = [];
  demoActive = false;
  if (native) Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

function adhanContent(prayer, gender) {
  return {
    title: `${prayer.label} · ${prayer.timeLabel}`,
    body: `Adhan just went off. 4 ${gender}s near you are free to pray. Join?`,
    data: { demo: true },
  };
}

// Fires a real local notification after `delay` ms, then the in-app adhan.
export function playDemo(dispatch, me, delay = 3000) {
  stopDemo();
  dispatch({ type: 'RESET' });
  demoActive = true;
  const p = currentPrayer();
  const prayer = { key: p.key, label: p.label, timeLabel: fmtTime(p.time) };
  if (native) Notifications.scheduleNotificationAsync({
    content: adhanContent(prayer, me.gender),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, delay / 1000) },
  }).catch(() => {});
  later(delay, () => startAdhan(dispatch, prayer, me.gender));
}

export function startAdhan(dispatch, prayer, gender, withBots = true) {
  dispatch({ type: 'ADHAN', prayer });
  if (!withBots) return;
  demoActive = true;
  BOTS[gender].forEach((bot, i) => later(JOIN_TIMES[i], () => dispatch({ type: 'JOIN', user: bot })));
}

export function playChat(dispatch, gender) {
  if (!demoActive) return;
  const bots = BOTS[gender];
  CHAT_SCRIPT.forEach(([i, text], n) => later(1200 + n * 2600, () => dispatch({ type: 'MESSAGE', userId: bots[i].id, text })));
}

export function botReply(dispatch, gender) {
  if (!demoActive) return;
  const [i, text] = REPLY;
  later(1800, () => dispatch({ type: 'MESSAGE', userId: BOTS[gender][i].id, text }));
}

// Real feature: schedule a local notification at each remaining prayer today.
export async function scheduleToday(gender) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  for (const p of times(now).filter((t) => t.time > now)) {
    const prayer = { key: p.key, label: p.label, timeLabel: fmtTime(p.time) };
    await Notifications.scheduleNotificationAsync({
      content: { ...adhanContent(prayer, gender), data: { prayer } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.time },
    });
  }
}
