import { useEffect, useMemo, useReducer, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Store, initialState, reducer, startAdhan } from './src/store';
import Onboarding from './src/screens/Onboarding';
import Home from './src/screens/Home';
import Takeover from './src/screens/Takeover';
import Matching from './src/screens/Matching';
import Chat from './src/screens/Chat';
import { ProfileSheet, StreakSheet } from './src/screens/Sheets';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const store = useMemo(() => ({ state, dispatch }), [state]);
  const gender = useRef(state.me.gender);
  gender.current = state.me.gender;

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
    // Tapping a real (scheduled) prayer notification opens the adhan flow.
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const prayer = res.notification.request.content.data?.prayer;
      if (prayer) startAdhan(dispatch, prayer, gender.current);
    });
    return () => sub.remove();
  }, []);

  const { onboarded, adhan, response, chatOpen } = state;
  let Screen = Home;
  if (!onboarded) Screen = Onboarding;
  else if (adhan && !response) Screen = Takeover;
  else if (response === 'free') Screen = chatOpen ? Chat : Matching;

  return (
    <SafeAreaProvider>
      <Store.Provider value={store}>
        <StatusBar style={Screen === Takeover ? 'light' : 'dark'} />
        <Screen />
        <StreakSheet />
        <ProfileSheet />
      </Store.Provider>
    </SafeAreaProvider>
  );
}
