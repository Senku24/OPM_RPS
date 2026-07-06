# Database schema design — One Punch RPS

Database: MongoDB (Mongoose ODM recommended for the Express backend)

## Overview of collections

| Collection   | Purpose                                                          | Volatility          |
|--------------|-------------------------------------------------------------------|---------------------|
| `characters` | Static roster data: names, moves, animation refs, theme colors  | Rarely changes (seeded) |
| `players`    | Lightweight guest player identity + lifetime stats               | Grows with users     |
| `rooms`      | Pre-game lobby for "play vs friend" (share-link flow)             | Short-lived (TTL)    |
| `matches`    | The actual game record: rounds, moves, results, for AI and friend modes | Grows with games played |

No dedicated `users` / auth collection is needed for v1 — see "Auth model" below.

---

## 1. `characters`

```js
// models/Character.js
const CharacterSchema = new Schema({
  slug: { type: String, required: true, unique: true, index: true }, // "saitama"
  name: { type: String, required: true },                             // "Saitama"
  title: { type: String, required: true },                             // "Caped Baldy"
  tagline: { type: String },                                           // "One punch is all it takes."
  tier: { type: String, enum: ['S', 'A', 'B', 'C'], default: 'B' },     // flavor only, no gameplay effect
  avatar: {
    thumbnail: String,   // /assets/characters/saitama/avatar.png
    fullBody: String,    // /assets/characters/saitama/full.png
  },
  theme: {
    primaryColor: String,   // "#FFD400"
    secondaryColor: String, // "#C60000"
  },
  moves: {
    rock:     { label: String, animationId: String, vfx: String, sfx: String },
    paper:    { label: String, animationId: String, vfx: String, sfx: String },
    scissors: { label: String, animationId: String, vfx: String, sfx: String },
  },
  isActive: { type: Boolean, default: true }, // lets you retire/hide a character without deleting
}, { timestamps: true });
```

Example document:

```json
{
  "slug": "saitama",
  "name": "Saitama",
  "title": "Caped Baldy",
  "tagline": "One punch is all it takes.",
  "tier": "S",
  "avatar": { "thumbnail": "/assets/characters/saitama/avatar.png", "fullBody": "/assets/characters/saitama/full.png" },
  "theme": { "primaryColor": "#FFD400", "secondaryColor": "#C60000" },
  "moves": {
    "rock":     { "label": "Serious Punch",  "animationId": "saitama_rock",     "vfx": "shockwave-impact",  "sfx": "punch_heavy.mp3" },
    "paper":    { "label": "Consecutive Normal Punches", "animationId": "saitama_paper", "vfx": "afterimage-flurry", "sfx": "punch_flurry.mp3" },
    "scissors": { "label": "Serious Series", "animationId": "saitama_scissors", "vfx": "speed-lines-dash",  "sfx": "swoosh_sharp.mp3" }
  },
  "isActive": true
}
```

This collection is seeded once (a `scripts/seed-characters.js` script) and read-only at runtime — the app never writes to it during gameplay. Keeping `animationId` as a string key (rather than embedding animation code) lets the frontend map it to a Lottie file / sprite sheet / CSS animation class without touching the database.

**Indexes:** unique index on `slug`.

---

## 2. `players`

Guest-first identity model — no email/password required to play.

```js
const PlayerSchema = new Schema({
  guestId: { type: String, required: true, unique: true, index: true }, // uuid, stored in an httpOnly cookie or localStorage
  displayName: { type: String, required: true, default: () => `Hero-${nanoid(5)}` },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    wins:          { type: Number, default: 0 },
    losses:        { type: Number, default: 0 },
  },
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });
```

**Indexes:** unique index on `guestId`. Optional TTL cleanup job for players inactive >90 days if you want to keep the collection lean (not required for a small app).

---

## 3. `rooms`

Handles the "play vs friend" lobby state that exists *before* a match starts — from clicking "generate link" to both players being ready.

```js
const RoomSchema = new Schema({
  roomCode: { type: String, required: true, unique: true, index: true }, // short, shareable, e.g. "K7F2QX"
  status: {
    type: String,
    enum: ['waiting_for_guest', 'ready', 'started', 'expired'],
    default: 'waiting_for_guest',
  },
  host:  { playerId: { type: Schema.Types.ObjectId, ref: 'Player' }, characterId: { type: Schema.Types.ObjectId, ref: 'Character' } },
  guest: { playerId: { type: Schema.Types.ObjectId, ref: 'Player' }, characterId: { type: Schema.Types.ObjectId, ref: 'Character' } },
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', default: null }, // set once the match is created
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index — Mongo auto-deletes at this timestamp
}, { timestamps: true });
```

- `roomCode` is what gets embedded in the shareable link: `https://yourapp.com/join/K7F2QX`.
- `expiresAt` set to `createdAt + 30 minutes` on creation — MongoDB's native TTL index deletes stale, never-joined rooms automatically, no cron job needed.
- Once both `host` and `guest` have picked a character and hit ready, the server flips status to `started`, creates the `Match` document, and stores its id back on the room (useful if the guest's browser refreshes mid-match — they can rejoin via the same room code).

**Indexes:** unique index on `roomCode`; TTL index on `expiresAt`.

---

## 4. `matches`

The single source of truth for a game in progress or completed — used identically by AI and friend modes (the only difference is `mode` and whether a player slot is `isAI: true`).

```js
const MoveEnum = ['rock', 'paper', 'scissors'];

const MatchSchema = new Schema({
  mode: { type: String, enum: ['ai', 'friend'], required: true },
  roomCode: { type: String, default: null }, // null for AI matches

  players: [{
    playerId:    { type: Schema.Types.ObjectId, ref: 'Player' },
    characterId: { type: Schema.Types.ObjectId, ref: 'Character' },
    isAI:        { type: Boolean, default: false },
    roundWins:   { type: Number, default: 0 },
  }], // always exactly 2 entries, index 0 = host/player1, index 1 = guest/player2 or AI

  rounds: [{
    roundNumber: Number,        // 1, 2, 3 — a drawn round replays under the SAME roundNumber (see isReplay)
    isReplay: { type: Boolean, default: false },
    moves: [{
      playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
      move: { type: String, enum: MoveEnum },
      submittedAt: Date,
    }],
    result: { type: String, enum: ['player1', 'player2', 'draw'], default: null },
    resolvedAt: Date,
  }],

  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
  winnerPlayerId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },

  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, { timestamps: true });
```

Example mid-match document (best-of-3, one draw already replayed):

```json
{
  "mode": "friend",
  "roomCode": "K7F2QX",
  "players": [
    { "playerId": "p1", "characterId": "genos",   "isAI": false, "roundWins": 1 },
    { "playerId": "p2", "characterId": "tatsumaki","isAI": false, "roundWins": 0 }
  ],
  "rounds": [
    { "roundNumber": 1, "isReplay": false, "moves": [{ "playerId": "p1", "move": "rock" }, { "playerId": "p2", "move": "scissors" }], "result": "player1" },
    { "roundNumber": 2, "isReplay": false, "moves": [{ "playerId": "p1", "move": "paper" }, { "playerId": "p2", "move": "paper" }], "result": "draw" },
    { "roundNumber": 2, "isReplay": true,  "moves": [], "result": null }
  ],
  "status": "in_progress"
}
```

Notice round 2 appears twice: the first attempt ended in a draw, so a fresh round-2 entry with `isReplay: true` was appended and the original round number was **not** advanced — this directly encodes your rule "same move = draw, round is replayed."

**Indexes:** index on `roomCode` (to resume a match on reconnect), index on `players.playerId` (to fetch a player's match history for stats).

---

## Auth model (deliberately minimal)

No password auth for v1. On first visit, the client generates a `guestId` (uuid), the server upserts a `Player` document for it, and stores `guestId` in an httpOnly cookie. This is enough to:
- track win/loss stats across sessions on the same device/browser
- identify "host" vs "guest" inside a room
- avoid building/maintaining a login system for what is fundamentally a quick, shareable party game

If you later want persistent accounts (e.g. leaderboards across devices), add a `players.email` + `players.passwordHash` (or OAuth fields) as an additive migration — nothing above needs to change structurally.

## Relationships at a glance

```
characters (seeded, read-only)
    ▲                 ▲
    │ characterId     │ characterId
    │                 │
players ──playerId──► matches.players[]
    ▲
    │ host/guest.playerId
rooms ──matchId──► matches
```

## Suggested indexes summary

| Collection | Index | Type |
|---|---|---|
| characters | `slug` | unique |
| players | `guestId` | unique |
| rooms | `roomCode` | unique |
| rooms | `expiresAt` | TTL |
| matches | `roomCode` | standard |
| matches | `players.playerId` | standard |
