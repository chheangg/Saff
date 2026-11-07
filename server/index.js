// Saff realtime server: adhan scheduler + per-campus, per-gender group chats,
// meetup-spot memory, streaks, and Manara network stats.
// In-memory with a JSON snapshot (hackathon). Run: npm start  (PORT, ADMIN_KEY, DB_FILE env vars)
import express from 'express';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

const PORT = process.env.PORT || 4000;
const DB_FILE = process.env.DB_FILE || new URL('./data.json', import.meta.url).pathname;
const ADMIN_KEY = process.env.ADMIN_KEY || 'saff';
const PUSH_URL = process.env.PUSH_URL || 'https://exp.host/--/api/v2/push/send'; // tests point this at a mock
const TZ = 'America/Los_Angeles';
const GROUP_MS = 30 * 60 * 1000;
const COORDS = new Coordinates(32.8801, -117.234); // all Manara campuses are in San Diego
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const LABEL = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const CAMPUSES = ['ucsd', 'sdsu', 'mesa', 'usd']; // keep in sync with src/data.js

const app = express();
app.use(express.json());
const http = createServer(app);
const io = new Server(http, { cors: { origin: '*' } });

// ---------- persisted state ----------
const users = new Map(); // id -> user
let spotCounts = {}; // `${campus}:${gender}` -> { spotId: count }
let lastSpot = {}; // `${campus}:${gender}:${prayer}` -> spotId
try {
  const db = JSON.parse(readFileSync(DB_FILE, 'utf8'));
  for (const u of db.users ?? []) users.set(u.id, u);
  spotCounts = db.spotCounts ?? {};
  lastSpot = db.lastSpot ?? {};
  console.log(`[db] loaded ${users.size} users`);
} catch {}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      writeFileSync(DB_FILE + '.tmp', JSON.stringify({ users: [...users.values()], spotCounts, lastSpot }));
      renameSync(DB_FILE + '.tmp', DB_FILE);
    } catch (e) {
      console.error('[db] save failed', e.message);
    }
  }, 500);
}

// ---------- live state (resets every adhan) ----------
let adhan = null; // { key, label, timeLabel, at }
let groups = new Map(); // `${campus}:${gender}` -> { members, messages, expiresAt, spot }

const roomOf = (u) => `${u.campus}:${u.gender}`;
function groupOf(room) {
  if (!groups.has(room)) groups.set(room, { members: [], messages: [], expiresAt: null, spot: null });
  return groups.get(room);
}

// ---------- time helpers (always Pacific, regardless of server TZ) ----------
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: TZ });
const yesterdayKey = () => dayKey(new Date(Date.now() - 864e5));
const timeLabel = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });

function prayerTimes(key = dayKey()) {
  const [y, m, d] = key.split('-').map(Number);
  const pt = new PrayerTimes(COORDS, new Date(y, m - 1, d), CalculationMethod.NorthAmerica());
  return PRAYERS.map((p) => ({ key: p, label: LABEL[p], time: pt[p] }));
}

// ---------- views ----------
const pub = ({ id, name, gender, campus, major, year, linkedin, instagram, streak, prayedToday }) =>
  ({ id, name, gender, campus, major, year, linkedin, instagram, streak, prayedToday });

// { spotId: { count, last } } for this room + current prayer
function spotStats(room) {
  const counts = spotCounts[room] ?? {};
  const last = adhan ? lastSpot[`${room}:${adhan.key}`] : null;
  const stats = {};
  for (const [id, count] of Object.entries(counts)) stats[id] = { count };
  if (last) stats[last] = { ...stats[last], count: stats[last]?.count ?? 0, last: true };
  return stats;
}

function view(room) {
  const g = groupOf(room);
  return { ...g, members: g.members.map((id) => users.get(id)).filter(Boolean).map(pub), spotStats: spotStats(room) };
}

function network() {
  const today = dayKey();
  let prayers = 0;
  const active = new Set();
  for (const u of users.values()) {
    active.add(u.campus);
    if (u.lastDay === today) prayers += Object.keys(u.prayedToday ?? {}).length;
  }
  return { prayers, campuses: active.size };
}

const emitGroup = (room) => io.to(room).emit('group', view(room));
const emitNetwork = () => io.emit('network', network());
const adhanLive = () => adhan && Date.now() - adhan.at < GROUP_MS;

// Push the adhan to every phone that registered (reaches closed apps). Each user only hears
// about their own gender's group. Used for admin-fired adhans; scheduled prayer times are
// already covered by each phone's local notifications.
async function pushAdhan(a) {
  const msgs = [...users.values()]
    .filter((u) => u.pushToken)
    .map((u) => ({
      to: u.pushToken,
      sound: 'default',
      title: `${a.label} · ${a.timeLabel}`,
      body: `Adhan just went off. Free to pray with ${u.gender}s nearby?`,
      data: { prayer: { key: a.key, label: a.label, timeLabel: a.timeLabel } },
    }));
  for (let i = 0; i < msgs.length; i += 100) {
    const batch = msgs.slice(i, i + 100);
    try {
      const r = await fetch(PUSH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(10_000), // never leave the admin page hanging
      });
      if (!r.ok) { console.error('[push] failed', r.status, await r.text()); continue; }
      // Tickets come back in order. Forget tokens Expo says are dead (app deleted / alerts off).
      const { data = [] } = await r.json().catch(() => ({}));
      data.forEach((t, j) => {
        if (t?.details?.error !== 'DeviceNotRegistered') return;
        for (const u of users.values()) if (u.pushToken === batch[j].to) u.pushToken = null;
      });
      save();
    } catch (e) {
      console.error('[push] error', e.message);
    }
  }
  console.log(`[push] ${a.label} -> ${msgs.length} phones`);
  return msgs.length;
}

function fireAdhan(p) {
  adhan = { key: p.key, label: p.label, timeLabel: p.timeLabel, at: Date.now() };
  groups = new Map();
  io.emit('adhan', adhan);
  for (const room of io.sockets.adapter.rooms.keys()) if (room.includes(':')) emitGroup(room);
  console.log(`[adhan] ${adhan.label} ${adhan.timeLabel} -> ${io.engine.clientsCount} clients`);
}

// ---------- scheduler: fire at each real prayer time ----------
let timers = [];
function scheduleDay() {
  timers.forEach(clearTimeout);
  timers = [];
  const now = Date.now();
  for (const p of prayerTimes()) {
    const ms = p.time - now;
    if (ms > 0) timers.push(setTimeout(() => fireAdhan({ ...p, timeLabel: timeLabel(p.time) }), ms));
  }
  // re-plan after the next Pacific midnight (hourly check; cheap and TZ-safe)
  const today = dayKey();
  timers.push(setTimeout(function check() {
    if (dayKey() !== today) scheduleDay();
    else timers.push(setTimeout(check, 60 * 60 * 1000));
  }, 60 * 60 * 1000));
}
scheduleDay();

// ---------- sockets ----------
const str = (v, n = 200) => String(v ?? '').slice(0, n);

io.on('connection', (socket) => {
  const me = () => users.get(socket.data.id);

  socket.on('join', (p) => {
    if (!p?.id) return;
    const prev = users.get(p.id);
    const u = {
      id: str(p.id, 64),
      name: str(p.name, 40) || 'Student',
      gender: p.gender === 'sister' ? 'sister' : 'brother',
      campus: CAMPUSES.includes(p.campus) ? p.campus : 'ucsd',
      major: str(p.major, 60),
      year: str(p.year, 20),
      linkedin: str(p.linkedin),
      instagram: str(p.instagram),
      streak: prev?.streak ?? (Number(p.streak) || 0),
      prayedToday: prev?.prayedToday ?? (p.prayedToday || {}),
      lastDay: prev?.lastDay ?? null,
      // Expo push token from the app; keep the last good one if this join has none.
      pushToken: /^Expo(nent)?PushToken\[/.test(p.pushToken ?? '') ? p.pushToken : prev?.pushToken ?? null,
    };
    // One phone = one push token = one user. After a reinstall or re-onboarding the same phone
    // joins with a new id; take the token off the old record so it isn't pushed twice
    // (possibly with the other gender's wording).
    if (u.pushToken) for (const o of users.values()) if (o.id !== u.id && o.pushToken === u.pushToken) o.pushToken = null;
    users.set(u.id, u);
    save();
    const room = roomOf(u);
    if (socket.data.room && socket.data.room !== room) socket.leave(socket.data.room);
    // No free mixing: a user is only ever listed in their own campus+gender group. If they
    // switched gender or campus (even from another device), drop them from every other group.
    for (const [r, g] of groups) {
      if (r === room || !g.members.includes(u.id)) continue;
      g.members = g.members.filter((id) => id !== u.id);
      emitGroup(r);
    }
    socket.data.id = u.id;
    socket.data.room = room;
    socket.join(room);
    socket.emit('me', pub(u));
    if (adhanLive()) socket.emit('adhan', adhan);
    socket.emit('group', view(room));
    emitNetwork();
  });

  socket.on('free', () => {
    const u = me();
    if (!u || !adhanLive()) return;
    const g = groupOf(roomOf(u));
    if (!g.members.includes(u.id)) g.members.push(u.id);
    g.expiresAt ??= Date.now() + GROUP_MS;
    emitGroup(roomOf(u));
  });

  socket.on('message', (text) => {
    const u = me();
    const body = str(text, 500).trim();
    if (!u || !body) return;
    const g = groupOf(roomOf(u));
    if (!g.members.includes(u.id)) return;
    g.messages.push({ id: randomUUID(), userId: u.id, text: body, at: Date.now() });
    emitGroup(roomOf(u));
  });

  // Pin where the group meets. Counted once per group; changing it moves the count.
  socket.on('spot', (spotId) => {
    const u = me();
    const id = str(spotId, 40);
    if (!u || !id || !adhan) return;
    const room = roomOf(u);
    const g = groupOf(room);
    if (!g.members.includes(u.id) || g.spot === id) return;
    const counts = (spotCounts[room] ??= {});
    if (g.spot) counts[g.spot] = Math.max(0, (counts[g.spot] ?? 1) - 1);
    counts[id] = (counts[id] ?? 0) + 1;
    g.spot = id;
    lastSpot[`${room}:${adhan.key}`] = id;
    save();
    emitGroup(room);
  });

  socket.on('prayed', () => {
    const u = me();
    if (!u || !adhan) return;
    const today = dayKey();
    if (u.lastDay !== today) {
      u.streak = u.lastDay === yesterdayKey() || u.lastDay === null ? u.streak + 1 : 1;
      u.lastDay = today;
      u.prayedToday = {};
    }
    u.prayedToday = { ...u.prayedToday, [adhan.key]: true };
    save();
    socket.emit('me', pub(u));
    emitGroup(roomOf(u));
    emitNetwork();
  });
});

// ---------- HTTP ----------
app.get('/', (_req, res) =>
  res.json({
    ok: true,
    users: users.size,
    clients: io.engine.clientsCount,
    adhan,
    network: network(),
    today: prayerTimes().map((p) => `${p.label} ${timeLabel(p.time)}`),
  }),
);

// Admin key comes from the x-admin-key header (admin page) or ?key= (curl).
const isAdmin = (req) => (req.get('x-admin-key') ?? req.query.key) === ADMIN_KEY;

// Phone-friendly admin page: fire an adhan and watch groups fill. The page holds no secrets;
// the key is typed on the phone and sent with each request.
app.get('/admin', (_req, res) => res.sendFile(fileURLToPath(new URL('./admin.html', import.meta.url))));

// Live view for the admin page: who is in each group right now.
app.get('/admin/status', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'bad key' });
  const rooms = [...groups.entries()].map(([room, g]) => ({
    room,
    members: g.members.map((id) => users.get(id)?.name ?? '?'),
    messages: g.messages.length,
    spot: g.spot,
  }));
  res.json({
    adhan,
    live: !!adhanLive(),
    clients: io.engine.clientsCount,
    users: users.size,
    rooms,
    today: prayerTimes().map((p) => ({ key: p.key, label: p.label, time: timeLabel(p.time) })),
  });
});

// Manual trigger for testing/demo: POST /adhan?key=saff  {"prayer":"asr"}
app.post('/adhan', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'bad key' });
  const all = prayerTimes();
  const p = all.find((x) => x.key === req.body?.prayer) ?? all.filter((x) => x.time <= new Date()).at(-1) ?? all[4];
  fireAdhan({ ...p, timeLabel: timeLabel(p.time) });
  const pushed = await pushAdhan(adhan);
  res.json({ ok: true, adhan, pushed });
});

http.listen(PORT, () => console.log(`Saff server on :${PORT}`));
