import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, CARD, T } from '../theme';
import { Button } from '../ui';
import { useStore } from '../store';
import { CAMPUSES, ME, campusOf } from '../data';

const MOON = require('../../assets/mascot/moon-wave.png');

// Real users start blank with a 0-day streak; "Use demo profile" fills in Evan (6-day streak) for the video.
const BLANK = { name: '', email: '', campus: 'ucsd', gender: 'brother', major: '', year: '', linkedin: '', instagram: '', streak: 0, prayedToday: {} };

// Accept "@handle", "linkedin.com/in/x" or a full URL.
const toUrl = (v, base) => {
  const t = v.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  if (t.includes('.')) return `https://${t}`;
  return `${base}${t.replace(/^@/, '')}`;
};

export default function Onboarding() {
  const { dispatch } = useStore();
  const [p, setP] = useState(BLANK);
  const [more, setMore] = useState(false);
  const set = (k) => (v) => setP({ ...p, [k]: v });
  const campus = campusOf(p.campus);
  // Accept the campus domain and its subdomains (e.g. student.sdccd.edu).
  const emailOk = new RegExp(`[@.]${campus.domain.replace('.', '\\.')}$`, 'i').test(p.email.trim());
  const valid = p.name.trim() && emailOk;

  const finish = (profile) =>
    dispatch({
      type: 'ONBOARD',
      profile: {
        ...profile,
        name: profile.name.trim(),
        email: profile.email.trim(),
        linkedin: toUrl(profile.linkedin, 'https://www.linkedin.com/in/'),
        instagram: toUrl(profile.instagram, 'https://www.instagram.com/'),
      },
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Image source={MOON} style={{ width: 96, height: 96 }} resizeMode="contain" />
            <Text style={[T.h1, { textAlign: 'center' }]}>Pray together.</Text>
            <Text style={[T.body, { color: C.g700 }]}>Find Muslims nearby at every adhan.</Text>
          </View>

          <View style={s.row}>
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

          <View style={s.group}>
            <Field label="Name" value={p.name} onChange={set('name')} placeholder="Your first name" caps="words" />
            <Field label="Email" value={p.email} onChange={set('email')} placeholder={`you@${campus.domain}`} keyboard="email-address" last={!more} />
            {more && (
              <>
                <Field label="Major" value={p.major} onChange={set('major')} placeholder="Optional" caps="words" />
                <Field label="Year" value={p.year} onChange={set('year')} placeholder="Optional" caps="words" />
                <Field label="LinkedIn" value={p.linkedin} onChange={set('linkedin')} placeholder="@handle" />
                <Field label="Instagram" value={p.instagram} onChange={set('instagram')} placeholder="@handle" last />
              </>
            )}
          </View>
          {!more && (
            <Pressable onPress={() => setMore(true)} style={{ alignSelf: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.brand }}>+ Major, LinkedIn, Instagram</Text>
            </Pressable>
          )}
          {!!p.email.trim() && !emailOk && <Text style={[T.meta, { textAlign: 'center', color: C.flame }]}>Use your @{campus.domain} email</Text>}

          <Button title="Continue" variant="accent" disabled={!valid} onPress={() => finish(p)} />
          <Pressable onPress={() => finish({ ...ME })} style={{ alignSelf: 'center', padding: 4 }}>
            <Text style={T.meta}>Use demo profile</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// iOS-style grouped row: label left, input right, hairline between rows.
function Field({ label, value, onChange, placeholder, caps = 'none', keyboard, last }) {
  return (
    <View style={[s.field, !last && s.divider]}>
      <Text style={{ width: 84, fontSize: 16, fontWeight: '500', color: C.black }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.g500}
        autoCapitalize={caps}
        autoCorrect={false}
        keyboardType={keyboard}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pill: { paddingHorizontal: 18, height: 40, borderRadius: 20, backgroundColor: C.white, justifyContent: 'center' },
  seg: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 28, padding: 4 },
  segItem: { flex: 1, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: C.brand },
  group: { ...CARD, paddingHorizontal: 18 },
  field: { flexDirection: 'row', alignItems: 'center', height: 54 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.g300 },
  input: { flex: 1, fontSize: 16, color: C.black, fontFamily: 'Geist_400Regular', height: 54 },
});
