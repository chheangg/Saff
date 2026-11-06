# Saff — Hackathon Plan

MTC x Replit x Manara West Buildathon · Track: **Deen & Dunya** · Team: Evan, Ibrahim, Ali
Live doc: https://claude.ai/artifact/GhMSt8eBoBn28mbgx35qJG

## Pitch

Saff turns every adhan into a chance to meet. When prayer time hits, UCSD Muslims nearby get one ping: "Free to pray?" Everyone who taps Yes lands in a temporary group chat that expires after the prayer. There they pick a spot (a saved one or the nearest) and pray together. Profiles link LinkedIn and Instagram, so people who hit it off can connect on the spot.

**Adhan → "Free?" ping → temp group chat → meet and pray → connect.**

## Design direction: Uber Base

Borrowed from Uber's [Base design system](https://base.uber.com). It's the quietest of the three options. Duolingo is too playful, and Airbnb is photo-heavy. Uber's request flow (one big button, a live "matching" state, then a match) maps 1:1 onto ours.

- **Color:** black, white, and grays only. One accent: green `#06C167`, used only for "I'm free" and live states.
- **Type:** Inter (stand-in for Uber Move). 32 bold for the headline, 16 for body, 13 for meta.
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

## Tech stack: one Replit, one repo, zero accounts

| Layer | Pick | Why |
| --- | --- | --- |
| Frontend | Vite + React + Tailwind | Instant HMR; Base rules = small Tailwind config |
| Realtime | Express + Socket.IO, in-memory | Live chat in about 40 lines, no DB/auth/keys |
| Prayer times | `adhan` npm package, UCSD 32.8801, -117.2340 | Real times, computed offline |
| "Push" | In-app takeover + adhan audio + browser `Notification` | Looks better on a projector than real push |
| Login | Pick a name + gender (ucsd.edu field is cosmetic) | Skips auth |
| Hosting | Replit deploy (fallback: laptop + ngrok) | Judges scan a QR code and join |

**Demo mode is the backbone.** Every screen renders from one server-broadcast `state` object.

- `/?demo=1` plays a scripted timeline: fake adhan now → 4 seeded bots tap "I'm free" → timed chat messages. **Reset** replays it. Deterministic, works offline.
- **Live mode:** the presenter's "Trigger adhan" button pings every connected phone. Judges join from the QR code and show up in the real chat.

Out of scope (pitch them as next steps): real auth, a DB, native push, location tracking, moderation.

## Task split

The only shared contract is the `state` shape and the socket events. Agree on both in the first 15 minutes.

| Person | Owns | Deliverables |
| --- | --- | --- |
| **Evan** | Frontend + design | Tailwind tokens. All 6 screens wired to `state` |
| **Ibrahim** | Server + realtime | Express + Socket.IO. Events `join`, `adhan`, `free`, `message`, `reset`. Brother/sister groups, 30-min expiry, "Trigger adhan" route |
| **Ali** | Replit + demo engine + pitch | Replit setup + deploy + QR code. `adhan` times. Seed data: 8 profiles, 5 UCSD spots. `?demo=1` timeline + Reset. Adhan audio. Slides, script, judge-feedback log (consult ≥ 2 judges) |

**Timeline**

1. **2:45–3:00, all:** agree on the contract. Ali creates the Replit and imports this repo.
2. **3:00–4:30:** solo builds (Evan: screens on mock state · Ibrahim: sockets · Ali: demo script + seed data).
3. **4:30:** wire the frontend to sockets. Ali gets judge #1's feedback.
4. **4:30–6:00:** full live loop on 3 phones. Ali gets judge #2's feedback. Evan polishes the animations.
5. **6:00–6:30:** freeze, deploy, rehearse 3 times, record a backup video.
6. **6:30–7:00:** buffer + slides.

## Demo script (2 min)

1. **Hook (15s):** "At UCSD you see people partying or studying. You rarely see someone stepping out to pray."
2. **Replay (45s):** `?demo=1` on the projector: adhan → takeover → I'm free → pulse fills → chat → spot suggested → profile → LinkedIn.
3. **Live (40s):** QR code on screen, judges join, "Trigger adhan", every phone lights up, judges appear in the group.
4. **Close (20s):** Deen & Dunya fit. Next: ucsd.edu verification, native push, a Manara network across campuses.

**Backups:** demo mode on localhost if the Wi-Fi dies, and a recorded video if everything dies.
