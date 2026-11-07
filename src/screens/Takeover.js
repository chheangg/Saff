import { useEffect, useRef } from 'react';
import { Animated, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { C } from '../theme';
import { Avatar, Button, PopIn } from '../ui';
import { useStore } from '../store';
import { campusOf } from '../data';

// iOS-notification-style popup that drops in over whatever tab you're on.
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
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', paddingTop: insets.top + 8, paddingHorizontal: 12 }}>
        <Animated.View
          style={{
            backgroundColor: C.black,
            borderRadius: 24,
            padding: 20,
            gap: 16,
            opacity: drop,
            transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: C.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1.5 }}>SAFF · NOW</Text>
            <Text style={{ color: C.g500, fontSize: 13 }}>{adhan.timeLabel} · {campusOf(me.campus).name}</Text>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ color: C.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>It's {adhan.label}</Text>
            <Text style={{ color: C.g300, fontSize: 17 }}>Are you free to join us right now?</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 36 }}>
            <View style={{ flexDirection: 'row' }}>
              {free.map((u, i) => (
                <PopIn key={u.id} style={{ marginLeft: i ? -10 : 0 }}>
                  <Avatar user={u} size={32} />
                </PopIn>
              ))}
            </View>
            <Text style={{ color: C.g300, fontSize: 14, flex: 1 }}>
              {free.length ? `${free.length} ${me.gender}${free.length > 1 ? 's' : ''} nearby ${free.length > 1 ? 'are' : 'is'} free` : `Checking for ${me.gender}s nearby…`}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="No" variant="light" style={{ flex: 1, height: 48 }} onPress={() => dispatch({ type: 'RESPOND', answer: 'no' })} />
            <Button title="Yes, I'm free" variant="accent" style={{ flex: 2, height: 48 }} onPress={() => dispatch({ type: 'RESPOND', answer: 'free' })} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
