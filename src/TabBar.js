import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C } from './theme';
import { useStore } from './store';

export const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'chat', label: 'Chat', icon: 'chatbubble' },
  { key: 'food', label: 'Halal Food', icon: 'restaurant' },
  { key: 'profile', label: 'Profile', icon: 'person' },
];

export default function TabBar() {
  const { state, dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const live = state.response === 'free'; // an active jama'ah group exists

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const active = state.tab === t.key;
        return (
          <Pressable
            key={t.key}
            style={s.item}
            onPress={() => {
              if (!active) Haptics.selectionAsync().catch(() => {});
              dispatch({ type: 'TAB', tab: t.key });
            }}
          >
            <View>
              <Ionicons name={active ? t.icon : `${t.icon}-outline`} size={24} color={active ? C.black : C.g500} />
              {t.key === 'chat' && live && <View style={s.dot} />}
            </View>
            <Text style={[s.label, { color: active ? C.black : C.g500 }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: C.white, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.g300, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  label: { fontSize: 10, fontWeight: '600' },
  dot: { position: 'absolute', top: -1, right: -4, width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.white },
});
