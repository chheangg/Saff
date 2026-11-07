import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, T } from '../theme';
import { Button } from '../ui';
import { useStore } from '../store';

const FIELDS = [
  ['name', 'Name'],
  ['email', 'UCSD email'],
  ['major', 'Major'],
  ['year', 'Year'],
  ['linkedin', 'LinkedIn URL'],
  ['instagram', 'Instagram URL'],
];

export default function Onboarding() {
  const { state, dispatch } = useStore();
  const [p, setP] = useState(state.me);
  const valid = p.name.trim() && /@ucsd\.edu$/i.test(p.email.trim());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={[T.h1, { marginTop: 24 }]}>Pray together.{'\n'}Never alone.</Text>
          <Text style={[T.body, { color: C.g700 }]}>
            When the adhan goes off, Saff finds UCSD Muslims nearby who are free to pray with you.
          </Text>

          <View style={s.seg}>
            {['brother', 'sister'].map((g) => (
              <Pressable key={g} onPress={() => setP({ ...p, gender: g })} style={[s.segItem, p.gender === g && s.segOn]}>
                <Text style={[T.body, { fontWeight: '600', color: p.gender === g ? C.white : C.black }]}>
                  {g === 'brother' ? 'Brother' : 'Sister'}
                </Text>
              </Pressable>
            ))}
          </View>

          {FIELDS.map(([k, label]) => (
            <View key={k} style={{ gap: 6 }}>
              <Text style={T.meta}>{label}</Text>
              <TextInput
                value={p[k]}
                onChangeText={(v) => setP({ ...p, [k]: v })}
                autoCapitalize={['name', 'major', 'year'].includes(k) ? 'words' : 'none'}
                style={s.input}
              />
            </View>
          ))}
          <Button title="Continue" disabled={!valid} onPress={() => dispatch({ type: 'ONBOARD', profile: p })} style={{ marginTop: 8 }} />
          <Text style={[T.meta, { textAlign: 'center' }]}>Only @ucsd.edu emails can join.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  input: { height: 52, borderRadius: 12, backgroundColor: C.g50, paddingHorizontal: 16, fontSize: 16 },
  seg: { flexDirection: 'row', backgroundColor: C.g100, borderRadius: 28, padding: 4 },
  segItem: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.black },
});
