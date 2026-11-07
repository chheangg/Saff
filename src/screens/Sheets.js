import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, T } from '../theme';
import { Avatar, Button, PrayerDots, Sheet } from '../ui';
import { useStore } from '../store';
import { nextPrayer } from '../prayer';
import { campusOf } from '../data';

export function StreakSheet() {
  const { state, dispatch } = useStore();
  const info = state.streakSheet;
  const [n, setN] = useState(info?.from ?? 0);
  const pop = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!info) return;
    setN(info.from);
    pop.setValue(0.6);
    const t = setTimeout(() => {
      setN(info.to);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.spring(pop, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }).start();
    }, 700);
    return () => clearTimeout(t);
  }, [info]);

  return (
    <Sheet visible={!!info} onClose={() => dispatch({ type: 'CLOSE_STREAK' })}>
      <View style={{ alignItems: 'center', gap: 4, paddingTop: 8 }}>
        <Animated.Text style={{ fontSize: 88, transform: [{ scale: pop }] }}>🔥</Animated.Text>
        <Text style={{ fontSize: 64, fontWeight: '800', letterSpacing: -2 }}>{n}</Text>
        <Text style={T.h2}>day streak</Text>
        <Text style={[T.meta, { marginTop: 4 }]}>Keep it going at {nextPrayer().label}, insha'Allah.</Text>
      </View>
      <PrayerDots done={state.me.prayedToday} />
      <Button title="Done" onPress={() => dispatch({ type: 'CLOSE_STREAK' })} />
    </Sheet>
  );
}

export function ProfileSheet() {
  const { state, dispatch } = useStore();
  const u = state.profile;
  const close = () => dispatch({ type: 'PROFILE', user: null });
  return (
    <Sheet visible={!!u} onClose={close}>
      {u && (
        <>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Avatar user={u} size={80} />
            <Text style={[T.h2, { marginTop: 8 }]}>{u.name}</Text>
            <Text style={[T.body, { color: C.g700 }]}>
              {u.major} · {u.year}
            </Text>
            <Text style={T.meta}>🔥 {u.streak}-day streak · {campusOf(u.campus ?? state.me.campus).name}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!!u.linkedin && <Button title="LinkedIn" style={{ flex: 1 }} onPress={() => Linking.openURL(u.linkedin)} />}
            {!!u.instagram && <Button title="Instagram" variant="light" style={{ flex: 1 }} onPress={() => Linking.openURL(u.instagram)} />}
          </View>
        </>
      )}
    </Sheet>
  );
}
