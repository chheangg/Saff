import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { C } from '../theme';
import { Avatar, Button, PopIn } from '../ui';
import { useStore } from '../store';

export default function Takeover() {
  const { state, dispatch } = useStore();
  const { adhan, group, me } = state;
  const free = group.members;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.black }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ gap: 8, marginTop: 48 }}>
          <Text style={{ color: C.accent, fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>ADHAN</Text>
          <Text style={{ color: C.white, fontSize: 72, fontWeight: '800', letterSpacing: -2 }}>{adhan.label}</Text>
          <Text style={{ color: C.g300, fontSize: 18 }}>{adhan.timeLabel} · UC San Diego</Text>
        </View>

        <View style={{ gap: 16 }}>
          <Text style={{ color: C.white, fontSize: 30, fontWeight: '700' }}>Free to pray?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 }}>
            <View style={{ flexDirection: 'row' }}>
              {free.map((u, i) => (
                <PopIn key={u.id} style={{ marginLeft: i ? -10 : 0 }}>
                  <Avatar user={u} size={36} />
                </PopIn>
              ))}
            </View>
            <Text style={{ color: C.g300, fontSize: 15 }}>
              {free.length ? `${free.length} ${me.gender}${free.length > 1 ? 's' : ''} nearby ${free.length > 1 ? 'are' : 'is'} free` : `Checking for ${me.gender}s nearby…`}
            </Text>
          </View>
        </View>

        <View style={{ gap: 8, marginBottom: 8 }}>
          <Button title="I'm free" variant="accent" onPress={() => dispatch({ type: 'RESPOND', answer: 'free' })} />
          <Button title="Not now" variant="ghost" onPress={() => dispatch({ type: 'RESPOND', answer: 'no' })} />
        </View>
      </View>
    </SafeAreaView>
  );
}
