import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, T } from '../theme';
import { Avatar, Button } from '../ui';
import { SPOTS } from '../data';
import { botReply, playChat, useStore } from '../store';
import { fmtIn } from '../prayer';

export default function Chat() {
  const { state, dispatch } = useStore();
  const { me, adhan, group } = state;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={T.h2}>{adhan.label} jama'ah</Text>
              <Text style={T.meta}>
                {group.members.length} {me.gender}s · expires in {fmtIn(group.expiresAt - now)}
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {group.members.map((u) => (
              <Pressable key={u.id} onPress={() => dispatch({ type: 'PROFILE', user: u })} style={{ alignItems: 'center', gap: 2 }}>
                <Avatar user={u} size={44} />
                <Text style={[T.meta, { color: C.black, fontSize: 12 }]}>
                  {u.id === 'me' ? 'You' : u.name} · 🔥{u.streak}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          ref={list}
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: m }) => {
            if (m.system) {
              return <Text style={[T.meta, { textAlign: 'center', marginVertical: 8 }]}>Group formed. Pick a spot and pray together.</Text>;
            }
            const mine = m.userId === 'me';
            const u = byId[m.userId];
            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                {!mine && <Text style={[T.meta, { marginLeft: 12, marginBottom: 2 }]}>{u?.name}</Text>}
                <View style={[s.bubble, mine ? s.mine : s.theirs]}>
                  <Text style={[T.body, { color: mine ? C.white : C.black }]}>{m.text}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={{ gap: 10, paddingBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {SPOTS.map((p) => (
              <Pressable key={p.id} onPress={() => send(`Meet at ${p.name}? (${p.walk} min walk)`)} style={s.chip}>
                <Text style={{ fontSize: 14, fontWeight: '600' }}>📍 {p.name}</Text>
                <Text style={[T.meta, { fontSize: 12 }]}>{p.walk} min</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            <View style={s.inputRow}>
              <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor={C.g500} style={s.input} onSubmitEditing={() => send()} returnKeyType="send" />
              <Pressable onPress={() => send()} style={s.send}>
                <Text style={{ color: C.white, fontWeight: '700' }}>↑</Text>
              </Pressable>
            </View>
            <Button title="We prayed ✓" variant="accent" onPress={() => dispatch({ type: 'PRAYED' })} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderColor: C.g100 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { backgroundColor: C.black, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: C.g100, borderBottomLeftRadius: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, height: 44, borderRadius: 22, backgroundColor: C.g50, paddingHorizontal: 16, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' },
});
