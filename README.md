# One Punch RPS

A rock-paper-scissors web game reskinned as an anime fight, inspired by One Punch Man.

## Project Structure

```
OPM_RPS/
├── server/          # Express + Socket.io + MongoDB backend (port 3000)
│   ├── models/      # Mongoose models (Character, Player, Room, Match)
│   ├── routes/      # REST API routes
│   ├── sockets/     # Socket.io game event handlers
│   ├── lib/         # Game logic utilities (AI move picker, round resolver)
│   └── scripts/     # DB seed scripts
└── client/          # Vite + React frontend (port 5173)
    └── src/
        ├── components/  # Dashboard, Lobby, JoinRoom, Playzone, MatchEnd, FightAnimator
        ├── api.js       # REST API helper functions
        └── socket.js    # Socket.io singleton client
```

## Prerequisites

- **Node.js** (v18+)
- **MongoDB** — install and start locally:
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```

## Quick Start

### 1. Start MongoDB
```bash
brew services start mongodb-community
```

### 2. Start the backend server
```bash
cd server
npm install
npm run seed     # seed the 8 OPM characters into the DB (run once)
npm run dev      # starts on http://localhost:3000
```

### 3. Start the frontend client
```bash
cd client
npm install
npm run dev      # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## Game Rules

- **Best of 3**: First player to win 2 rounds wins the match
- **Draw replay**: A draw does NOT count as a round — it replays immediately
- **AI mode**: CPU picks a uniformly random move each round
- **Friend mode**: Both players submit moves independently; neither sees the other's move until both have submitted

## Socket.io Events (Friend Mode)

| Client → Server | Purpose |
|---|---|
| `room:enter` | Subscribe to room channel |
| `player:ready` | Signal ready to start |
| `round:submitMove` | Submit move for current round |

| Server → Client | Purpose |
|---|---|
| `room:opponentJoined` | Host notified when guest joins |
| `match:started` | Both clients transition to Playzone |
| `round:waitingOnOpponent` | First-mover waits |
| `round:reveal` | Simultaneous reveal to both players |
| `match:ended` | Final result |
-------------------------------------->>>>>>>>>
⚠️ One step needed: Install MongoDB
MongoDB is not installed on your machine. Run this to install and start it:

bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
Then seed and start:

bash
# Terminal 1 — Backend
cd server && npm run seed && npm run dev
# Terminal 2 — Frontend
cd client && npm run dev
Open http://localhost:5173 and you're live! 🥊

Verification & Polishing----->>
[ ] Start MongoDB + seed characters
[ ] Test AI mode & game rules (tie replays, best-of-3 limit)
[ ] Test Friend mode multi-window flow (synchronized reveal, lack of peeking)
[ ] Test resilience/reconnect behavior (restore game on browser refresh)