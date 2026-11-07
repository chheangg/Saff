import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, CARD, FLAME, HERO, T } from '../theme';
import { Avatar, Button, PrayerDots, Sheet } from '../ui';
import { playDemo, stopDemo, useStore } from '../store';
import { disableAlerts } from '../alerts';
import { currentPrayer, fmtIn, fmtTime, nextPrayer } from '../prayer';
import { campusOf } from '../data';
import { useWalkTimes } from '../location';

const MOON = require('../../assets/mascot/moon-sleepy.png');

export default function Home() {
  const { state, dispatch } = useStore();
  const { me, adhan, response, network } = state;
  const [now, setNow] = useState(new Date());
  const [menu, setMenu] = useState(false); // hidden presenter menu: long-press the wordmark

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const next = nextPrayer(now);
  const prayedToday = me.lastJamaah === now.toDateString(); // a jama'ah through Saff today

  // Alerts default on (App.js schedules them); this switch just opts out or back in.
  const notify = me.alerts !== false;
  async function toggleNotify(on) {
    dispatch({ type: 'ME', me: { alerts: on } });
    if (!on) disableAlerts();
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

        <LiveCard now={now} />

        <LinearGradient colors={HERO} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroGlow} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[T.kicker, { color: '#C7D2FE' }]}>Next up</Text>
            <Text style={{ fontSize: 40, fontWeight: '700', letterSpacing: -1.5, color: C.onColor }}>{next.label}</Text>
            <Text style={{ fontSize: 16, color: '#C7D2FE' }}>
              {fmtTime(next.time)} · in {fmtIn(next.time - now)}
            </Text>
          </View>
          <Image source={MOON} style={{ width: 92, height: 92 }} resizeMode="contain" />
        </LinearGradient>

        <View style={{ gap: 14 }}>
          <Text style={T.h2}>Today</Text>
          <PrayerDots done={me.prayedToday ?? {}} current={currentPrayer(now).key} showTimes={false} />
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LinearGradient colors={FLAME} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.flameBadge}>
              <Ionicons name="flame" size={24} color={C.onColor} />
            </LinearGradient>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[T.h2, { color: C.flame }]}>{me.streak} day streak</Text>
              <Text style={T.meta}>
                {prayedToday ? 'Done for today ✓' : `Pray today to hit ${me.streak + 1}`}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[T.meta, { textAlign: 'center' }]}>
          {network.prayers ? `${network.prayers} prayed today` : 'Be the first today'} · {network.campuses} campus{network.campuses === 1 ? '' : 'es'} · Manara
        </Text>

        {Platform.OS !== 'web' && (
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="notifications-outline" size={22} color={C.black} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Adhan alerts</Text>
            </View>
            <Switch value={notify} onValueChange={toggleNotify} trackColor={{ true: C.accent }} />
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

// "Live now": an ongoing jama'ah for your own campus + gender group (the server never mixes).
// Shows while the adhan's group is open; Join answers yes, or jumps to the chat if you're in.
function LiveCard({ now }) {
  const { state, dispatch } = useStore();
  const { adhan, group, response, me } = state;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  const { spots } = useWalkTimes(campusOf(me.campus).spots);
  const open = adhan && now - adhan.at < 30 * 60 * 1000 && response !== 'prayed';
  const others = group.members.filter((u) => u.id !== 'me');
  if (!open || (!others.length && response !== 'free')) return null;

  const spot = spots.find((p) => p.id === group.spot);
  const mins = Math.max(0, Math.round((now - adhan.at) / 60000));
  const inGroup = response === 'free';
  const n = others.length;

  return (
    <View style={s.live}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={s.livePill}>
          <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[s.pulse, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }) }] }]} />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent }} />
          </View>
          <Text style={[T.kicker, { color: C.accentDark }]}>Live now</Text>
        </View>
        <Text style={T.meta}>{mins ? `started ${mins} min ago` : 'just started'}</Text>
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.8 }}>{adhan.label} jama'ah</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={14} color={C.g700} />
          <Text style={T.meta}>{spot ? `${spot.name} · ${spot.walk} min walk` : 'Picking a spot…'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row' }}>
            {others.slice(0, 4).map((u, i) => (
              <View key={u.id} style={{ marginLeft: i ? -8 : 0 }}>
                <Avatar user={u} size={32} ring />
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600' }}>{n ? `${n} ${me.gender}${n > 1 ? 's' : ''}` : 'Just you so far'}</Text>
        </View>
        <Pressable
          style={s.join}
          onPress={() => (inGroup ? dispatch({ type: 'TAB', tab: 'chat' }) : dispatch({ type: 'RESPOND', answer: 'free' }))}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.onColor }}>{inGroup ? 'Open' : 'Join'}</Text>
          <Ionicons name="arrow-forward" size={16} color={C.onColor} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  live: { ...CARD, padding: 18, gap: 14, borderWidth: 1.5, borderColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.accentSoft },
  pulse: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: C.accent },
  join: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 999, backgroundColor: C.accent },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontSize: 14, fontWeight: '600' },
  hero: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroGlow: { position: 'absolute', right: -60, top: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(110,231,183,0.25)' },
  card: { ...CARD, padding: 18, gap: 16 },
  flameBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
