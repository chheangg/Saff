// Push alerts for admin-fired adhans, checked against a fake Expo push service (nothing real is sent).
// Run: npm test   (from server/)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { io } from 'socket.io-client';

const PORT = 4600 + Math.floor(Math.random() * 300);
const PUSH_PORT = PORT + 1;
const BASE = `http://localhost:${PORT}`;
const KEY = 'test-key';
const DEAD = 'ExponentPushToken[dead-phone]';
const dir = mkdtempSync(join(tmpdir(), 'saff-push-'));
const sent = []; // every push message the server tried to send
let server, mock;
const sockets = [];

before(async () => {
  // Fake Expo: records messages, answers with one ticket each; DEAD is reported as uninstalled.
  mock = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const msgs = JSON.parse(body);
      sent.push(...msgs);
      const data = msgs.map((m) =>
        m.to === DEAD ? { status: 'error', details: { error: 'DeviceNotRegistered' } } : { status: 'ok', id: 'x' });
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data }));
    });
  }).listen(PUSH_PORT);

  server = spawn(process.execPath, [fileURLToPath(new URL('../index.js', import.meta.url))], {
    env: { ...process.env, PORT: String(PORT), ADMIN_KEY: KEY, DB_FILE: join(dir, 'data.json'), PUSH_URL: `http://localhost:${PUSH_PORT}/push` },
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
  mock?.close();
  rmSync(dir, { recursive: true, force: true });
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function phone(id, name, gender, pushToken) {
  const s = io(BASE, { transports: ['websocket'], forceNew: true });
  sockets.push(s);
  const p = { s, payloads: [] };
  s.on('group', (g) => p.payloads.push(g));
  s.on('me', (m) => p.payloads.push(m));
  await new Promise((r) => s.on('connect', r));
  s.emit('join', { id, name, gender, campus: 'ucsd', pushToken });
  await sleep(100);
  return p;
}

async function fire(prayer) {
  sent.length = 0;
  const r = await fetch(`${BASE}/adhan`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': KEY }, body: JSON.stringify({ prayer }),
  });
  assert.equal(r.status, 200);
  return r.json();
}

const pushFor = (token) => sent.filter((m) => m.to === token);

test('each phone gets one push, worded for its own gender only', async () => {
  const b = await phone('pb1', 'Omar', 'brother', 'ExponentPushToken[brother-phone]');
  const s = await phone('ps1', 'Aisha', 'sister', 'ExponentPushToken[sister-phone]');
  await phone('nt1', 'NoAlerts', 'brother', undefined); // alerts off: no token, no push

  const res = await fire('asr');
  assert.equal(res.pushed, 2);
  assert.match(pushFor('ExponentPushToken[brother-phone]')[0].body, /brothers/);
  assert.match(pushFor('ExponentPushToken[sister-phone]')[0].body, /sisters/);
  assert.ok(!sent.some((m) => /sister/.test(m.body) && m.to.includes('brother')));

  // Push tokens are private: never sent to other phones in group or profile data.
  await sleep(100);
  for (const p of [b, s]) assert.ok(!JSON.stringify(p.payloads).includes('PushToken'), 'no token leaks');
});

test('same phone re-onboarded as the other gender is pushed once, with the new wording', async () => {
  const token = 'ExponentPushToken[reinstalled]';
  await phone('old-id', 'Before', 'brother', token);
  await phone('new-id', 'After', 'sister', token); // reinstall: new device id, same token

  await fire('maghrib');
  const mine = pushFor(token);
  assert.equal(mine.length, 1, 'one push per phone');
  assert.match(mine[0].body, /sisters/);
});

test('uninstalled phones are dropped after Expo reports them', async () => {
  await phone('gone', 'Gone', 'brother', DEAD);
  await fire('isha');
  assert.equal(pushFor(DEAD).length, 1, 'tried once');
  await sleep(700); // let the server save
  await fire('fajr');
  assert.equal(pushFor(DEAD).length, 0, 'not pushed again');
});
