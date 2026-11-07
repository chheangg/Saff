# Saff — Hackathon Plan

MTC x Replit x Manara West Buildathon · Track: **Deen & Dunya** · Team: Evan, Ibrahim, Ali
Live doc: https://claude.ai/artifact/GhMSt8eBoBn28mbgx35qJG

## Pitch

Saff turns every adhan into a chance to meet. When prayer time hits, UCSD Muslims nearby get one ping: "Free to pray?" Everyone who taps Yes lands in a temporary group chat that expires after the prayer. There they pick a spot (a saved one or the nearest) and pray together. Profiles link LinkedIn and Instagram, so people who hit it off can connect on the spot.

**Adhan → "Free?" ping → temp group chat → meet and pray → connect.**

## Design direction: Uber Base

Borrowed from Uber's [Base design system](https://base.uber.com). It's the quietest of the three options. Duolingo is too playful, and Airbnb is photo-heavy. Uber's request flow (one big button, a live "matching" state, then a match) maps 1:1 onto ours.

- **Color:** black, white, and grays only. One accent: green `#06C167`, used only for "I'm free" and live states.
- **Type:** system font (SF Pro / Roboto, close to Uber Move). 32 bold for the headline, 16 for body, 13 for meta.
- **Spacing:** 8px grid, 16px gutters, 12px card radius, pill buttons.
- **Layout:** mobile-first, one primary action per screen, bottom sheets instead of new pages.
- **Motion:** only one animation, the pulsing "finding brothers/sisters nearby" ring.

**Screens (6 total; nothing else gets built)**

1. **Onboarding:** name, @ucsd.edu email, brother/sister, LinkedIn, Instagram
2. **Home:** next prayer + countdown, "Notify me" toggle
3. **Adhan takeover:** full-screen black. "Asr · 3:42 PM. Free to pray?" with **I'm free** or Not now
4. **Matching:** pulse ring, avatars drop in
5. **Group chat:** expiry timer, spot chips (Price Center prayer room, Geisel 2nd floor, Library Walk), messages
6. **Profile sheet:** name, major, year, LinkedIn and Instagram buttons

**Jama'ah streak (borrowed from Duolingo)**

A streak counts consecutive days on which you prayed at least one prayer in congregation through Saff. It's Duolingo's retention mechanic, applied to salah.

- **How it counts:** after the chat, everyone taps **We prayed**. That check-in adds +1 for the day. One jama'ah a day keeps the streak alive.
- **Home:** a flame + "7-day streak" under the countdown, plus 5 dots for today's prayers (Fajr to Isha). Each dot fills green when prayed with a group.
- **Check-in sheet:** the flame pops and the number ticks up (6 → 7). This is the only celebratory animation in the app.
- **Group touch:** the chat header shows each person's streak beside their avatar.
- **Kept minimal:** no leagues, gems, or freezes. The flame uses the same green accent.

## Run it

**On your iPhone:** Expo Go link or https://saff-sand.vercel.app. See [SETUP.md](SETUP.md) (also: who owns which files).

```bash
npm install
npx expo start          # scan the QR code with Expo Go (iOS camera / Android Expo Go app)
npx expo start --tunnel # if your phone is on a different network
```

**Demo mode:** long-press the **Saff** wordmark on Home and tap **Play demo**. After 3 seconds, a real notification fires (lock the phone to catch the banner), the adhan screen opens, 4 seeded users join, and the chat plays a script. **Reset** replays it. Seed content lives in `src/data.js`.

**Live mode (real groups across phones):**

```bash
cd server && npm install && npm start      # :4000, fires the adhan at real UCSD prayer times
echo "EXPO_PUBLIC_SERVER_URL=http://<your-laptop-ip>:4000" > .env   # in the repo root, then restart expo
curl -X POST "http://localhost:4000/adhan?key=saff" -H 'content-type: application/json' -d '{"prayer":"asr"}'   # trigger an adhan now
```

**Deploy the server on Replit:** Import this repo from GitHub, add a Secret `ADMIN_KEY`, and click Deploy → **Reserved VM** (not Autoscale, because state is in memory; `server/data.json` resets on each redeploy). `.replit` already has the build and run commands set. Then set `EXPO_PUBLIC_SERVER_URL=https://<your-app>.replit.app` in `.env.local`.

The server is in-memory: Socket.IO events `join`, `free`, `message`, `prayed` → `adhan`, `group`, `me`. Brothers and sisters get separate groups, and streaks go up once per Pacific day. Set `ADMIN_KEY` in production. Demo mode still works while live mode is on.

## Tech stack: Expo app + 60-second video

| Layer | Pick | Why |
| --- | --- | --- |
| App | Expo SDK 58 (React Native), plain JS, runs in Expo Go | One codebase, scan and run |
| Notifications | `expo-notifications` local notifications | Real banner at adhan time; works in Expo Go |
| Prayer times | `adhan` npm, UCSD 32.8801, -117.2340 | Real times, offline |
| Feel | `expo-haptics` + Animated | Pulse ring, pop-ins, streak pop |
| Backend | Express + Socket.IO (or Supabase Realtime) | Real cross-phone groups; the video doesn't depend on it |
| Deploy | `expo start --tunnel`, EAS Update for a share link | No App Store |

**Real today:** "Ping me at every adhan" schedules real notifications for the rest of today's prayers. Tapping one opens the flow.

```
App.js                 screen router + notification handler
src/store.js           state (reducer) + demo engine + scheduling
src/data.js            demo profile, bots, spots, chat script
src/prayer.js          prayer times for UCSD
src/ui.js              Avatar, Button, Sheet, PrayerDots, PopIn
src/screens/           Onboarding, Home, Takeover, Matching, Chat, Sheets
src/live.js            Socket.IO client (live mode)
server/index.js        realtime server + adhan scheduler
```

## Task split

The demo runs fully on the phone, so the frontend never waits on the backend. The backend plugs in behind the same actions: `join`, `free`, `message`, `prayed`.

| Person | Owns | Deliverables |
| --- | --- | --- |
| **Evan** | Frontend + backend | Onboarding, Home, Profile sheet. Defines the event contract with Ali and wires the app to the backend |
| **Ibrahim** | Frontend + demo | Takeover, Matching, Chat, Streak sheet. Demo pacing (`src/data.js`, `src/store.js`). Records + edits the 60s video |
| **Ali** | Backend + deploy | Socket.IO/Supabase server for real groups + streaks. Tunnel / EAS Update link, app icon + splash |

Everyone collects judge feedback (consult ≥ 2 judges).

**Timeline**

1. **2:45–3:00, all:** clone, `npm install`, `npx expo start` on your phones. Evan + Ali agree on the events.
2. **3:00–4:30:** Evan + Ibrahim polish screens. Ali stands up the server.
3. **4:30:** get judge #1's feedback. Evan wires the backend behind a flag; demo mode stays the default.
4. **4:30–6:00:** get judge #2's feedback. Ibrahim tunes pacing to 60s. Ali ships the share link.
5. **6:00–6:30:** freeze, record 3 takes.
6. **6:30–7:00:** edit + submit.

## Demo video (60s)

1. **0–5s:** hook caption over Home.
2. **5–15s:** Play demo, lock the phone, the "Asr · 3:42 PM" banner appears, tap it.
3. **15–25s:** adhan screen, I'm free, the pulse fills with 4 brothers, the chat opens.
4. **25–42s:** messages roll in, tap the Price Center chip, get a reply, open Omar's profile, then LinkedIn.
5. **42–52s:** We prayed, flame pops, streak 6 → 7.
6. **52–60s:** end card: Saff, Deen & Dunya, next steps.
