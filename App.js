import { useEffect, useMemo, useReducer, useRef } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Store, initialState, reducer, startAdhan } from './src/store';
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
