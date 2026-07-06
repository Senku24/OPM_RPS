const mongoose = require('mongoose');
const { Schema } = mongoose;

const PlayerSchema = new Schema({
  guestId: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    wins:          { type: Number, default: 0 },
    losses:        { type: Number, default: 0 },
  },
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Player', PlayerSchema);
