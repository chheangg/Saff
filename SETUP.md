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

**Use it locally:** run `cp .env.example .env` and restart Expo. The app then joins real groups with everyone else instead of running the scripted demo. To go back to offline demo mode, delete `.env`. `.env` is gitignored, so each person makes their own.

**Use it in the published apps (Evan):** `.env` isn't uploaded when publishing, so set `EXPO_PUBLIC_SERVER_URL=https://saff-alimran13.replit.app` once in each place, then republish:
- Expo: expo.dev, project **Environment variables**, **production** environment (that's what `publish:app` uses)
- Vercel: project **Settings → Environment Variables**, **Production**

**Fire an adhan now (for testing or the demo):**

```bash
curl -X POST "https://saff-alimran13.replit.app/adhan?key=<ADMIN_KEY>" -H 'content-type: application/json' -d '{"prayer":"asr"}'
```

Ask Ali for `ADMIN_KEY`. It's a Replit Secret and never goes in git. Every phone with the app open gets the adhan popup.

**Changing the server:** edit `server/`, push, then Ali pulls and republishes on Replit. Redeploying wipes saved users and streaks (`server/data.json`).

## The contract

| Person | Owns | Files |
| --- | --- | --- |
| **Ibrahim** | Frontend + demo | `src/TabBar.js`, `src/screens/Takeover.js`, `ChatTab.js`, `Chat.js`, `Matching.js`, `Food.js`, `Profile.js`, `Sheets.js`, `src/data.js` (demo pacing: `JOIN_TIMES`, `CHAT_SCRIPT`). Records the 60s video. |
| **Evan** | Frontend + backend | `src/screens/Onboarding.js`, `Home.js`, `src/live.js`, `src/persist.js`, `App.js`, publishing. |
| **Ali** | Backend + deploy | `server/`. Puts the server online and shares the URL for `EXPO_PUBLIC_SERVER_URL`. |
| Shared, ask first | | `src/store.js`, `src/ui.js`, `src/theme.js`, `app.json`, `package.json` |

**State and actions** (`src/store.js`): screens read `state` and call `dispatch`.

```js
state = {
  onboarded, tab,          // tab: 'home' | 'chat' | 'food' | 'profile'
  me,                      // { id:'me', name, campus, gender, major, year, linkedin, instagram, streak, prayedToday }
  adhan,                   // { key:'asr', label:'Asr', timeLabel:'2:31 PM', at } or null
  response,                // null | 'free' | 'no' | 'prayed'
  group: { members, messages: [{ id, userId, text, at }], expiresAt, spot, spotStats },
  streakSheet, profile, network,   // network: { prayers, campuses }
}
// actions: ONBOARD · HYDRATE · TAB · ADHAN · RESPOND · JOIN · OPEN_CHAT · MESSAGE · PIN_SPOT
//          PRAYED · CLOSE_STREAK · PROFILE · GROUP · ME · NETWORK · RESET
```

**Server events** (live mode, `server/index.js`): the client sends `join`, `free`, `message`, `spot`, `prayed`, and the server sends `adhan`, `group`, `me`, `network`.

**Design:** black, white, and grays, with one green accent `#06C167`. One primary button per screen. Use the components in `src/ui.js`.

**Web-safe rules:** `Alert.alert` does nothing on web, so use a `Sheet`. Notifications and haptics must be optional, guarded by `Platform.OS !== 'web'` or `.catch(() => {})`.

**Git:** pull before you start, commit small, push often.
