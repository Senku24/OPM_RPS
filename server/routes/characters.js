const express = require('express');
const router = express.Router();
const Character = require('../models/Character');

// GET /api/characters — return all active characters for the dashboard
router.get('/', async (req, res) => {
  try {
    const characters = await Character.find({ isActive: true }).select('-__v');
    res.json({ success: true, data: characters });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch characters.' });
  }
});

module.exports = router;
