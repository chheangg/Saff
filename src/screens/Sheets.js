import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, T } from '../theme';
import { Avatar, Button, Sheet, WeekRow } from '../ui';
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

  const close = () => dispatch({ type: 'CLOSE_STREAK' });
  return (
    <Modal visible={!!info} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: C.canvas }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 24 }}>
          <View style={{ width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ transform: [{ scale: pop }] }}>
              <Ionicons name="flame" size={110} color={C.flame} />
            </Animated.View>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 96, fontWeight: '700', letterSpacing: -4, color: C.flame, lineHeight: 104 }}>{n}</Text>
            <Text style={{ fontSize: 24, fontWeight: '600', letterSpacing: -0.8 }}>day streak</Text>
          </View>
          <Text style={[T.body, { color: C.g700, textAlign: 'center', maxWidth: 300, lineHeight: 22 }]}>
            Prayed {state.adhan?.label ?? ''} with {Math.max(0, state.group.members.length - 1)} {state.me.gender}s
          </Text>
          <View style={{ alignSelf: 'stretch', backgroundColor: C.white, borderRadius: 28, padding: 16 }}>
            <WeekRow streak={n} prayedToday={n === info?.to} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Button title="Continue" onPress={close} />
        </View>
      </SafeAreaView>
    </Modal>
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
