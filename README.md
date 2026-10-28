# NEON RIFT — Advanced Online Multiplayer Mobile Game

**NEON RIFT** is a futuristic top-down multiplayer arena game built for mobile and desktop web browsers. Up to 8 players enter a cybernetic arena to collect energy crystals, capture tactical control zones, dodge attacks, and deploy abilities to claim victory.

---

## 1. What Works

- **Authoritative 30Hz Game Server**: Real-time Node.js + WebSocket game server (`server.ts`, `GameRoom.ts`) hosting rooms with 2–8 players, handling physics, collision detection, crystal spawning, control zones, combat resolution, and match timers.
- **Phaser 3 Game Engine Canvas**: Seamless high-performance 2D WebGL/Canvas renderer with cyber grid floor, obstacle barriers, orbital control zone rings, floating animated crystals, thruster particle trails, shield bubbles, and shockwave pulses.
- **Mobile-First Touch & Desktop Controls**:
  - Virtual floating touch joystick on bottom-left for mobile devices.
  - Ability buttons on bottom-right (Dash, Shield, Energy Pulse) with circular cooldown sweeps and audio-haptic feedback.
  - Full desktop keyboard support (WASD / Arrow keys for movement, Space for Dash, Q for Shield, E for Pulse).
- **Procedural Web Audio Engine**: High-fidelity sci-fi sound synthesizer built with Web Audio API (crystal chimes, cyber whoosh, hardlight shield hum, energy pulse boom, takedown fanfare) with zero external asset dependencies.
- **4 Original Heroes**:
  - **VORTEX**: Hyper-Kinetic Flux Runner (+15% sprint speed & rapid dash recovery).
  - **AEGIS**: Titan Hardlight Bulwark (+40% max health & reinforced long-life shield).
  - **STRIKER**: High-Voltage Overcharger (+80% pulse blast & knockback force).
  - **PHANTOM**: Spectral Rift Infiltrator (+25% crystal pickup radius & extended warp dash).
- **Matchmaking & Rooms**:
  - Public instant matchmaking queue.
  - Private custom rooms with 4-letter shareable room codes.
  - Practice mode vs AI bots for instant offline drills.
- **Persistence & Cloud Sync**:
  - Firebase Authentication (Google Sign-In) and guest play.
  - Cloud Firestore integration for user profiles, match records, and competitive leaderboards with deployed security rules.

---

## 2. Automated Test Suite

Run tests via:
```bash
npm test
```

Verified test cases:
1. Room creation and player joining.
2. Room capacity enforcement.
3. Input vector normalization and speed limit enforcement (anti-cheat).
4. Authoritative crystal collection with atomic duplicate-collection prevention.
5. Strict ability cooldown verification (Dash, Shield, Pulse).
6. Damage, knockback, takedown attribution, and respawn invulnerability.
7. Control-zone capture progression and point ticking over time.
8. Two separate connected clients receiving authoritative match state.
9. Match completion and deterministic tie-breaking.

---

## 3. How to Run Locally

```bash
# Install dependencies
npm install

# Start full-stack server (HTTP + WebSockets + Vite dev middleware on port 3000)
npm run dev

# Run automated tests
npm test

# Build production bundle
npm run build
```

---

## 4. How to Test Multiplayer with Two Clients

1. Open `http://localhost:3000` in Browser Window A (or Mobile Browser 1).
2. Open `http://localhost:3000` in Browser Window B (incognito, separate profile, or Mobile Browser 2).
3. Option A (Public Match): Click **PLAY ONLINE** in both windows to be matched into the same arena.
4. Option B (Private Room):
   - In Window A, click **CREATE ROOM** to get a 4-letter code (e.g. `XY9K`).
   - In Window B, click **JOIN ROOM**, enter `XY9K`, and click **CONNECT**.
   - In Window A, click **LAUNCH MATCH** to start the countdown and battle in real time!
