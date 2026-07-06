const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Player = require('../models/Player');
const Character = require('../models/Character');
const { pickAiMove, resolveRound } = require('../lib/gameLogic');

// Helper — get the current (latest) round entry in a match
function getCurrentRound(match) {
  return match.rounds[match.rounds.length - 1] || null;
}

// Helper — derive current roundNumber to play
function currentRoundNumber(match) {
  if (match.rounds.length === 0) return 1;
  const last = match.rounds[match.rounds.length - 1];
  // If the last round has a result that isn't null, we're starting a new round
  if (last.result !== null) {
    return last.result === 'draw' ? last.roundNumber : last.roundNumber + 1;
  }
  return last.roundNumber;
}

// POST /api/matches/ai — start a new AI match
router.post('/ai', async (req, res) => {
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

    const match = await Match.create({
      mode: 'ai',
      players: [
        { playerId: player._id, characterId: character._id, isAI: false, roundWins: 0 },
        { playerId: null, characterId: null, isAI: true, roundWins: 0 },
      ],
      rounds: [],
    });

    res.status(201).json({ success: true, data: { matchId: match._id } });
  } catch (err) {
    console.error('POST /api/matches/ai error:', err);
    res.status(500).json({ success: false, message: 'Failed to create AI match.' });
  }
});

// POST /api/matches/:matchId/round — submit player's move (AI mode only)
router.post('/:matchId/round', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { move } = req.body;
    const guestId = req.cookies?.guestId;

    if (!['rock', 'paper', 'scissors'].includes(move)) {
      return res.status(400).json({ success: false, message: 'move must be rock, paper, or scissors.' });
    }

    const player = await Player.findOne({ guestId });
    if (!player) return res.status(404).json({ success: false, message: 'Player not found.' });

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    if (match.mode !== 'ai') return res.status(400).json({ success: false, message: 'This route is for AI matches only.' });
    if (match.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Match is not in progress.' });

    // Pick AI move
    const aiMove = pickAiMove();
    const result = resolveRound(move, aiMove);

    // Determine current round number
    const roundNumber = currentRoundNumber(match);
    const isReplay = result === 'draw' ? false : false; // New round entry
    
    // Count how many draws happened on this roundNumber
    const existingEntries = match.rounds.filter(r => r.roundNumber === roundNumber);
    const isReplayEntry = existingEntries.length > 0;

    const roundEntry = {
      roundNumber,
      isReplay: isReplayEntry,
      moves: [
        { playerId: player._id, move, submittedAt: new Date() },
        { playerId: null, move: aiMove, submittedAt: new Date() },
      ],
      result,
      resolvedAt: new Date(),
    };

    match.rounds.push(roundEntry);

    // Update round wins if not a draw
    if (result === 'player1') {
      match.players[0].roundWins += 1;
    } else if (result === 'player2') {
      match.players[1].roundWins += 1;
    }

    // Check if match is complete (first to 2 wins)
    const p1Wins = match.players[0].roundWins;
    const p2Wins = match.players[1].roundWins;

    if (p1Wins >= 2 || p2Wins >= 2) {
      match.status = 'completed';
      match.winnerPlayerId = p1Wins >= 2 ? player._id : null; // null = AI won
      match.completedAt = new Date();

      // Update player stats
      await Player.findByIdAndUpdate(player._id, {
        $inc: {
          'stats.matchesPlayed': 1,
          'stats.wins': p1Wins >= 2 ? 1 : 0,
          'stats.losses': p2Wins >= 2 ? 1 : 0,
        }
      });
    }

    // mark players array as modified (nested)
    match.markModified('players');
    await match.save();

    // Fetch character info for animation refs
    const playerChar = await Character.findById(match.players[0].characterId);

    res.json({
      success: true,
      data: {
        playerMove: move,
        aiMove,
        result,
        roundNumber,
        roundWins: { player: p1Wins, ai: p2Wins },
        matchStatus: match.status,
        winnerPlayerId: match.winnerPlayerId,
        animationRefs: {
          player: playerChar?.moves?.[move]?.animationId || null,
          ai: null, // AI has no character art in v1
        },
      },
    });
  } catch (err) {
    console.error('POST /api/matches/:id/round error:', err);
    res.status(500).json({ success: false, message: 'Failed to process round.' });
  }
});

// GET /api/matches/:matchId — get match state (used for reconnect)
router.get('/:matchId', async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('players.characterId', 'name slug theme moves avatar')
      .populate('players.playerId', 'displayName');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });

    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch match.' });
  }
});

module.exports = router;
