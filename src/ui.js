import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, T } from './theme';
import { PRAYERS, LABEL } from './prayer';

export function Avatar({ user, size = 40, ring = false }) {
  const initials = user.name.slice(0, 1).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: user.id === 'me' ? C.black : C.g100,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: C.white,
      }}
    >
      <Text style={{ fontSize: size * 0.42, fontWeight: '700', color: user.id === 'me' ? C.white : C.black }}>{initials}</Text>
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled, style }) {
  const v = {
    primary: { bg: C.black, fg: C.white },
    accent: { bg: C.accent, fg: C.black },
    ghost: { bg: 'transparent', fg: C.g500 },
    light: { bg: C.g100, fg: C.black },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: v.bg, opacity: disabled ? 0.3 : pressed ? 0.8 : 1 }, style]}
    >
      <Text style={[s.btnText, { color: v.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function PrayerDots({ done }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {PRAYERS.map((p) => (
        <View key={p} style={{ alignItems: 'center', flex: 1, gap: 6 }}>
          <View style={[s.dot, done[p] && { backgroundColor: C.accent, borderColor: C.accent }]} />
          <Text style={[T.meta, { fontSize: 11 }]}>{LABEL[p]}</Text>
        </View>
      ))}
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
  btn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  btnText: { fontSize: 17, fontWeight: '600' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.g300 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 44, gap: 16 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.g300, marginTop: -8 },
});
