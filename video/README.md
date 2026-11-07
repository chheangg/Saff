# Saff: 60-second video

## Upload footage (do this)

1. iPhone → Photos (clips) and Voice Memos (the memo) → **Share → AirDrop →** Evan's Mac. Files land in Downloads.
2. Drag everything into **`video/raw/inbox/`**. Any names are fine.
3. Tell Claude **"footage is in"**.

**Screen recordings: turn the mic ON** (Control Center → long-press Screen Recording → Microphone). The walking camera and the phone then hear the same street, so `analyze.mjs` syncs them to the frame. With the mic off, it falls back to the clips' recording timestamps, which are close but not frame-exact.

## The edit layout (16:9, 1920×1080)

1. **Scene 1:** Ibrahim studying, full frame. The **voice memo** replaces the camera audio, auto-synced by waveform.
2. **Scenes 2+:** **left half** = Ibrahim walking and using the app (cropped portrait). **Right half** = the phone screen recording, whole, with rounded corners on the dark canvas. Both play in sync.
3. Burned-in captions from the voice (whisper.cpp, on this Mac), title card, end card with the logo.

**Pipeline (Claude runs it):** `node video/tools/analyze.mjs` sorts the inbox by recording time, classifies each file (camera / screen / memo), and syncs memo↔camera and screen↔walk by sound. It writes `video/raw/plan.json`. Then Claude builds the kino project from the plan: imports, layout, captions (`add_captions speech`, fixing "SAF" → "Saff"), title/end cards, music ducked under the voice, and renders to `video/exports/`.

**Music (chosen):** "Angel Share" by Kevin MacLeod (incompetech.com), CC BY 4.0, ducked under the voice. The credit is on the end card. `video/music/angel-share.mp3` is downloaded and sha256-checked; it's gitignored, so the kino project `saff-60` already holds a copy.

**Brand assets:** `assets/brand/` has `logo-on-dark.png`, `logo-on-light.png`, `title-card-16x9.png`, and `end-card-16x9.png` (from `design/saff.pen`).

---


**Ibrahim records** (himself plus his phone screen). **Claude edits** with **kino**, a local motion engine connected to Claude Code over MCP. Drop footage in `raw/`, then ask Claude to cut it.

```
video/
  raw/selfie/   Ibrahim talking to camera / walking to prayer   (not in git)
  raw/screen/   iPhone screen recordings                        (not in git)
  music/        optional background track (royalty-free)        (not in git)
  exports/      kino renders                                    (not in git)
  assets/       mascot PNGs + screens/ (design stills, light and dark)
  brand.json    colors, fonts, tagline, rules for the edit
```

Share footage by AirDrop or Drive into `raw/` on Evan's Mac. It's too big for git.

---

## The story (60s, vertical 1080×1920)

| Time | Picture | Words (voiceover or on-screen) |
|---|---|---|
| 0–5s | **Selfie:** Ibrahim walking on campus, library or Price Center behind him | "At UCSD it's easy to feel like the only one stepping out to pray." |
| 5–12s | **Screen:** lock screen, the adhan notification arrives, tap it | "So when the adhan goes off…" |
| 12–20s | **Screen:** the "It's Asr time!" popup, faces pop in, tap **Yes, I'm free** | "…Saff finds brothers nearby who are free right now." |
| 20–32s | **Screen:** group chat, messages roll in, tap the Price Center spot, the map pin turns green, tap **Go** | "A group chat for this prayer only. Pick a spot, get walking directions." |
| 32–40s | **Selfie:** Ibrahim walks up, meets 2–3 friends, salaams, they line up (no recording during prayer itself) | (music swells, no words) |
| 40–48s | **Screen:** tap **We prayed**, the flame pops, the streak goes 6 → 7 | "Every jama'ah keeps your streak alive." |
| 48–55s | **Screen:** Chat tab → past chats → tap a face → LinkedIn | "Hit it off? Connect right there." |
| 55–60s | **End card** (kino): mascot + "Saff · Pray together. Never alone." + track name | "Saff. Deen and dunya, together." |

The voiceover runs about 75 words. Record it separately in a quiet room (Voice Memos is fine) as `raw/selfie/vo.m4a`. kino ducks the music under it.

---

## How Ibrahim records (pick a scenario)

**Before any take:** iPhone **Do Not Disturb off** (notifications must show), **Screen Recording** in Control Center, 100% battery or charging, and close other apps.

### Scenario A: Native app, real notification (best)
1. Expo Go → open Saff (QR in `SETUP.md`). Tap **Use demo profile** on onboarding.
2. Pick the look: Settings → Display → Light or Dark, then fully close and reopen Expo Go.
3. Start the screen recording. On Home, **long-press "saff" → Play demo**, then **lock the phone right away**.
4. About 3s later the notification lands. Tap it, then **Yes, I'm free**. Wait for 4 people, then the chat opens.
5. Tap the **Price Center** spot, tap **Go** (show Apple Maps for 2s, then swipe back).
6. **We prayed** → streak. Then Chat tab → open a past chat → tap Yusuf → LinkedIn.
7. Stop the recording. **Reset:** long-press "saff" → Reset. Do 3 takes.

### Scenario B: No notification (permissions or Expo Go acting up)
- Skip the lock screen. On Home, tap **Join** on the green **Live now** card, which goes straight into the group. Or use **Play demo** without locking: the in-app popup still appears.
- In the edit, Claude opens on the `02-adhan-popup.png` still instead of the lock screen.

### Scenario C: Expo Go won't load at all
- Use **https://saff-sand.vercel.app** in Safari and add it to the Home Screen so it opens full screen. Same steps, minus lock-screen notifications. The map is OpenStreetMap there.

### Scenario D: Real proof shot (optional, 5s)
- At a real prayer time the server fires the adhan by itself, or Ali taps a prayer on `/admin`. Film two phones getting it at once. That shows the product is real, not only a demo.

### Scenario E: No usable footage (worst case)
- Claude builds the whole video in kino from `assets/screens/*.png`, the mascot, captions, and the voiceover. It's motion graphics only, and it still tells the full story.

**Filming tips:** shoot vertical, with daylight on your face. Keep the phone 30 cm from the lens for over-the-shoulder shots. Hold each screen 2s longer than feels natural, since cuts eat time. No music while filming, because Claude adds it in the edit.

---

## How Claude edits (Evan runs this)

1. Start kino: `cd ~/repos/kino && npm start` (dashboard at http://127.0.0.1:4781), or `npm run desktop` for the Mac app.
2. Open Claude Code in this repo and paste:

   > Make the Saff 60s video with kino. Follow video/README.md (story table) and video/brand.json. Footage is in video/raw/, stills in video/assets/screens/. Vertical 1080×1920, captions on, duck music under the VO, end card with the mascot. Render final to video/exports/. Also make a 16:9 cut for the projector and a 15s teaser.

3. kino stops at checkpoints (the storyboard, the rough cut). Approve or leave notes in the kino dashboard.

**Outputs:** `exports/saff-60s-vertical.mp4` (submission), `exports/saff-60s-16x9.mp4` (projector), `exports/saff-15s-teaser.mp4` (socials).

**Setup status (Evan's Mac):** kino is installed at `~/repos/kino`, with FFmpeg 8.1, Gifski, and Electron. The MCP server is registered as `kino` (user scope), and the skill is copied to `~/.claude/skills/kino`. A smoke render passed: import → layers → draft MP4 with loudness checks.
