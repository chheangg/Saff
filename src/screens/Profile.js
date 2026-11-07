import { Linking, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, T } from '../theme';
import { Avatar, Button, PrayerDots } from '../ui';
import { useStore } from '../store';

export default function Profile() {
  const { state } = useStore();
  const { me } = state;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.white }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 6, marginTop: 16 }}>
          <Avatar user={me} size={96} />
          <Text style={[T.h1, { marginTop: 8 }]}>{me.name}</Text>
          <Text style={[T.body, { color: C.g700 }]}>
            {me.major} · {me.year}
          </Text>
          <Text style={T.meta}>
            {me.email} · {me.gender} · UC San Diego
          </Text>
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 34 }}>🔥</Text>
            <View>
              <Text style={T.h2}>{me.streak}-day streak</Text>
              <Text style={T.meta}>Today's prayers</Text>
            </View>
          </View>
          <PrayerDots done={me.prayedToday} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {!!me.linkedin && <Button title="LinkedIn" style={{ flex: 1 }} onPress={() => Linking.openURL(me.linkedin)} />}
          {!!me.instagram && <Button title="Instagram" variant="light" style={{ flex: 1 }} onPress={() => Linking.openURL(me.instagram)} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.g50, borderRadius: 12, padding: 16, gap: 16 },
});
