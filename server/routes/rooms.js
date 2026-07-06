const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Room = require('../models/Room');
const Match = require('../models/Match');
const Player = require('../models/Player');
const Character = require('../models/Character');

// Generate a 6-char alphanumeric room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST /api/rooms — create a friend-mode room
router.post('/', async (req, res) => {
  try {
    const { characterId } = req.body;
    const guestId = req.cookies?.guestId;

    if (!characterId || !guestId) {
      return res.status(400).json({ success: false, message: 'characterId and guestId cookie are required.' });
    }

    const player = await Player.findOne({ guestId });
    if (!player) return res.status(404).json({ success: false, message: 'Player not found.' });

    const character = await Character.findById(characterId);
    if (!character) return res.status(404).json({ success: false, message: 'Character not found.' });

    // Ensure unique room code
    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = generateRoomCode();
      exists = await Room.exists({ roomCode });
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const room = await Room.create({
      roomCode,
      host: { playerId: player._id, characterId: character._id },
      expiresAt,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.status(201).json({
      success: true,
      data: {
        roomCode,
        joinUrl: `${clientUrl}/join/${roomCode}`,
        expiresAt,
      },
    });
  } catch (err) {
    console.error('POST /api/rooms error:', err);
    res.status(500).json({ success: false, message: 'Failed to create room.' });
  }
});

// GET /api/rooms/:roomCode — get room status
router.get('/:roomCode', async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode })
      .populate('host.playerId', 'displayName')
      .populate('host.characterId', 'name slug theme avatar')
      .populate('guest.playerId', 'displayName')
      .populate('guest.characterId', 'name slug theme avatar');

    if (!room) return res.status(404).json({ success: false, message: 'Room not found or expired.' });

    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch room.' });
  }
});

// POST /api/rooms/:roomCode/join — guest joins the room
router.post('/:roomCode/join', async (req, res) => {
  try {
    const { characterId, displayName } = req.body;
    const guestId = req.cookies?.guestId;

    if (!characterId || !guestId) {
      return res.status(400).json({ success: false, message: 'characterId and guestId cookie are required.' });
    }

    const room = await Room.findOne({ roomCode: req.params.roomCode });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found or expired.' });
    if (room.status !== 'waiting_for_guest') {
      return res.status(400).json({ success: false, message: `Room is not joinable (status: ${room.status}).` });
    }

    let player = await Player.findOne({ guestId });
    if (!player) return res.status(404).json({ success: false, message: 'Player not found.' });

    // Update display name if provided
    if (displayName && displayName.trim()) {
      player.displayName = displayName.trim();
      await player.save();
    }

    const character = await Character.findById(characterId);
    if (!character) return res.status(404).json({ success: false, message: 'Character not found.' });

    // Set guest on room
    room.guest = { playerId: player._id, characterId: character._id };
    room.status = 'ready';
    await room.save();

    res.json({
      success: true,
      data: {
        roomCode: room.roomCode,
        matchId: room.matchId,
        player: { id: player._id, displayName: player.displayName },
      },
    });
  } catch (err) {
    console.error('POST /api/rooms/:roomCode/join error:', err);
    res.status(500).json({ success: false, message: 'Failed to join room.' });
  }
});

module.exports = router;
