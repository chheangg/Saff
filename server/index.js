// Saff realtime server: adhan scheduler + per-prayer group chats + streaks.
// In-memory by design (hackathon). Run: npm start  (PORT, ADMIN_KEY env vars)
import express from 'express';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server } from 'socket.io';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

const PORT = process.env.PORT || 4000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'saff';
const TZ = 'America/Los_Angeles';
const GROUP_MS = 30 * 60 * 1000;
const UCSD = new Coordinates(32.8801, -117.234);
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const LABEL = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

const app = express();
app.use(express.json());
const http = createServer(app);
const io = new Server(http, { cors: { origin: '*' } });

// ---------- state ----------
const users = new Map(); // id -> user
let adhan = null; // { key, label, timeLabel, at }
let groups = { brother: emptyGroup(), sister: emptyGroup() };

function emptyGroup() {
  return { members: [], messages: [], expiresAt: null };
}

// ---------- time helpers (always Pacific, regardless of server TZ) ----------
const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: TZ });
const yesterdayKey = () => dayKey(new Date(Date.now() - 864e5));
const timeLabel = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });

function prayerTimes(key = dayKey()) {
  const [y, m, d] = key.split('-').map(Number);
  const pt = new PrayerTimes(UCSD, new Date(y, m - 1, d), CalculationMethod.NorthAmerica());
  return PRAYERS.map((p) => ({ key: p, label: LABEL[p], time: pt[p] }));
}

// ---------- views ----------
const pub = ({ id, name, gender, major, year, linkedin, instagram, streak, prayedToday }) =>
  ({ id, name, gender, major, year, linkedin, instagram, streak, prayedToday });

function view(gender) {
  const g = groups[gender];
  return { ...g, members: g.members.map((id) => users.get(id)).filter(Boolean).map(pub) };
}
const emitGroup = (gender) => io.to(gender).emit('group', view(gender));
const adhanLive = () => adhan && Date.now() - adhan.at < GROUP_MS;

function fireAdhan(p) {
  adhan = { key: p.key, label: p.label, timeLabel: p.timeLabel, at: Date.now() };
  groups = { brother: emptyGroup(), sister: emptyGroup() };
  io.emit('adhan', adhan);
  emitGroup('brother');
  emitGroup('sister');
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
  // re-plan shortly after the next Pacific midnight (check hourly; cheap and TZ-safe)
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
    const gender = p.gender === 'sister' ? 'sister' : 'brother';
    const prev = users.get(p.id);
    const u = {
      id: str(p.id, 64),
      name: str(p.name, 40) || 'Student',
      gender,
      major: str(p.major, 60),
      year: str(p.year, 20),
      linkedin: str(p.linkedin),
      instagram: str(p.instagram),
      streak: prev?.streak ?? (Number(p.streak) || 0),
      prayedToday: prev?.prayedToday ?? (p.prayedToday || {}),
      lastDay: prev?.lastDay ?? null,
    };
    users.set(u.id, u);
    if (socket.data.gender && socket.data.gender !== gender) socket.leave(socket.data.gender);
    socket.data.id = u.id;
    socket.data.gender = gender;
    socket.join(gender);
    socket.emit('me', pub(u));
    if (adhanLive()) socket.emit('adhan', adhan);
    socket.emit('group', view(gender));
  });

  socket.on('free', () => {
    const u = me();
    if (!u || !adhanLive()) return;
    const g = groups[u.gender];
    if (!g.members.includes(u.id)) g.members.push(u.id);
    g.expiresAt ??= Date.now() + GROUP_MS;
    emitGroup(u.gender);
  });

  socket.on('message', (text) => {
    const u = me();
    const body = str(text, 500).trim();
    if (!u || !body) return;
    const g = groups[u.gender];
    if (!g.members.includes(u.id)) return;
    g.messages.push({ id: randomUUID(), userId: u.id, text: body, at: Date.now() });
    emitGroup(u.gender);
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
    socket.emit('me', pub(u));
    emitGroup(u.gender);
  });
});

// ---------- HTTP ----------
app.get('/', (_req, res) => res.json({ ok: true, users: users.size, clients: io.engine.clientsCount, adhan, today: prayerTimes().map((p) => `${p.label} ${timeLabel(p.time)}`) }));

// Manual trigger for testing/demo: POST /adhan?key=saff  {"prayer":"asr"}
app.post('/adhan', (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(401).json({ error: 'bad key' });
  const p = prayerTimes().find((x) => x.key === req.body?.prayer) ?? prayerTimes().filter((x) => x.time <= new Date()).at(-1) ?? prayerTimes()[4];
  fireAdhan({ ...p, timeLabel: timeLabel(p.time) });
  res.json({ ok: true, adhan });
});

http.listen(PORT, () => console.log(`Saff server on :${PORT}`));
