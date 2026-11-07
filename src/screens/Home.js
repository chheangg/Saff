import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { C, T } from '../theme';
import { Avatar, Button, PrayerDots } from '../ui';
import { playDemo, scheduleToday, stopDemo, useStore } from '../store';
import { fmtIn, fmtTime, nextPrayer } from '../prayer';

export default function Home() {
  const { state, dispatch } = useStore();
  const { me, adhan, response } = state;
  const [now, setNow] = useState(new Date());
  const [notify, setNotify] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const next = nextPrayer(now);

  async function toggleNotify(on) {
    setNotify(on);
    if (!on) return Notifications.cancelAllScheduledNotificationsAsync();
    const { granted } = await Notifications.requestPermissionsAsync();
    if (granted) scheduleToday(me.gender);
    else setNotify(false);
  }

  // Hidden presenter menu: long-press the wordmark.
  function demoMenu() {
    Alert.alert('Demo', 'Recording tip: lock the phone or go home after tapping Play to catch the notification.', [
      { text: 'Play demo', onPress: () => playDemo(dispatch, me) },
      { text: 'Reset', onPress: () => { stopDemo(); dispatch({ type: 'RESET' }); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <View style={{ flex: 1, padding: 16, gap: 24 }}>
        <View style={s.header}>
          <Pressable onLongPress={demoMenu} delayLongPress={600}>
            <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>Saff</Text>
          </Pressable>
          <Pressable onPress={() => dispatch({ type: 'PROFILE', user: me })}>
            <Avatar user={me} size={36} />
          </Pressable>
        </View>

        <View style={{ gap: 4, marginTop: 16 }}>
          <Text style={T.meta}>Next prayer</Text>
          <Text style={{ fontSize: 56, fontWeight: '800', letterSpacing: -1.5 }}>{next.label}</Text>
          <Text style={[T.body, { color: C.g700 }]}>
            {fmtTime(next.time)} · in {fmtIn(next.time - now)}
          </Text>
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 34 }}>🔥</Text>
            <View>
              <Text style={T.h2}>{me.streak}-day streak</Text>
              <Text style={T.meta}>Pray one jama'ah a day to keep it going</Text>
            </View>
          </View>
          <PrayerDots done={me.prayedToday} />
        </View>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={T.meta}>Today across the Manara network</Text>
            <Text style={[T.body, { fontWeight: '600' }]}>
              {state.network.prayers} jama'ah prayers · {state.network.campuses} campuses
            </Text>
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={[T.body, { fontWeight: '600' }]}>Ping me at every adhan</Text>
            <Text style={T.meta}>Only {me.gender}s within 10 min walk</Text>
          </View>
          <Switch value={notify} onValueChange={toggleNotify} trackColor={{ true: C.accent }} />
        </View>

        {adhan && response === 'no' && (
          <View style={[s.card, { gap: 12 }]}>
            <Text style={T.body}>You skipped {adhan.label}. The group is still open.</Text>
            <Button title="Join anyway" variant="light" onPress={() => dispatch({ type: 'RESPOND', answer: 'free' })} />
          </View>
        )}
        {adhan && response === 'prayed' && (
          <Text style={[T.body, { color: C.g700 }]}>You prayed {adhan.label} in jama'ah today.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { backgroundColor: C.g50, borderRadius: 12, padding: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
