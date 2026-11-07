import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Store, initialState, isDemoActive, reducer, startAdhan } from './src/store';
import { loadSaved, save } from './src/persist';
import { connectLive, isLive, mirror, rejoin } from './src/live';
import TabBar from './src/TabBar';
import Onboarding from './src/screens/Onboarding';
import Home from './src/screens/Home';
import ChatTab from './src/screens/ChatTab';
import Food from './src/screens/Food';
import Profile from './src/screens/Profile';
import Takeover from './src/screens/Takeover';
import { ProfileSheet, StreakSheet } from './src/screens/Sheets';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SCREENS = { home: Home, chat: ChatTab, food: Food, profile: Profile };

export default function App() {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  // Every action goes to the reducer; the user's own actions are mirrored to the server in live mode.
  const dispatch = useMemo(() => (a) => { rawDispatch(a); mirror(a); }, []);
  const store = useMemo(() => ({ state, dispatch }), [state]);
  const meRef = useRef(state.me);
  meRef.current = state.me;

  const [deviceId, setDeviceId] = useState(null);

  // Restore profile + streak, then connect to the server with a stable id.
  useEffect(() => {
    loadSaved().then((saved) => {
      rawDispatch({ type: 'HYDRATE', onboarded: saved.onboarded, me: saved.me });
      setDeviceId(saved.deviceId);
    });
  }, []);
  useEffect(() => (deviceId ? connectLive(rawDispatch, () => meRef.current, deviceId) : undefined), [deviceId]);
  useEffect(() => {
    if (deviceId && !isDemoActive()) save({ deviceId, onboarded: state.onboarded, me: state.me });
  }, [deviceId, state.onboarded, state.me]);
  useEffect(() => { if (state.onboarded) rejoin(state.me); }, [state.onboarded, state.me.gender]);

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
    // Tapping a real (scheduled) prayer notification opens the adhan flow.
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const prayer = res.notification.request.content.data?.prayer;
      // In live mode the server drives the group; offline, bots fill it in.
      if (prayer) startAdhan(dispatch, prayer, meRef.current.gender, !isLive);
    });
    return () => sub.remove();
  }, []);

  if (!deviceId) return null; // brief, while storage loads

  return (
    <SafeAreaProvider>
      <Store.Provider value={store}>
        <StatusBar style="dark" />
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
      </Store.Provider>
    </SafeAreaProvider>
  );
}
