import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { C, T } from '../theme';
import { Avatar, Button, PopIn } from '../ui';
import { useStore } from '../store';

const R = 110; // orbit radius
const SPOTS = [-90, -18, 54, 126, 198, 270].map((deg) => (deg * Math.PI) / 180);

function Pulse({ delay }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 2400, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 2 * R,
        height: 2 * R,
        borderRadius: R,
        backgroundColor: C.accent,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.3] }) }],
      }}
    />
  );
}

export default function Matching() {
  const { state, dispatch } = useStore();
  const { me, group } = state;
  const others = group.members.filter((u) => u.id !== 'me');

  useEffect(() => {
    if (others.length) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (others.length >= 4) {
      const t = setTimeout(() => dispatch({ type: 'OPEN_CHAT' }), 1400);
      return () => clearTimeout(t);
    }
  }, [others.length]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.white }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ gap: 6, marginTop: 24 }}>
          <Text style={T.h1}>{others.length ? `${others.length} ${me.gender}s are free` : `Finding ${me.gender}s nearby…`}</Text>
          <Text style={[T.body, { color: C.g700 }]}>We'll open a group chat for this prayer. It disappears in 30 min.</Text>
        </View>

        <View style={{ height: 2 * R + 80, alignItems: 'center', justifyContent: 'center' }}>
          <Pulse delay={0} />
          <Pulse delay={1200} />
          <Avatar user={me} size={72} ring />
          {others.slice(0, SPOTS.length).map((u, i) => (
            <View
              key={u.id}
              style={{ position: 'absolute', transform: [{ translateX: R * Math.cos(SPOTS[i]) }, { translateY: R * Math.sin(SPOTS[i]) }] }}
            >
              <PopIn style={{ alignItems: 'center' }}>
                <Avatar user={u} size={48} ring />
                <Text style={[T.meta, { color: C.black, marginTop: 2 }]}>{u.name}</Text>
              </PopIn>
            </View>
          ))}
        </View>

        <Button title="Open group chat" disabled={!others.length} onPress={() => dispatch({ type: 'OPEN_CHAT' })} />
      </View>
    </SafeAreaView>
  );
}
