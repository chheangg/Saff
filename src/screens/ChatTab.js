import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, CARD, T, avatarColor } from '../theme';
import { Avatar } from '../ui';
import { useStore } from '../store';
import { campusOf, demoHistory } from '../data';
import Matching from './Matching';
import Chat from './Chat';

// The Chat tab: the live group while you're in one; otherwise your past jama'ahs.
// Tap a past chat, then tap anyone to see their profile (LinkedIn / Instagram).
export default function ChatTab() {
  const { state } = useStore();
  const { response, chatOpen, history, me } = state;
  const [open, setOpen] = useState(null);

  if (response === 'free') return chatOpen ? <Chat /> : <Matching />;

  const spotName = (c) => c.spot ?? campusOf(me.campus).spots.find((p) => p.id === c.spotId)?.name ?? 'Campus';
  const chats = [...history, ...demoHistory(me.gender)];

  if (open) return <PastChat chat={open} spot={spotName(open)} onBack={() => setOpen(null)} />;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.canvas }}>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        ListHeaderComponent={
          <View style={{ gap: 4, marginBottom: 8 }}>
            <Text style={T.h1}>Chats</Text>
            <Text style={T.meta}>{response === 'prayed' ? 'Jama\'ah done. Find your people below.' : 'Say yes at the next adhan to start one.'}</Text>
          </View>
        }
        renderItem={({ item: c }) => (
          <Pressable onPress={() => setOpen(c)} style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}>
            <View style={{ flexDirection: 'row', width: 64 }}>
              {c.members.slice(0, 3).map((u, i) => (
                <View key={u.id} style={{ marginLeft: i ? -14 : 0 }}>
                  <Avatar user={u} size={34} ring />
                </View>
              ))}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>{c.prayer} jama'ah</Text>
              <Text style={T.meta} numberOfLines={1}>
                {c.when} · {spotName(c)} · {c.members.length + 1} {me.gender}s
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.g500} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function PastChat({ chat, spot, onBack }) {
  const { state, dispatch } = useStore();
  const byId = Object.fromEntries(chat.members.map((u) => [u.id, u]));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.canvas }}>
      <View style={s.head}>
        <Pressable onPress={onBack} hitSlop={12} style={s.back} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={C.black} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.5 }}>{chat.prayer} jama'ah</Text>
          <Text style={T.meta}>{chat.when} · {spot}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        <Text style={T.kicker}>Tap to connect</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingVertical: 4 }}>
          {chat.members.map((u) => (
            <Pressable key={u.id} onPress={() => dispatch({ type: 'PROFILE', user: u })} style={{ alignItems: 'center', gap: 4 }}>
              <Avatar user={u} size={52} />
              <Text style={{ fontSize: 12, fontWeight: '600' }}>{u.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={chat.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        ListFooterComponent={<Text style={[T.meta, { textAlign: 'center', marginTop: 8, color: C.g500 }]}>This chat has ended</Text>}
        renderItem={({ item: m }) => {
          const mine = m.userId === 'me';
          const u = byId[m.userId];
          return (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              {!mine && u && (
                <Pressable onPress={() => dispatch({ type: 'PROFILE', user: u })}>
                  <Avatar user={u} size={30} />
                </Pressable>
              )}
              <View style={[s.bubble, mine ? s.mine : s.theirs]}>
                {!mine && <Text style={{ fontSize: 12, fontWeight: '600', color: avatarColor(m.userId) }}>{u?.name}</Text>}
                <Text style={{ fontSize: 15, color: mine ? C.onColor : C.black }}>{m.text}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  row: { ...CARD, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 14 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 2 },
  mine: { backgroundColor: C.brand, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: C.white, borderBottomLeftRadius: 6 },
});
