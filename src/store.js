import { createContext, useContext } from 'react';
import * as Notifications from 'expo-notifications';
import { ME, BOTS, JOIN_TIMES, CHAT_SCRIPT, REPLY } from './data';
import { currentPrayer, fmtTime, times } from './prayer';

const GROUP_MS = 30 * 60 * 1000;
const emptyGroup = () => ({ members: [], messages: [], expiresAt: null });

export const initialState = {
  onboarded: false,
  me: { ...ME },
  adhan: null, // { key, label, timeLabel, at }
  response: null, // 'free' | 'no' | 'prayed'
  group: emptyGroup(),
  chatOpen: false,
  streakSheet: null, // { from, to }
  profile: null, // user shown in profile sheet
};

let msgId = 0;
const msg = (userId, text) => ({ id: String(++msgId), userId, text, at: Date.now() });

export function reducer(s, a) {
  switch (a.type) {
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
      return reducer({ ...s, response: 'free' }, { type: 'JOIN', user: s.me });
    case 'OPEN_CHAT':
      return { ...s, chatOpen: true };
    case 'MESSAGE':
      return { ...s, group: { ...s.group, messages: [...s.group.messages, msg(a.userId, a.text)] } };
    case 'PRAYED': {
      const from = s.me.streak;
      const me = { ...s.me, streak: from + 1, prayedToday: { ...s.me.prayedToday, [s.adhan.key]: true } };
      return { ...s, me, response: 'prayed', chatOpen: false, streakSheet: { from, to: me.streak } };
    }
    case 'CLOSE_STREAK':
      return { ...s, streakSheet: null };
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
const later = (ms, fn) => timers.push(setTimeout(fn, ms));

export function stopDemo() {
  timers.forEach(clearTimeout);
  timers = [];
  Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
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
  const p = currentPrayer();
  const prayer = { key: p.key, label: p.label, timeLabel: fmtTime(p.time) };
  Notifications.scheduleNotificationAsync({
    content: adhanContent(prayer, me.gender),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, delay / 1000) },
  }).catch(() => {});
  later(delay, () => startAdhan(dispatch, prayer, me.gender));
}

export function startAdhan(dispatch, prayer, gender) {
  dispatch({ type: 'ADHAN', prayer });
  BOTS[gender].forEach((bot, i) => later(JOIN_TIMES[i], () => dispatch({ type: 'JOIN', user: bot })));
}

export function playChat(dispatch, gender) {
  const bots = BOTS[gender];
  CHAT_SCRIPT.forEach(([i, text], n) => later(1200 + n * 2600, () => dispatch({ type: 'MESSAGE', userId: bots[i].id, text })));
}

export function botReply(dispatch, gender) {
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
