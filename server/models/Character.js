const mongoose = require('mongoose');
const { Schema } = mongoose;

const CharacterSchema = new Schema({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  tagline: { type: String },
  tier: { type: String, enum: ['S', 'A', 'B', 'C'], default: 'B' },
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
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Character', CharacterSchema);
