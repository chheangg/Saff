# Saff on your iPhone

No laptop, tunnel, or Wi-Fi tricks needed. Both links below are hosted and always on.

## Option 1: Native app in Expo Go (recommended, used for the video)

1. Install **Expo Go** from the App Store.
2. Open the link with your iPhone camera. Scan the QR code, or tap the link from Messages/Notes:

   `exp://u.expo.dev/901fcf34-3eb9-443c-ab8d-ec3a99cf9451?channel-name=main&runtime-version=exposdk:58.0.0`

   <img src="assets/qr-expo-go.png" width="200" alt="QR code: Saff in Expo Go">

3. Allow notifications when asked. The demo's adhan banner needs them.

Expo Go loads the **latest published version**. To pick up new changes, close the app fully and reopen it. If it still shows the old version, reopen it once more.

## Option 2: Web app (zero install)

Open **https://saff-sand.vercel.app** in Safari, then tap **Share → Add to Home Screen** for an app icon.

<img src="assets/qr-web.png" width="200" alt="QR code: Saff web app">

Everything works except lock-screen notifications. The adhan popup still appears in the app.

## Play the demo (either option)

1. On onboarding, pick a campus and tap **Continue**. The fields are prefilled.
2. On the **Home** tab, **long-press the "Saff" wordmark** and tap **Play demo**.
3. In Expo Go, lock the phone. About 3s later the adhan notification arrives. Tap it.
4. The "It's Asr" popup appears. Tap **Yes, I'm free**, and the **Chat** tab opens as 4 people join.
5. Tap a spot chip, then an avatar (LinkedIn/Instagram). Tap **We prayed**, and the streak goes from 6 to 7.
6. Long-press "Saff" and tap **Reset** to replay.

## Shipping changes (after you push code)

```bash
git pull --rebase
npm run publish:app -- "what changed"   # updates the Expo Go link for everyone (~1 min)
npm run deploy:web                      # updates saff-sand.vercel.app (~1 min)
git push
```

Publishing needs the Expo account `evanlyy168` and the Vercel team `nichetrack`. If you're not logged in, ping Evan to publish.

## Developing locally (only if you're editing code)

```bash
git clone https://github.com/chheangg/Saff.git && cd Saff && npm install
npx expo start --tunnel     # campus Wi-Fi blocks LAN, so use --tunnel
```

If the tunnel is blocked on your laptop (like Ali's), skip it. Push your branch and ping Evan to publish, then reopen Expo Go from Option 1. Or test in a browser with `npx expo start --web`.

## The backend (live mode)

The server is live on Replit at **https://saff-alimran13.replit.app**. It's always on and fires the adhan at real San Diego prayer times. Open the link to see today's times and how many people are connected.

**The app connects to it by default** (`src/live.js`), locally and in both published links. No `.env` needed. To force offline-only, set `EXPO_PUBLIC_SERVER_URL=off`. **Play demo** still works on top of live mode: while the demo runs, the app ignores server events.

**Fire an adhan now (for testing or the demo):** open **https://saff-alimran13.replit.app/admin** on your phone, enter `ADMIN_KEY` once, and tap a prayer. The page also shows who has joined each group in real time. Or use curl:

```bash
curl -X POST "https://saff-alimran13.replit.app/adhan?key=<ADMIN_KEY>" -H 'content-type: application/json' -d '{"prayer":"asr"}'
```

Ask Ali for `ADMIN_KEY`. It's a Replit Secret and never goes in git. Every phone with the app open gets the adhan popup.

**Changing the server:** edit `server/`, push, then Ali pulls and republishes on Replit. Redeploying wipes saved users and streaks (`server/data.json`).

## The contract

| Person | Owns | Files |
| --- | --- | --- |
| **Ibrahim** | Frontend + demo + design | `design/saff.pen` (see Design handoff below), `src/TabBar.js`, `src/screens/Takeover.js`, `ChatTab.js`, `Chat.js`, `Matching.js`, `Food.js`, `Profile.js`, `Sheets.js`, `src/data.js` (demo pacing: `JOIN_TIMES`, `CHAT_SCRIPT`). Records the 60s video. |
| **Evan** | Frontend + app side of live mode | `src/screens/Onboarding.js`, `Home.js`, `src/live.js` (socket client), `src/persist.js`, `App.js`, publishing (Expo + Vercel). |
| **Ali** | Server + deploy | `server/`, `.replit`, the Replit deployment and its `ADMIN_KEY`. Server is live at https://saff-alimran13.replit.app. |
| Shared, ask first | | `src/store.js`, `src/ui.js`, `src/theme.js`, `app.json`, `package.json` |

**State and actions** (`src/store.js`): screens read `state` and call `dispatch`.

```js
state = {
  onboarded, tab,          // tab: 'home' | 'chat' | 'food' | 'profile'
  me,                      // { id:'me', name, campus, gender, major, year, linkedin, instagram, streak, prayedToday }
  adhan,                   // { key:'asr', label:'Asr', timeLabel:'2:31 PM', at } or null
  response,                // null | 'free' | 'no' | 'prayed'
  group: { members, messages: [{ id, userId, text, at }], expiresAt, spot, spotStats },
  chatOpen, streakSheet, profile, network,   // network: { prayers, campuses }
}
// actions: ONBOARD · HYDRATE · TAB · ADHAN · RESPOND · JOIN · OPEN_CHAT · MESSAGE · PIN_SPOT
//          PRAYED · CLOSE_STREAK · PROFILE · GROUP · ME · NETWORK · RESET
```

**Server events** (live mode): `src/live.js` (Evan) ↔ `server/index.js` (Ali). If you change an event, change both sides in the same PR, or ping the other person.

Groups are per **campus + gender** (for example `ucsd:brother`). An adhan opens a fresh group that lasts 30 min.

**No free mixing (hard rule):** brothers only ever see brothers, and sisters only ever see sisters. That covers group lists, profiles and chat messages. If someone changes gender or campus, the server removes them from their old group. `cd server && npm test` checks this with fake phones; run it before pushing any server change. Gender is self-reported at onboarding, so the app can't verify it.

| Direction | Event | Payload |
| --- | --- | --- |
| app → server | `join` | `{ id, pushToken?, name, gender: 'brother'\|'sister', campus: 'ucsd'\|'sdsu'\|'mesa'\|'usd', major, year, linkedin, instagram, streak, prayedToday }`. Sent on connect, after onboarding, and when gender changes; `id` is the device id from `persist.js` |
| app → server | `free` | none. Ignored unless an adhan fired in the last 30 min |
| app → server | `message` | `text` (string, max 500). Only group members can post |
| app → server | `spot` | `spotId` (string, a spot id from the campus's `spots` in `src/data.js`) |
| app → server | `prayed` | none. +1 streak once per Pacific day |
| server → app | `adhan` | `{ key: 'asr', label: 'Asr', timeLabel: '2:31 PM', at }` |
| server → app | `group` | `{ members: [user], messages: [{ id, userId, text, at }], expiresAt, spot, spotStats: { spotId: { count, last? } } }` |
| server → app | `me` | your user: `{ id, name, gender, campus, major, year, linkedin, instagram, streak, prayedToday }` |
| server → app | `network` | `{ prayers, campuses }` today across all campuses |

## Design handoff (Pencil)

The source of truth is **`design/saff.pen`**. Open it in the Pen app (pen.dev), signed in. To let Claude Code edit it, add the Pencil MCP server once:

```bash
claude mcp add pencil -- /Applications/Pen.app/Contents/Resources/app.asar.unpacked/out/mcp-server-darwin-arm64 --app desktop
```

**Done (Evan, and matching the app):** Home (light + dark), Adhan popup, Chat, Streak celebration, and the reusable Status Bar and Tab Bar components. Variables hold the tokens, with a `mode: light|dark` theme.

**Next (Ibrahim):**
- [ ] Design Onboarding, Matching, Halal Food, Profile, and the Chat empty state in the same style, then port them to code.
- [ ] Add dark variants for the Popup, Chat, and Streak screens: copy the frame and set `theme: {mode: "dark"}`.
- [ ] Record the 60s video. Use `EXPO_PUBLIC_THEME=dark` or `light` to pin a theme.

**In progress (Evan):**
- [x] **Prayer map:** a map card in the group chat shows where the jama'ah is. It plots the campus spots, highlights the pinned spot in emerald, lets you tap a pin to choose the spot, and has a Directions button that opens Apple or Google Maps. iOS and Android use `react-native-maps`; web uses an OpenStreetMap embed. Spot coordinates in `src/data.js` are approximate, so walk them and fix them.
- [x] Check the app against `saff.pen` in Pencil. The "Live App (verify)" frame holds a canvas browser on `localhost:5055`. This check caught invisible text in dark mode, now fixed: Text defaults to the theme ink.
- [x] **Live now card** on Home: front and center while your group's jama'ah is open. It shows the live dot, the prayer, the spot and walk time, who's there, and Join/Open. Designs are "Home · Live (Brothers)" and "(Sisters)". It only ever shows your own campus+gender group.

**Real alerts (Evan, needs Ali to redeploy):**
- [x] Adhan alerts are on by default after onboarding. The app asks for permission and schedules today's 5 prayers on the phone, so they work offline and with the app closed. The Home switch opts out.
- [x] Push: the app sends its Expo push token in `join` (`pushToken`). `POST /adhan` (the admin page) now also pushes to every registered phone, so closed apps get it too. Ali reviewed it: each phone gets exactly one push (a reinstall moves the token to the new account), uninstalled phones are dropped, and Expo calls time out after 10s. `npm test` covers this with a fake Expo service. **Ali: redeploy on Replit.**
- [x] **Edit profile + sign out** (Profile tab): change name, campus, brother/sister, and links. Changes rejoin the server right away. Sign out wipes the device and returns to onboarding.
- [x] **First one in isn't stuck:** in a live group, Matching lets you open the chat alone after 4s ("You're first").
- [x] **Real walk times:** the chat asks for location once and computes minutes to each spot (straight-line × 1.2 at 80 m/min). Spots sort last-used first, then nearest. Location never leaves the phone. When you're more than 3 km from campus, it keeps the default estimates.
- [x] **Past chats** (Chat tab when no live group): a scrollable list of previous jama'ahs. Open one to read it, and tap anyone to see their profile, LinkedIn, and Instagram. Real chats are saved on "We prayed" (`state.history`, persisted). The demo seeds a week of history (`demoHistory` in `src/data.js`).
- [x] **Live test against production (6:15 PM Isha, web + a scripted second phone):** real onboarding (blank form, wrong-domain email blocked), the server adhan popup on join, the second brother appearing instantly on the Live card, popup, and Matching, his message and spot reaching the chat and map, my reply going through the server, the real streak going 0 → 1, and the chat saved to past chats. No JS errors.
- [x] **Demo profile is offline:** "Use demo profile" never joins the live server, so recordings are deterministic and real groups never get a fake Evan. Real accounts stay live.
- [ ] Repeat the live test on two real iPhones (Expo Go). There's no iOS simulator on Evan's Mac. The server fires on its own, no admin key needed.

**Tokens** (`src/theme.js` mirrors the .pen variables):

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| ink (`C.black`) | `#0B0B0F` | `#F4F4F5` | text |
| surface (`C.white`) | `#FFFFFF` | `#17171C` | cards, bubbles, sheets |
| canvas | `#F4F4F2` | `#0B0B0F` | screen background |
| accent | `#10B981` | same | "free / prayed", primary CTA |
| brand | `#6366F1` | same | active tab, your bubbles, current prayer |
| flame | `#F97316` | same | streak |
| onColor | `#FFFFFF` | same | text/icons on accent, brand, flame, avatars |

**Rules:**
- Geist font (Geist Mono for small uppercase labels).
- Cards are borderless (`CARD` in theme.js), with no outlines.
- Use pills for chips and buttons. One primary action per screen. Keep copy to a few words.
- Never put `C.white` text on a colored fill. Use `C.onColor`, because `C.white` turns dark in dark mode.
- Mascot PNGs are in `assets/mascot/`.

**Web-safe rules:** `Alert.alert` does nothing on web, so use a `Sheet`. Notifications and haptics must be optional, guarded by `Platform.OS !== 'web'` or `.catch(() => {})`.

**Git:** pull before you start, commit small, push often.
