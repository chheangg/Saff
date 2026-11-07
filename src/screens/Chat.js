import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, T, avatarColor } from '../theme';
import { Avatar, Button } from '../ui';
import { campusOf } from '../data';
import { botReply, playChat, useStore } from '../store';
import { fmtIn } from '../prayer';

export default function Chat() {
  const { state, dispatch } = useStore();
  const { me, adhan, group } = state;
  const campusSpots = campusOf(me.campus).spots;
  const stat = (id) => group.spotStats?.[id] ?? {};
  // Spots your group has used most come first; the one used last time for this prayer leads.
  const spots = [...campusSpots].sort((a, b) => (stat(b.id).last ? 1e6 : 0) + (stat(b.id).count ?? 0) - ((stat(a.id).last ? 1e6 : 0) + (stat(a.id).count ?? 0)));
  const pinned = campusSpots.find((p) => p.id === group.spot);
  const [text, setText] = useState('');
  const [now, setNow] = useState(Date.now());
  const list = useRef(null);
  const replied = useRef(false);
  const byId = Object.fromEntries(group.members.map((u) => [u.id, u]));

  useEffect(() => {
    playChat(dispatch, me.gender);
    const t = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  function send(t) {
    const body = (t ?? text).trim();
    if (!body) return;
    dispatch({ type: 'MESSAGE', userId: 'me', text: body });
    setText('');
    if (!replied.current) {
      replied.current = true;
      botReply(dispatch, me.gender);
    }
  }

  const data = [{ id: 'sys', system: true }, ...group.messages];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.canvas }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.8 }}>{adhan.label} jama'ah</Text>
            <View style={s.timer}>
              <Ionicons name="timer-outline" size={15} color={C.flame} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.flame }}>{fmtIn(group.expiresAt - now)} left</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {group.members.map((u) => (
              <Pressable key={u.id} onPress={() => dispatch({ type: 'PROFILE', user: u })} style={{ alignItems: 'center', gap: 3 }}>
                <Avatar user={u} size={46} />
                <Text style={{ fontSize: 12, fontWeight: '600' }}>{u.id === 'me' ? 'You' : u.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Ionicons name="flame" size={11} color={C.flame} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: C.flame }}>{u.streak}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          ref={list}
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            pinned ? (
              <View style={s.pinned}>
                <Ionicons name="location" size={22} color={C.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: C.accentDark }}>Meeting at {pinned.name}</Text>
                  <Text style={{ fontSize: 12, color: C.accentDark }}>
                    {pinned.walk} min walk{stat(pinned.id).last ? ` · usual ${adhan.label} spot` : ''}
                  </Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item: m }) => {
            if (m.system) {
              return <Text style={[T.meta, { textAlign: 'center', marginVertical: 4, color: C.g500 }]}>Pick a spot · pray together</Text>;
            }
            const mine = m.userId === 'me';
            const u = byId[m.userId];
            return (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                {!mine && u && <Avatar user={u} size={30} />}
                <View style={[s.bubble, mine ? s.mine : s.theirs]}>
                  {!mine && <Text style={{ fontSize: 12, fontWeight: '600', color: avatarColor(m.userId) }}>{u?.name}</Text>}
                  <Text style={{ fontSize: 15, color: mine ? C.white : C.black }}>{m.text}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={s.composer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {spots.map((p) => {
              const st = stat(p.id);
              const on = group.spot === p.id;
              const hint = st.last ? `Last ${adhan.label}` : st.count ? `Met ${st.count}×` : `${p.walk} min`;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    dispatch({ type: 'PIN_SPOT', spotId: p.id });
                    send(`Meet at ${p.name}? (${p.walk} min walk)`);
                  }}
                  style={[s.chip, on && s.chipOn]}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600' }}>📍 {p.name}</Text>
                  <Text style={{ fontSize: 11, color: on || st.last ? C.accentDark : C.g700 }}>{hint}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => dispatch({ type: 'TAB', tab: 'food' })} style={s.chip}>
              <Text style={{ fontSize: 14, fontWeight: '600' }}>🍽 Halal food</Text>
              <Text style={{ fontSize: 11, color: C.g700 }}>after prayer</Text>
            </Pressable>
          </ScrollView>
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            <View style={s.inputRow}>
              <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={C.g500} style={s.input} onSubmitEditing={() => send()} returnKeyType="send" />
              <Pressable onPress={() => send()} style={s.send}>
                <Ionicons name="arrow-up" size={20} color={C.white} />
              </Pressable>
            </View>
            <Button title="We prayed" icon="checkmark-circle" variant="accent" onPress={() => dispatch({ type: 'PRAYED' })} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14, gap: 12, backgroundColor: C.canvas },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: C.white },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 2 },
  mine: { backgroundColor: C.brand, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: C.white, borderBottomLeftRadius: 6 },
  pinned: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 24, backgroundColor: C.accentSoft, marginBottom: 4 },
  composer: { gap: 12, paddingTop: 8, paddingBottom: 12, backgroundColor: C.canvas },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: C.white, gap: 1 },
  chipOn: { backgroundColor: C.accentSoft },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, height: 46, borderRadius: 23, backgroundColor: C.white, paddingHorizontal: 16, fontSize: 16, fontFamily: 'Geist_400Regular' },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
});
