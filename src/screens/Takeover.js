import { useEffect, useRef } from 'react';
import { Animated, Image, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { C, T } from '../theme';
import { Avatar, Button, PopIn } from '../ui';
import { useStore } from '../store';
import { campusOf } from '../data';

const MOON = require('../../assets/mascot/moon-wave.png');

// Bottom-sheet popup that drops in over whatever tab you're on.
export default function Takeover() {
  const { state, dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const { adhan, response, group, me } = state;
  const free = group.members;
  const drop = useRef(new Animated.Value(0)).current;
  const visible = !!adhan && !response;

  useEffect(() => {
    if (!visible) return;
    drop.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.spring(drop, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
  }, [visible]);

  if (!adhan) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(11,11,15,0.5)', justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 480,
            alignSelf: 'center',
            backgroundColor: C.white,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
            gap: 16,
            alignItems: 'center',
            transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
          }}
        >
          <Image source={MOON} style={{ width: 96, height: 96 }} resizeMode="contain" />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={[T.kicker, { color: C.brand }]}>Adhan · {adhan.timeLabel} · {campusOf(me.campus).short}</Text>
            <Text style={{ fontSize: 30, fontWeight: '700', letterSpacing: -1, color: C.black }}>It's {adhan.label} time!</Text>
            <Text style={[T.body, { color: C.g700, textAlign: 'center' }]}>
              {free.length ? `${free.length} ${me.gender}${free.length > 1 ? 's' : ''} nearby ${free.length > 1 ? 'are' : 'is'} free` : `Finding ${me.gender}s nearby…`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', minHeight: 44 }}>
            {free.map((u, i) => (
              <PopIn key={u.id} style={{ marginLeft: i ? -10 : 0 }}>
                <Avatar user={u} size={44} ring />
              </PopIn>
            ))}
          </View>
          <Button title="Yes, I'm free" variant="accent" style={{ alignSelf: 'stretch' }} onPress={() => dispatch({ type: 'RESPOND', answer: 'free' })} />
          <Button title="Not now" variant="ghost" style={{ alignSelf: 'stretch', height: 40 }} onPress={() => dispatch({ type: 'RESPOND', answer: 'no' })} />
        </Animated.View>
      </View>
    </Modal>
  );
}
