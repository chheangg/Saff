import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, T } from '../theme';
import { Button } from '../ui';
import { useStore } from '../store';

const UCSD = '32.8801,-117.2340';

// Opens Apple Maps with a search centered on campus. Real results, nothing hardcoded.
const openMaps = (q) => Linking.openURL(`http://maps.apple.com/?q=${encodeURIComponent(q)}&sll=${UCSD}`);

const SEARCHES = [
  { q: 'halal food', title: 'Closest halal food', sub: 'Nearest to campus right now', icon: 'navigate' },
  { q: 'halal restaurant', title: 'Sit-down halal', sub: 'Restaurants for the group', icon: 'restaurant' },
  { q: 'halal grill kebab shawarma', title: 'Quick bites', sub: 'Shawarma, kebab, grills', icon: 'flash' },
  { q: 'halal dessert cafe', title: 'Coffee & dessert', sub: 'Somewhere to keep talking', icon: 'cafe' },
];

export default function Food() {
  const { state, dispatch } = useStore();
  const inGroup = state.response === 'free';

  function askGroup() {
    dispatch({ type: 'MESSAGE', userId: 'me', text: 'Anyone want halal food after? I can look up the closest spot 🍽' });
    dispatch({ type: 'TAB', tab: 'chat' });
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.white }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View style={{ gap: 4, marginTop: 8 }}>
          <Text style={T.h1}>Halal food</Text>
          <Text style={[T.body, { color: C.g700 }]}>Hit it off after prayer? Grab food together. Tap a search and Apple Maps gives you directions.</Text>
        </View>

        {inGroup && (
          <View style={s.card}>
            <Text style={T.body}>Your jama'ah is still open. Ask if anyone wants to eat.</Text>
            <Button title="Ask the group" variant="accent" onPress={askGroup} />
          </View>
        )}

        <View style={{ gap: 10 }}>
          {SEARCHES.map((x, i) => (
            <Pressable key={x.q} onPress={() => openMaps(x.q)} style={({ pressed }) => [s.row, i === 0 && s.primary, pressed && { opacity: 0.8 }]}>
              <View style={[s.icon, i === 0 && { backgroundColor: C.accent }]}>
                <Ionicons name={x.icon} size={22} color={C.black} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[T.body, { fontWeight: '700' }]}>{x.title}</Text>
                <Text style={T.meta}>{x.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.g500} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.g50, borderRadius: 12, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, backgroundColor: C.g50 },
  primary: { borderWidth: 2, borderColor: C.black },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.g100, alignItems: 'center', justifyContent: 'center' },
});
