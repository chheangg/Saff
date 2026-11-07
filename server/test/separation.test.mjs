// No free mixing: brothers only ever see brothers, sisters only ever see sisters.
// Starts a real server on a spare port, connects fake phones, and checks every group they receive.
// Run: npm test   (from server/)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { io } from 'socket.io-client';

const PORT = 4100 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}`;
const KEY = 'test-key';
const dir = mkdtempSync(join(tmpdir(), 'saff-test-'));
let server;
const sockets = [];

before(async () => {
  server = spawn(process.execPath, [fileURLToPath(new URL('../index.js', import.meta.url))], {
    env: { ...process.env, PORT: String(PORT), ADMIN_KEY: KEY, DB_FILE: join(dir, 'data.json') },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => String(d).includes('Saff server on') && resolve());
    server.on('exit', (code) => reject(new Error(`server exited ${code}`)));
  });
});

after(() => {
  sockets.forEach((s) => s.disconnect());
  server?.kill();
  rmSync(dir, { recursive: true, force: true });
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A fake phone that remembers every group update it was sent.
async function phone(id, name, gender, campus = 'ucsd') {
  const s = io(BASE, { transports: ['websocket'], forceNew: true });
  sockets.push(s);
  const p = { s, id, name, gender, campus, groups: [], adhans: 0 };
  s.on('group', (g) => p.groups.push(g));
  s.on('adhan', () => p.adhans++);
  await new Promise((r) => s.on('connect', r));
  p.join = (patch = {}) => { Object.assign(p, patch); s.emit('join', { id, name, gender: p.gender, campus: p.campus }); };
  p.join();
  await sleep(100);
  return p;
}

const fireAdhan = (prayer = 'asr') =>
  fetch(`${BASE}/adhan`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': KEY }, body: JSON.stringify({ prayer }) });

// Every member and message author this phone was ever shown.
const seenGenders = (p) => new Set(p.groups.flatMap((g) => g.members.map((m) => m.gender)));
const seenNames = (p) => new Set(p.groups.flatMap((g) => g.members.map((m) => m.name)));
const lastGroup = (p) => p.groups.at(-1);

test('brothers and sisters at the same campus get separate groups and chats', async () => {
  const omar = await phone('b1', 'Omar', 'brother');
  const yusuf = await phone('b2', 'Yusuf', 'brother');
  const aisha = await phone('s1', 'Aisha', 'sister');
  const maryam = await phone('s2', 'Maryam', 'sister');

  assert.equal((await fireAdhan()).status, 200);
  await sleep(200);
  for (const p of [omar, yusuf, aisha, maryam]) assert.ok(p.adhans >= 1, `${p.name} got the adhan`);

  for (const p of [omar, yusuf, aisha, maryam]) p.s.emit('free');
  await sleep(200);
  omar.s.emit('message', 'brothers only');
  aisha.s.emit('message', 'sisters only');
  await sleep(200);

  for (const b of [omar, yusuf]) {
    assert.deepEqual([...seenGenders(b)], ['brother'], `${b.name} only sees brothers`);
    assert.deepEqual(lastGroup(b).members.map((m) => m.name).sort(), ['Omar', 'Yusuf']);
    assert.deepEqual(lastGroup(b).messages.map((m) => m.text), ['brothers only']);
  }
  for (const s of [aisha, maryam]) {
    assert.deepEqual([...seenGenders(s)], ['sister'], `${s.name} only sees sisters`);
    assert.deepEqual(lastGroup(s).members.map((m) => m.name).sort(), ['Aisha', 'Maryam']);
    assert.deepEqual(lastGroup(s).messages.map((m) => m.text), ['sisters only']);
  }
});

test('switching gender mid-prayer removes you from the old group', async () => {
  const ali = await phone('b3', 'Ali', 'brother', 'sdsu');
  const zaid = await phone('b4', 'Zaid', 'brother', 'sdsu');
  const huda = await phone('s3', 'Huda', 'sister', 'sdsu');

  await fireAdhan('maghrib');
  await sleep(200);
  for (const p of [ali, zaid, huda]) p.s.emit('free');
  await sleep(200);
  assert.deepEqual(lastGroup(zaid).members.map((m) => m.name).sort(), ['Ali', 'Zaid']);

  ali.join({ gender: 'sister' }); // profile edited, or a second device
  await sleep(200);

  assert.deepEqual(lastGroup(zaid).members.map((m) => m.name), ['Zaid'], 'brothers no longer list Ali');
  assert.ok(!seenNames(huda).has('Ali') || lastGroup(huda).members.every((m) => m.gender === 'sister'),
    'sisters never see a brother profile');
  assert.deepEqual([...seenGenders(huda)], ['sister']);
});

test('different campuses do not share groups either', async () => {
  const a = await phone('b5', 'Bilal', 'brother', 'ucsd');
  const b = await phone('b6', 'Hamza', 'brother', 'usd');
  await fireAdhan('isha');
  await sleep(200);
  a.s.emit('free');
  b.s.emit('free');
  await sleep(200);
  assert.deepEqual(lastGroup(a).members.map((m) => m.name), ['Bilal']);
  assert.deepEqual(lastGroup(b).members.map((m) => m.name), ['Hamza']);
});
