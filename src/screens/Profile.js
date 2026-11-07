import { Linking, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, T } from '../theme';
import { campusOf } from '../data';
import { Avatar, Button, PrayerDots } from '../ui';
import { useStore } from '../store';

export default function Profile() {
  const { state } = useStore();
  const { me } = state;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 6, marginTop: 16 }}>
          <Avatar user={me} size={96} />
          <Text style={[T.h1, { marginTop: 8 }]}>{me.name}</Text>
          <Text style={[T.body, { color: C.g700 }]}>
            {me.major} · {me.year}
          </Text>
          <Text style={T.meta}>
            {me.email} · {me.gender} · {campusOf(me.campus).name}
          </Text>
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.flameSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flame" size={28} color={C.flame} />
            </View>
            <View>
              <Text style={[T.h2, { color: C.flame }]}>{me.streak} day streak</Text>
              <Text style={T.meta}>Today</Text>
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
  card: { backgroundColor: C.white, borderRadius: 28, padding: 16, gap: 16 },
});
