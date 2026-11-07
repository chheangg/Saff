import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { C, T, avatarColor } from './theme';
import { PRAYERS, LABEL, times, fmtTime } from './prayer';

export function Avatar({ user, size = 40, ring = false }) {
  const initials = (user.name || '?').slice(0, 1).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarColor(user.id),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: C.white,
      }}
    >
      <Text style={{ fontSize: size * 0.42, fontWeight: '600', color: C.onColor }}>{initials}</Text>
    </View>
  );
}

// Pill buttons. primary = ink, accent = emerald, brand = indigo, light = soft gray, ghost = text only.
export function Button({ title, onPress, variant = 'primary', disabled, style, icon }) {
  const v = {
    primary: { bg: C.black, fg: C.white },
    accent: { bg: C.accent, fg: C.onColor },
    brand: { bg: C.brand, fg: C.onColor },
    ghost: { bg: 'transparent', fg: C.g700 },
    light: { bg: C.white, fg: C.black },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: v.bg, borderWidth: v.border ? 1 : 0, borderColor: v.border, opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={v.fg} />}
      <Text style={[s.btnText, { color: v.fg }]}>{title}</Text>
    </Pressable>
  );
}

// Today's five prayers as a path of nodes: done (emerald check), current (indigo ring), upcoming (muted lock).
export function PrayerDots({ done, current, showTimes = true, surface }) {
  const t = Object.fromEntries(times().map((p) => [p.key, p.time]));
  const now = new Date();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {PRAYERS.map((p) => {
        const isDone = !!done[p];
        const isNow = !isDone && p === current;
        const missed = !isDone && !isNow && t[p] <= now;
        return (
          <View key={p} style={{ alignItems: 'center', gap: 6 }}>
            <View style={[s.node, surface && { backgroundColor: surface }, isDone && s.nodeDone, isNow && s.nodeNow]}>
              <Ionicons name={isDone ? 'checkmark' : isNow ? 'moon' : missed ? 'remove' : 'lock-closed'} size={isDone ? 24 : 20} color={isDone || isNow ? C.onColor : C.g300} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: isDone || isNow ? C.black : C.g700 }}>{LABEL[p]}</Text>
            {showTimes && <Text style={{ fontSize: 11, color: C.g700 }}>{fmtTime(t[p]).replace(/ (AM|PM)/, '')}</Text>}
          </View>
        );
      })}
    </View>
  );
}

// Monday-first week row for the streak; days before today filled while the streak covers them.
export function WeekRow({ streak, prayedToday }) {
  const today = (new Date().getDay() + 6) % 7;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {'MTWTFSS'.split('').map((d, i) => {
        const filled = (i < today && today - i <= streak - (prayedToday ? 1 : 0)) || (i === today && prayedToday);
        return (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <Text style={[T.kicker, { color: i === today ? C.flame : C.g500 }]}>{d}</Text>
            <View style={[s.day, filled && { backgroundColor: C.flame }, i === today && !filled && { borderWidth: 2, borderColor: C.flame, backgroundColor: C.flameSoft }]}>
              {filled && <Ionicons name="checkmark" size={15} color={C.onColor} />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function Sheet({ visible, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.grabber} />
        {children}
      </View>
    </Modal>
  );
}

// Fades + scales a child in on mount.
export function PopIn({ children, delay = 0, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay, useNativeDriver: true, friction: 6 }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, flexDirection: 'row', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '600' },
  node: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  nodeDone: { backgroundColor: C.accent },
  nodeNow: { backgroundColor: C.brand, shadowColor: C.brand, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  day: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.g100, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, gap: 16 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.g300, marginTop: -8 },
});
