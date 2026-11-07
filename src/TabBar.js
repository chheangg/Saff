import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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

// Floating frosted-glass capsule, icons only; the active tab is an indigo circle.
export default function TabBar() {
  const { state, dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const live = state.response === 'free'; // an active jama'ah group exists

  return (
    <View style={[s.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <BlurView intensity={40} tint="light" style={s.bar}>
        {TABS.map((t) => {
          const active = state.tab === t.key;
          return (
            <Pressable
              key={t.key}
              accessibilityLabel={t.label}
              style={[s.item, active && s.active]}
              onPress={() => {
                if (!active) Haptics.selectionAsync().catch(() => {});
                dispatch({ type: 'TAB', tab: t.key });
              }}
            >
              <Ionicons name={active ? t.icon : `${t.icon}-outline`} size={22} color={active ? C.white : C.g700} />
              {t.key === 'chat' && live && <View style={s.dot} />}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 6, backgroundColor: C.canvas },
  bar: {
    flexDirection: 'row',
    gap: 18,
    padding: 6,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  item: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: C.brand },
  dot: { position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.white },
});
