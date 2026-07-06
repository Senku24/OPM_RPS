const mongoose = require('mongoose');
const { Schema } = mongoose;

const MoveEnum = ['rock', 'paper', 'scissors'];

const MatchSchema = new Schema({
  mode: { type: String, enum: ['ai', 'friend'], required: true },
  roomCode: { type: String, default: null },

  players: [{
    playerId:    { type: Schema.Types.ObjectId, ref: 'Player' },
    characterId: { type: Schema.Types.ObjectId, ref: 'Character' },
    isAI:        { type: Boolean, default: false },
    roundWins:   { type: Number, default: 0 },
  }], // exactly 2 entries: player 1 (index 0) and player 2 / AI (index 1)

  rounds: [{
    roundNumber: Number,
    isReplay: { type: Boolean, default: false },
    moves: [{
      playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
      move: { type: String, enum: MoveEnum },
      submittedAt: { type: Date, default: Date.now },
    }],
    result: { type: String, enum: ['player1', 'player2', 'draw'], default: null },
    resolvedAt: Date,
  }],

  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
  winnerPlayerId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },

  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Match', MatchSchema);
