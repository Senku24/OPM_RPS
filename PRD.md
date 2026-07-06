# PRD — One Punch RPS

A rock–paper–scissors web game reskinned as an anime fight, inspired by *One Punch Man*. This document is written to be handed directly to an AI coding agent as the build spec. Pair it with `SCHEMA.md` for the data model.

---

## 1. Product overview

**Elevator pitch:** Pick your fighter from a roster inspired by One Punch Man, throw rock/paper/scissors as a flashy special move, and watch a short fight animation before the result lands. Play a scripted AI opponent solo, or generate a link and play a friend live, best-of-3.

**Design intent (important for the agent building UI):** This is not a plain RPS app with anime skins bolted on. Every screen should read like a comic panel — bold outlines, halftone dot textures, diagonal speed lines, punchy impact frames, onomatopoeia text ("DON!", "ZAAN!"). Think manga panel transitions, not corporate SaaS card layouts. Keep it lightweight (SVG/CSS/Lottie), never at the cost of frame rate.

**Non-goals for v1:** no persistent accounts/login, no in-app purchases, no chat between friends, no matchmaking with strangers, no mobile native app (responsive web only), no leaderboard beyond simple personal stats.

---

## 2. Users & core flows

Single user type: a guest player identified by a device-local `guestId` (see `SCHEMA.md` → Auth model). No sign-up friction — the point is to click a link and start fighting within seconds.

### Flow A — Dashboard → Play vs AI
1. Land on dashboard, see character grid.
2. Tap a character card → character is "selected" (visual highlight + a signature quote/roar animation).
3. Tap "Fight the CPU."
4. Redirected to Playzone in AI mode. Match created server-side (`mode: 'ai'`).
5. Player picks rock/paper/scissors → server picks AI's move → both moves revealed together → move-specific fight animation plays → round result shown.
6. Repeat until one side reaches 2 round wins (draws replay the same round, see §4.3).
7. Match end screen: winner splash, "Rematch" and "Back to dashboard" actions.

### Flow B — Dashboard → Play vs Friend
1. Select a character (same as above).
2. Tap "Challenge a friend" → server creates a `room` (`SCHEMA.md` → rooms) → returns a shareable link `.../join/{roomCode}`.
3. Host sees a waiting screen ("Waiting for an opponent...") with a copy-link button and a live "friend joined!" transition once the guest connects.
4. Friend opens the link, is prompted for a display name (optional) and a character, joins the room via WebSocket.
5. Once both are ready, both clients are redirected into the same Playzone (`mode: 'friend'`), matched by `roomCode`.
6. Each player independently submits a move each round on their own screen. Neither sees the opponent's move until **both** have submitted — server holds the reveal until both moves are in, then emits both simultaneously (prevents peeking).
7. Fight animation plays on both screens using each player's chosen character + move, then result. Same best-of-3, draw-replay rule as Flow A.
8. Match end screen shown to both players.

---

## 3. Feature breakdown

### 3.1 Dashboard
- Character grid (roster of ~8 characters to start; see §5 for the seed roster).
- Each card: portrait, name, title/epithet, tier badge (flavor only).
- Selecting a character shows an expanded preview panel with their 3 move names.
- Two primary CTAs, enabled only after a character is selected: **Fight the CPU** and **Challenge a friend**.

### 3.2 Playzone (shared by both modes)
- Two fighter portraits facing off (left = you, right = opponent/CPU), OPM-style versus banner between them.
- Round tracker (e.g. three pips per side, filling in as rounds are won).
- Move picker: three large tappable icons (rock/paper/scissors), each themed with the selected character's move name instead of the generic icon label (e.g. Saitama's "rock" reads "Serious Punch").
- On submission:
  - Solo/AI: immediately compute CPU's random move.
  - Friend: show a "waiting for opponent..." micro-state if the other player hasn't moved yet.
- Reveal sequence (see §4.2 for exact timing): brief pre-clash beat → fight animation unique to (character, move) pair → impact frame + result banner (WIN / LOSE / DRAW).
- Persistent round score visible at all times.

### 3.3 Match end screen
- Full-screen "victory"/"defeat" splash in the winning character's theme color.
- Buttons: Rematch (same opponent/character, new match), Change character, Back to dashboard.

### 3.4 Friend-mode lobby
- Room link with one-tap copy and native share sheet (`navigator.share` with clipboard fallback).
- Simple presence indicator so the host knows the instant a guest joins.
- Basic abandonment handling: if a room's `expiresAt` passes with no guest, show "Link expired, generate a new one."

---

## 4. Game logic (implement exactly as specified)

### 4.1 Move resolution
Standard RPS: rock beats scissors, scissors beats paper, paper beats rock. Same move on both sides = draw.

### 4.2 Reveal sequence & timing (per round)
1. Both moves are known server-side (AI mode: instantly; friend mode: once both players have submitted).
2. Server computes the round result and emits/returns: `{ player1Move, player2Move, result, animationRefs }`.
3. Client plays the pre-clash beat (~200–300ms), then the fight animation matched to **each character's own move** (e.g. if Genos threw rock and Tatsumaki threw paper, play Genos's rock animation and Tatsumaki's paper animation, likely simultaneously or in a quick 1-2 beat, whichever reads better — recommend simultaneous, ~600–900ms total).
4. Impact frame (freeze/flash, ~150ms) then the result banner and updated round pips.
5. Total reveal sequence should stay under ~1.5s so back-to-back rounds still feel snappy in co-op play.

### 4.3 Best-of-3 with draw-replay
- First player to reach **2 round wins** takes the match (so a match is at most 3 rounds when there are no draws, but can run longer if draws occur — draws don't count toward the 3).
- A draw does not advance the round counter or consume a "round slot" — it immediately replays as the same round number (see `SCHEMA.md §4` for how this is represented: a new `rounds[]` entry with `isReplay: true` and the same `roundNumber`).
- Match ends the instant either side reaches 2 `roundWins` — don't play a needless 3rd round if someone already has 2.

### 4.4 AI opponent (solo mode)
- v1: uniformly random move each round (`Math.random()` mapped to rock/paper/scissors) — matches the "cpu picks a random move" spec exactly.
- Leave a clean seam to later swap in a smarter AI (e.g. slight bias against the player's most recent move) without touching the API contract — the random choice should live in one isolated function.

---

## 5. Character roster (seed data for v1)

Original stylized art per character — do not reproduce official manga/anime artwork; design fresh silhouettes/illustrations that evoke each character's vibe (silhouette, color palette, signature pose) to stay clear of copyright issues while keeping the fan-inspired feel.

| Character | Archetype vibe | Rock move | Paper move | Scissors move |
|---|---|---|---|---|
| Saitama | Deadpan overwhelming power | Serious Punch | Consecutive Normal Punches | Serious Series |
| Genos | Cyborg firepower | Incineration Cannon | Machine Gun Blitz | Blade Mode Slash |
| Speed-o'-Sound Sonic | Ninja speed | Shadow Strike | Kunai Storm | Phantom Step Slash |
| Tatsumaki | Esper devastation | Psychokinetic Slam | Debris Barrage | Telekinetic Blade |
| King | Comedic bluff/underdog | "King Engine" Flinch | Panic Shuffle | Accidental Sweep |
| Mumen Rider | Ordinary-hero grit | Justice Kick | Pedal Rush Guard | Bicycle Chain Whirl |
| Bang | Martial arts master | Water Stream Rock Smashing Fist | Flowing Palm Guard | Fist of Twin Fangs |
| Fubuki | Esper support/blade | Gravity Press | Barrier Wall | Esper Blade Flurry |

This table is data, not code — it should be seeded via a script into the `characters` collection per `SCHEMA.md §1`, not hardcoded in components.

---

## 6. Technical architecture

**Stack:** Node.js + Express (REST API) · Socket.io (realtime friend-mode sync) · MongoDB + Mongoose (persistence) · Vanilla JS or React on the frontend (React recommended for state-heavy Playzone) · Lottie or CSS/SVG sprite animations for fight moves (avoid video files — too heavy for smooth co-op).

```
client (browser)
   │  HTTP (REST)                 │  WebSocket
   ▼                               ▼
Express API                  Socket.io server
   │  characters, rooms, matches   │  room presence, move sync, reveal broadcast
   └───────────────┬───────────────┘
                    ▼
                MongoDB
     (characters, players, rooms, matches)
```

### 6.1 REST API (Express)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/characters` | Return active roster for the dashboard |
| POST | `/api/players` | Create/fetch a guest player record from `guestId` cookie |
| POST | `/api/matches/ai` | Start a solo match: `{ characterId }` → creates `Match` with `mode: 'ai'`, second player slot `isAI: true` |
| POST | `/api/matches/:matchId/round` | Submit the human player's move for the current round (AI mode only — friend mode uses sockets); server resolves CPU move + round result and returns the full reveal payload |
| POST | `/api/rooms` | Create a friend-mode room: `{ characterId }` → returns `{ roomCode, joinUrl }` |
| GET | `/api/rooms/:roomCode` | Fetch room status (for the join page to render "waiting" vs "already started") |
| POST | `/api/rooms/:roomCode/join` | Guest joins with `{ characterId, displayName? }` |

### 6.2 Socket.io events (friend mode only)

| Event (client → server) | Payload | Purpose |
|---|---|---|
| `room:enter` | `{ roomCode, playerId }` | Subscribe to a room's channel after REST join |
| `player:ready` | `{ roomCode, playerId }` | Signal both players are ready to start |
| `round:submitMove` | `{ matchId, playerId, move }` | Submit a move for the current round |

| Event (server → clients) | Payload | Purpose |
|---|---|---|
| `room:opponentJoined` | `{ opponent: { displayName, characterId } }` | Tell the host a guest arrived |
| `match:started` | `{ matchId }` | Both clients redirect into Playzone |
| `round:waitingOnOpponent` | `{}` | Sent to whichever player submitted first |
| `round:reveal` | `{ moves, result, animationRefs, roundWins }` | Sent to both players simultaneously once both moves are in |
| `match:ended` | `{ winnerPlayerId }` | Final result, shown to both players |

Server holds moves in memory (or on the `Match` document) and only emits `round:reveal` once both entries exist for that round — this is what prevents move-peeking.

### 6.3 Animation system
- Each character has exactly 3 animation refs (`animationId` per move, see `SCHEMA.md §1`), resolved client-side to a Lottie JSON or a CSS keyframe class + sprite sheet.
- Keep each animation under ~150KB and under ~900ms duration so friend-mode co-op stays snappy on modest connections.
- Animations are purely cosmetic and run identically regardless of who wins the round-visual timing is driven by the sequence in §4.2, not by the outcome.

---

## 7. Non-functional requirements
- **Performance:** first meaningful paint on dashboard < 2s on a typical mobile connection; reveal sequence must not block input on the *next* round for more than the ~1.5s animation window.
- **Resilience:** if a friend-mode player refreshes mid-match, rejoining via the same `roomCode`/`matchId` should restore their current round state (read from the `Match` document) rather than losing the game.
- **Scalability:** stateless Express instances behind Socket.io with a Redis adapter if you ever run multiple server instances (not required for a single-instance v1 deploy).
- **Accessibility:** move buttons must be reachable and operable via keyboard/tab, animations should respect `prefers-reduced-motion` by falling back to a fast crossfade.

---

## 8. Suggested build order (for an AI coding agent)

1. **Scaffold:** Express app, Mongoose connection, folder structure (`/models`, `/routes`, `/sockets`, `/client`).
2. **Seed data:** implement `characters` schema + seed script from the §5 roster table.
3. **Dashboard:** character grid fetching `/api/characters`, selection state.
4. **AI mode end-to-end:** `POST /api/matches/ai`, `POST /api/matches/:id/round`, best-of-3 + draw-replay logic (§4.3), plain result display (no animation yet) — get the rules correct before adding polish.
5. **Fight animations:** wire in Lottie/CSS animations per (character, move) pair, insert the reveal sequence timing (§4.2).
6. **Friend mode:** rooms REST endpoints, Socket.io wiring, join-link flow, synced reveal.
7. **Match end screen + rematch flow** for both modes.
8. **Anime-fight visual pass:** comic-panel styling, halftone/speed-line motifs, theme colors per character, sound effects.
9. **Resilience pass:** reconnect handling, room expiry UX, reduced-motion fallback.

---

## 9. Acceptance criteria checklist
- [ ] Dashboard lists all seeded characters and requires a selection before either CTA is enabled.
- [ ] Solo match: CPU move is uniformly random and never visible before the player submits.
- [ ] A tie replays the same round without incrementing the round counter or either player's `roundWins`.
- [ ] A match ends the instant one side reaches 2 `roundWins` — no extra round is played.
- [ ] Friend-mode moves are never revealed to either player until both have submitted.
- [ ] Every (character, move) pair has a distinct animation played before the result is shown.
- [ ] Refreshing mid-friend-match restores the player to their current round state.
- [ ] Reveal sequence completes in under ~1.5 seconds end to end.
