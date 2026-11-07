# Get Saff on your phone

## Fastest: use Evan's running server (nothing to install but Expo Go)

1. Install **Expo Go** from the App Store / Play Store.
2. Open this in Expo Go (on iPhone, paste it into Safari or scan the QR code Evan shares):
   `exp://c-evanlyy168-6s543z-mw5nzzwjvvg2osag.on.expo.app`
   <img src="assets/expo-go-qr.png" width="200" alt="QR code to open Saff in Expo Go">
3. Wait 30–60s on first load. Works on campus Wi-Fi and cellular.

This shows **Evan's laptop's code**, so your edits won't appear. To work on the code, use the next section.

## Run it from your own laptop (to edit code)

```bash
git clone https://github.com/chheangg/Saff.git
cd Saff
npm install
npx expo start --tunnel     # campus Wi-Fi blocks LAN, so always use --tunnel here
```

Scan the QR code in the terminal with the iPhone camera (Android: scan it from Expo Go). Save a file and the phone reloads.

Stuck on "Opening project…" for more than 2 minutes? Stop with Ctrl+C, run `npx expo start --tunnel --clear`, and make sure your phone has signal.

## Play the demo

1. Tap **Continue** on onboarding (it's prefilled).
2. **Long-press the "Saff" wordmark** on Home and tap **Play demo**.
3. Lock the phone. About 3s later the adhan notification arrives. Tap it.
4. **I'm free** → pulse fills with 4 brothers → chat opens automatically → tap a spot chip → tap an avatar → **We prayed** → streak goes 6 → 7.
5. Long-press "Saff" → **Reset** to replay.

## The contract

Who owns what, so nobody edits the same file at once.

| Person | Files | Notes |
| --- | --- | --- |
| **Ibrahim** (frontend + demo) | `src/screens/Takeover.js`, `Matching.js`, `Chat.js`, `Sheets.js`, `src/data.js` | Demo pacing: `JOIN_TIMES` and `CHAT_SCRIPT` in `src/data.js`; chat message spacing is in `playChat` in `src/store.js`. Records the 60s video. |
| **Evan** (frontend + backend) | `src/screens/Onboarding.js`, `Home.js`, `src/live.js`, `App.js` | Owns live-mode wiring. |
| **Ali** (backend + deploy) | `server/` | Deploys the server, shares the URL for `EXPO_PUBLIC_SERVER_URL`. |
| Shared, ask first | `src/store.js`, `src/ui.js`, `src/theme.js` | Ping the group chat before changing these. |

**State and actions** (`src/store.js`). Screens read `state` and call `dispatch`. Don't add new state shapes without telling the others.

```js
state = {
  onboarded, me,               // me: { id:'me', name, gender, major, year, linkedin, instagram, streak, prayedToday }
  adhan,                       // { key:'asr', label:'Asr', timeLabel:'2:31 PM', at } or null
  response,                    // null | 'free' | 'no' | 'prayed'
  group: { members: [user], messages: [{ id, userId, text, at }], expiresAt },
  chatOpen, streakSheet, profile,
}
// actions
ONBOARD {profile} · ADHAN {prayer} · RESPOND {answer:'free'|'no'} · JOIN {user} · OPEN_CHAT
MESSAGE {userId, text} · PRAYED · CLOSE_STREAK · PROFILE {user|null} · GROUP {group} · ME {me} · RESET
```

**Which screen shows** (`App.js`): not onboarded → Onboarding; adhan and no response → Takeover; response `free` → Matching, then Chat once `chatOpen`; otherwise Home. Streak and Profile are sheets on top.

**Server events** (live mode only, `server/index.js`): the client sends `join`, `free`, `message`, `prayed`, and the server sends `adhan`, `group`, `me`.

**Design rules:** black/white/grays + one green accent `#06C167` (from `src/theme.js`). One primary button per screen. Use `Button`, `Avatar`, `Sheet`, `PopIn` from `src/ui.js` and don't add new colors.

**Git:** pull before you start, commit small, push often. `git pull --rebase && git push`.
