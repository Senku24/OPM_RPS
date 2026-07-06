const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Player = require('../models/Player');

// Generate a fun random hero name
function generateHeroName() {
  const adjectives = ['Bold', 'Swift', 'Iron', 'Mighty', 'Blazing', 'Silent', 'Shadow', 'Steel'];
  const nouns = ['Fist', 'Blade', 'Strike', 'Punch', 'Slash', 'Guard', 'Rush', 'Kick'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}-${noun}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// POST /api/players — create or fetch a guest player record based on guestId cookie
router.post('/', async (req, res) => {
  try {
    let guestId = req.cookies?.guestId;

    // If no guestId cookie, create a new one
    if (!guestId) {
      guestId = uuidv4();
    }

    // Upsert: find or create player
    let player = await Player.findOneAndUpdate(
      { guestId },
      {
        $setOnInsert: { guestId, displayName: generateHeroName() },
        $set: { lastActiveAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Set httpOnly cookie so we can identify them on future requests
    res.cookie('guestId', guestId, {
      httpOnly: true,
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      sameSite: 'lax',
    });

    res.json({ success: true, data: player });
  } catch (err) {
    console.error('POST /api/players error:', err);
    res.status(500).json({ success: false, message: 'Failed to create/fetch player.' });
  }
});

module.exports = router;
