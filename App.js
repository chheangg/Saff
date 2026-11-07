import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Store, initialState, isDemoActive, reducer, startAdhan } from './src/store';
import { loadSaved, save } from './src/persist';
import { useAppFonts } from './src/fonts';
import { enableAlerts } from './src/alerts';
import { C } from './src/theme';
import { connectLive, isLive, mirror, rejoin } from './src/live';
import TabBar from './src/TabBar';
import Onboarding from './src/screens/Onboarding';
import Home from './src/screens/Home';
import ChatTab from './src/screens/ChatTab';
import Food from './src/screens/Food';
import Profile from './src/screens/Profile';
import Takeover from './src/screens/Takeover';
import { ProfileSheet, StreakSheet } from './src/screens/Sheets';

const native = Platform.OS !== 'web'; // browsers: no local notifications, in-app adhan only

if (native) Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SCREENS = { home: Home, chat: ChatTab, food: Food, profile: Profile };

export default function App() {
  const fontsLoaded = useAppFonts();
  const [state, rawDispatch] = useReducer(reducer, initialState);
  // Every action goes to the reducer; the user's own actions are mirrored to the server in live mode.
  const dispatch = useMemo(() => (a) => { rawDispatch(a); mirror(a); }, []);
  const store = useMemo(() => ({ state, dispatch }), [state]);
  const meRef = useRef(state.me);
  meRef.current = state.me;
  const onboardedRef = useRef(false);
  onboardedRef.current = state.onboarded;

  const [deviceId, setDeviceId] = useState(null);

  // Restore profile + streak, then connect to the server with a stable id.
  useEffect(() => {
    loadSaved().then((saved) => {
      rawDispatch({ type: 'HYDRATE', onboarded: saved.onboarded, me: saved.me, history: saved.history });
      setDeviceId(saved.deviceId);
    });
  }, []);
  useEffect(() => (deviceId ? connectLive(rawDispatch, () => (onboardedRef.current ? meRef.current : null), deviceId) : undefined), [deviceId]);
  useEffect(() => {
    if (deviceId && !isDemoActive()) save({ deviceId, onboarded: state.onboarded, me: state.me, history: state.history });
  }, [deviceId, state.onboarded, state.me, state.history]);
  useEffect(() => { if (state.onboarded) rejoin(state.me); }, [state.onboarded, state.me.gender, state.me.campus, state.me.name]);
  // Adhan alerts on by default: schedule today's prayers + register for server push, then tell the server.
  useEffect(() => {
    if (!native || !state.onboarded || state.me.alerts === false) return;
    enableAlerts(state.me.gender).then((ok) => ok && rejoin(meRef.current));
  }, [state.onboarded, state.me.alerts, state.me.gender]);

  useEffect(() => {
    if (!native) return;
    // Tapping a real (scheduled) prayer notification opens the adhan flow.
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const prayer = res.notification.request.content.data?.prayer;
      // In live mode the server drives the group; offline, bots fill it in.
      if (prayer) startAdhan(dispatch, prayer, meRef.current.gender, !isLive);
    });
    return () => sub.remove();
  }, []);

  if (!deviceId || !fontsLoaded) return null; // brief, while storage + fonts load

  return (
    <SafeAreaProvider style={{ backgroundColor: C.canvas }}>
      <Store.Provider value={store}>
        <StatusBar style="auto" />
        {/* On laptops (web), keep a phone-width column centered. */}
        <View style={{ flex: 1, width: '100%', maxWidth: native ? undefined : 480, alignSelf: 'center', backgroundColor: C.canvas }}>
        {!state.onboarded ? (
          <Onboarding />
        ) : (
          <View style={{ flex: 1 }}>
            {/* Every tab stays mounted so chat, scroll position and the demo script survive tab switches. */}
            {Object.entries(SCREENS).map(([key, Screen]) => (
              <View key={key} style={{ flex: 1, display: state.tab === key ? 'flex' : 'none' }}>
                <Screen />
              </View>
            ))}
            <TabBar />
            <Takeover />
          </View>
        )}
        <StreakSheet />
        <ProfileSheet />
        </View>
      </Store.Provider>
    </SafeAreaProvider>
  );
}
