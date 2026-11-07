import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, CARD, FLAME, T } from '../theme';
import { CAMPUSES, campusOf } from '../data';
import { Avatar, Button, PrayerDots } from '../ui';
import { useStore } from '../store';
import { instagramUrl, linkedinUrl, signOut } from '../profile';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const { state, dispatch } = useStore();
  const { me } = state;
  const [editing, setEditing] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const sub = [me.major, me.year].filter(Boolean).join(' · ');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => setEditing(true)} style={s.iconBtn} accessibilityLabel="Edit profile">
            <Ionicons name="create-outline" size={20} color={C.black} />
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Avatar user={me} size={88} />
          <Text style={[T.h1, { marginTop: 10 }]}>{me.name}</Text>
          {!!sub && <Text style={[T.body, { color: C.g700 }]}>{sub}</Text>}
          <Text style={T.meta}>
            {me.gender === 'sister' ? 'Sister' : 'Brother'} · {campusOf(me.campus).name}
          </Text>
        </View>

        <View style={[CARD, { padding: 18, gap: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LinearGradient colors={FLAME} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.badge}>
              <Ionicons name="flame" size={24} color={C.onColor} />
            </LinearGradient>
            <Text style={[T.h2, { color: C.flame }]}>{me.streak} day streak</Text>
          </View>
          <PrayerDots done={me.prayedToday ?? {}} showTimes={false} surface={C.g50} />
        </View>

        {(!!me.linkedin || !!me.instagram) && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!!me.linkedin && <Button title="LinkedIn" icon="logo-linkedin" variant="light" style={{ flex: 1 }} onPress={() => Linking.openURL(me.linkedin)} />}
            {!!me.instagram && <Button title="Instagram" icon="logo-instagram" variant="light" style={{ flex: 1 }} onPress={() => Linking.openURL(me.instagram)} />}
          </View>
        )}

        <Pressable onPress={() => setConfirmOut(true)} style={{ alignSelf: 'center', padding: 8 }}>
          <Text style={[T.meta, { color: C.g700 }]}>Sign out</Text>
        </Pressable>
      </ScrollView>

      <EditProfile visible={editing} me={me} onClose={() => setEditing(false)} onSave={(p) => { dispatch({ type: 'ME', me: p }); setEditing(false); }} />

      <Modal visible={confirmOut} transparent animationType="fade" onRequestClose={() => setConfirmOut(false)}>
        <View style={s.scrim}>
          <View style={[CARD, { padding: 22, gap: 12, width: '100%', maxWidth: 360 }]}>
            <Text style={T.h2}>Sign out?</Text>
            <Text style={T.meta}>This clears your profile and streak from this phone.</Text>
            <Button title="Sign out" onPress={signOut} />
            <Button title="Cancel" variant="ghost" style={{ height: 40 }} onPress={() => setConfirmOut(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EditProfile({ visible, me, onClose, onSave }) {
  const [p, setP] = useState(me);
  const set = (k) => (v) => setP({ ...p, [k]: v });
  // Reset the form each time it opens.
  const [openedFor, setOpenedFor] = useState(null);
  if (visible && openedFor !== me) { setOpenedFor(me); setP(me); }
  const save = () =>
    onSave({ name: p.name.trim() || me.name, campus: p.campus, gender: p.gender, major: p.major.trim(), year: p.year.trim(), linkedin: linkedinUrl(p.linkedin), instagram: instagramUrl(p.instagram) });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: C.canvas }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.bar}>
            <Pressable onPress={onClose} hitSlop={10}><Text style={{ fontSize: 16, color: C.g700 }}>Cancel</Text></Pressable>
            <Text style={{ fontSize: 17, fontWeight: '600' }}>Edit profile</Text>
            <Pressable onPress={save} hitSlop={10}><Text style={{ fontSize: 16, fontWeight: '600', color: C.brand }}>Save</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
              {CAMPUSES.map((c) => (
                <Pressable key={c.id} onPress={() => set('campus')(c.id)} style={[s.pill, p.campus === c.id && s.on]}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: p.campus === c.id ? C.onColor : C.black }}>{c.short}</Text>
                </Pressable>
              ))}
            </View>
            <View style={s.seg}>
              {['brother', 'sister'].map((g) => (
                <Pressable key={g} onPress={() => set('gender')(g)} style={[s.segItem, p.gender === g && s.on]}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: p.gender === g ? C.onColor : C.black }}>{g === 'brother' ? 'Brother' : 'Sister'}</Text>
                </Pressable>
              ))}
            </View>
            <View style={[CARD, { paddingHorizontal: 18 }]}>
              <Field label="Name" value={p.name} onChange={set('name')} caps="words" />
              <Field label="Major" value={p.major} onChange={set('major')} caps="words" placeholder="Optional" />
              <Field label="Year" value={p.year} onChange={set('year')} caps="words" placeholder="Optional" />
              <Field label="LinkedIn" value={p.linkedin} onChange={set('linkedin')} placeholder="@handle" />
              <Field label="Instagram" value={p.instagram} onChange={set('instagram')} placeholder="@handle" last />
            </View>
            <Text style={[T.meta, { textAlign: 'center' }]}>Changing campus or brother/sister moves you to that group.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder, caps = 'none', last }) {
  return (
    <View style={[s.field, !last && s.divider]}>
      <Text style={{ width: 84, fontSize: 16, fontWeight: '500' }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.g500} autoCapitalize={caps} autoCorrect={false} style={s.input} />
    </View>
  );
}

const s = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  pill: { paddingHorizontal: 18, height: 40, borderRadius: 20, backgroundColor: C.white, justifyContent: 'center' },
  seg: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 28, padding: 4 },
  segItem: { flex: 1, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: C.brand },
  field: { flexDirection: 'row', alignItems: 'center', height: 54 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.g300 },
  input: { flex: 1, fontSize: 16, color: C.black, fontFamily: 'Geist_400Regular', height: 54 },
});
