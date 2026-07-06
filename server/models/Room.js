const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ['waiting_for_guest', 'ready', 'started', 'expired'],
    default: 'waiting_for_guest',
  },
  host: {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    characterId: { type: Schema.Types.ObjectId, ref: 'Character', required: true }
  },
  guest: {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
    characterId: { type: Schema.Types.ObjectId, ref: 'Character', default: null }
  },
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL auto-delete
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
