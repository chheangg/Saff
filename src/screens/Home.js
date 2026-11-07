import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { C, CARD, FLAME, HERO, T } from '../theme';
import { Button, PrayerDots, Sheet, WeekRow } from '../ui';
import { playDemo, scheduleToday, stopDemo, useStore } from '../store';
import { currentPrayer, fmtIn, fmtTime, nextPrayer } from '../prayer';
import { campusOf } from '../data';

const MOON = require('../../assets/mascot/moon-sleepy.png');

export default function Home() {
  const { state, dispatch } = useStore();
  const { me, adhan, response, network } = state;
  const [now, setNow] = useState(new Date());
  const [notify, setNotify] = useState(false);
  const [menu, setMenu] = useState(false); // hidden presenter menu: long-press the wordmark

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const next = nextPrayer(now);
  const prayedToday = me.lastJamaah === now.toDateString(); // a jama'ah through Saff today

  async function toggleNotify(on) {
    setNotify(on);
    if (!on) return Notifications.cancelAllScheduledNotificationsAsync();
    const { granted } = await Notifications.requestPermissionsAsync();
    if (granted) scheduleToday(me.gender);
    else setNotify(false);
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32, gap: 20 }}>
        <View style={s.header}>
          <Pressable onLongPress={() => setMenu(true)} delayLongPress={600}>
            <Text style={{ fontSize: 30, fontWeight: '700', letterSpacing: -1.2, color: C.black }}>saff</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[s.chip, { backgroundColor: C.flameSoft }]}>
              <Ionicons name="flame" size={16} color={C.flame} />
              <Text style={[s.chipText, { color: C.flame }]}>{me.streak}</Text>
            </View>
            <Pressable style={[s.chip, { backgroundColor: C.brandSoft }]} onPress={() => dispatch({ type: 'TAB', tab: 'profile' })}>
              <Ionicons name="school-outline" size={16} color={C.brand} />
              <Text style={[s.chipText, { color: C.brand }]}>{campusOf(me.campus).short}</Text>
            </Pressable>
          </View>
        </View>

        <LinearGradient colors={HERO} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroGlow} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[T.kicker, { color: '#C7D2FE' }]}>Next up</Text>
            <Text style={{ fontSize: 40, fontWeight: '700', letterSpacing: -1.5, color: C.white }}>{next.label}</Text>
            <Text style={{ fontSize: 16, color: '#C7D2FE' }}>
              {fmtTime(next.time)} · in {fmtIn(next.time - now)}
            </Text>
          </View>
          <Image source={MOON} style={{ width: 92, height: 92 }} resizeMode="contain" />
        </LinearGradient>

        <View style={{ gap: 14 }}>
          <Text style={T.h2}>Today</Text>
          <PrayerDots done={me.prayedToday ?? {}} current={currentPrayer(now).key} />
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LinearGradient colors={FLAME} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.flameBadge}>
              <Ionicons name="flame" size={28} color={C.white} />
            </LinearGradient>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[T.h2, { color: C.flame }]}>{me.streak} day streak</Text>
              <Text style={T.meta}>
                {prayedToday ? 'Done for today ✓' : `Pray today to hit ${me.streak + 1}`}
              </Text>
            </View>
          </View>
          <WeekRow streak={me.streak} prayedToday={prayedToday} />
        </View>

        <View style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={[s.flameBadge, { backgroundColor: C.accentSoft }]}>
            <Ionicons name="people" size={24} color={C.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: C.black }}>
              {network.prayers ? `${network.prayers} prayed today` : 'Be the first today'}
            </Text>
            <Text style={{ fontSize: 13, color: C.g700 }}>
              {network.campuses} campus{network.campuses === 1 ? '' : 'es'} · Manara
            </Text>
          </View>
        </View>

        {Platform.OS !== 'web' && (
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="notifications-outline" size={22} color={C.black} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Adhan alerts</Text>
            </View>
            <Switch value={notify} onValueChange={toggleNotify} trackColor={{ true: C.accent }} />
          </View>
        )}

        {adhan && response === 'no' && (
          <View style={s.card}>
            <Text style={T.body}>{adhan.label} group is still open</Text>
            <Button title="Join anyway" variant="light" onPress={() => dispatch({ type: 'RESPOND', answer: 'free' })} />
          </View>
        )}
      </ScrollView>

      <Sheet visible={menu} onClose={() => setMenu(false)}>
        <Text style={T.h2}>Demo</Text>
        <Text style={T.meta}>
          {Platform.OS === 'web' ? 'Adhan in 3s' : 'Lock your phone after Play'}
        </Text>
        <Button title="Play demo" variant="accent" icon="play" onPress={() => { setMenu(false); playDemo(dispatch, me); }} />
        <Button title="Reset" variant="light" onPress={() => { setMenu(false); stopDemo(); dispatch({ type: 'RESET' }); }} />
      </Sheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontSize: 14, fontWeight: '600' },
  hero: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroGlow: { position: 'absolute', right: -60, top: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(110,231,183,0.25)' },
  card: { ...CARD, padding: 18, gap: 16 },
  flameBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
