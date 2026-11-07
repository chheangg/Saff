// Live mode: connects to the Saff server when EXPO_PUBLIC_SERVER_URL is set.
// Without it, the app runs fully offline in demo mode.
import { io } from 'socket.io-client';
import { isDemoActive } from './store';

// Ali's Replit deployment; override with EXPO_PUBLIC_SERVER_URL (set it to 'off' for offline-only).
const ENV = process.env.EXPO_PUBLIC_SERVER_URL;
const URL = ENV === 'off' ? null : ENV || 'https://saff-alimran13.replit.app';
let deviceId = null; // set from on-device storage before connecting

export const live = URL ? io(URL, { transports: ['websocket'], autoConnect: false }) : null;
export const isLive = !!live;

// Server ids -> local 'me' so the UI can tell which bubbles/avatars are yours.
const local = (id) => (id === deviceId ? 'me' : id);

export function connectLive(dispatch, getMe, id) {
  if (!live) return () => {};
  deviceId = id;
  // Only register with the server after onboarding, so nobody joins as the placeholder profile.
  const join = () => {
    const me = getMe();
    if (me) live.emit('join', { ...me, id: deviceId });
  };
  const onAdhan = (prayer) => !isDemoActive() && dispatch({ type: 'ADHAN', prayer });
  const onGroup = (g) =>
    !isDemoActive() &&
    dispatch({
      type: 'GROUP',
      group: {
        ...g,
        members: g.members.map((u) => ({ ...u, id: local(u.id) })),
        messages: g.messages.map((m) => ({ ...m, userId: local(m.userId) })),
      },
    });
  const onNetwork = (n) => !isDemoActive() && dispatch({ type: 'NETWORK', network: n });
  const onMe = (u) => dispatch({ type: 'ME', me: { streak: u.streak, prayedToday: u.prayedToday } });

  live.on('connect', join);
  live.on('adhan', onAdhan);
  live.on('group', onGroup);
  live.on('me', onMe);
  live.on('network', onNetwork);
  live.connect();
  return () => {
    live.off('connect', join);
    live.off('adhan', onAdhan);
    live.off('group', onGroup);
    live.off('me', onMe);
    live.off('network', onNetwork);
    live.disconnect();
  };
}

export const rejoin = (me) => live?.connected && live.emit('join', { ...me, id: deviceId });

// Mirror the user's own actions to the server (bots/demo never reach here).
export function mirror(action) {
  if (!live || isDemoActive()) return;
  if (action.type === 'RESPOND' && action.answer === 'free') live.emit('free');
  if (action.type === 'MESSAGE' && action.userId === 'me') live.emit('message', action.text);
  if (action.type === 'PRAYED') live.emit('prayed');
  if (action.type === 'PIN_SPOT') live.emit('spot', action.spotId);
}
