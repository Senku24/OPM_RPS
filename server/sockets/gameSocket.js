const Room = require('../models/Room');
const Match = require('../models/Match');
const Player = require('../models/Player');
const Character = require('../models/Character');
const { resolveRound } = require('../lib/gameLogic');

// In-memory store for pending moves in friend mode (cleared on server restart)
// Key: `${matchId}:${roundNumber}`, Value: { player1: move, player2: move }
const pendingMoves = new Map();

function currentRoundNumber(match) {
  if (match.rounds.length === 0) return 1;
  const last = match.rounds[match.rounds.length - 1];
  if (last.result !== null) {
    return last.result === 'draw' ? last.roundNumber : last.roundNumber + 1;
  }
  return last.roundNumber;
}

module.exports = function registerGameSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // --- room:enter — subscribe to the room's channel ---
    socket.on('room:enter', async ({ roomCode, playerId }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
          socket.emit('error', { message: 'Room not found.' });
          return;
        }
        socket.join(roomCode);
        console.log(`Player ${playerId} entered room ${roomCode}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to enter room.' });
      }
    });

    // --- player:ready — both players signal ready; create match and start game ---
    socket.on('player:ready', async ({ roomCode, playerId }) => {
      try {
        const room = await Room.findOne({ roomCode })
          .populate('host.characterId', 'name moves avatar theme')
          .populate('guest.characterId', 'name moves avatar theme');

        if (!room || room.status === 'started') return;
        if (!room.guest?.playerId) {
          socket.emit('error', { message: 'Waiting for guest to join.' });
          return;
        }

        // Mark room as started and create the match document
        room.status = 'started';

        const match = await Match.create({
          mode: 'friend',
          roomCode,
          players: [
            { playerId: room.host.playerId, characterId: room.host.characterId._id, isAI: false, roundWins: 0 },
            { playerId: room.guest.playerId, characterId: room.guest.characterId._id, isAI: false, roundWins: 0 },
          ],
          rounds: [],
        });

        room.matchId = match._id;
        await room.save();

        // Notify both players in the room
        io.to(roomCode).emit('match:started', {
          matchId: match._id,
          players: [
            { playerId: room.host.playerId, character: room.host.characterId },
            { playerId: room.guest.playerId, character: room.guest.characterId },
          ],
        });
      } catch (err) {
        console.error('player:ready error:', err);
        socket.emit('error', { message: 'Failed to start match.' });
      }
    });

    // --- round:submitMove — hold both moves, reveal simultaneously when both are in ---
    socket.on('round:submitMove', async ({ matchId, playerId, move }) => {
      try {
        if (!['rock', 'paper', 'scissors'].includes(move)) {
          socket.emit('error', { message: 'Invalid move.' });
          return;
        }

        const match = await Match.findById(matchId);
        if (!match || match.status !== 'in_progress') {
          socket.emit('error', { message: 'Match not found or not in progress.' });
          return;
        }

        const roundNumber = currentRoundNumber(match);
        const key = `${matchId}:${roundNumber}`;

        // Determine if this player is player1 or player2
        const p1Id = match.players[0].playerId.toString();
        const p2Id = match.players[1].playerId.toString();
        const slot = playerId.toString() === p1Id ? 'player1' : 'player2';

        if (!pendingMoves.has(key)) {
          pendingMoves.set(key, {});
        }
        const pending = pendingMoves.get(key);

        // Reject duplicate submissions
        if (pending[slot]) {
          socket.emit('error', { message: 'You already submitted a move for this round.' });
          return;
        }

        pending[slot] = { move, playerId, submittedAt: new Date() };

        if (!pending.player1 || !pending.player2) {
          // Only one move is in — tell the submitter to wait
          socket.emit('round:waitingOnOpponent', {});
          return;
        }

        // Both moves are in — resolve the round
        const move1 = pending.player1.move;
        const move2 = pending.player2.move;
        const result = resolveRound(move1, move2);

        // Count existing entries for this round number (draw-replay tracking)
        const existingEntries = match.rounds.filter(r => r.roundNumber === roundNumber);

        const roundEntry = {
          roundNumber,
          isReplay: existingEntries.length > 0,
          moves: [
            { playerId: match.players[0].playerId, move: move1, submittedAt: pending.player1.submittedAt },
            { playerId: match.players[1].playerId, move: move2, submittedAt: pending.player2.submittedAt },
          ],
          result,
          resolvedAt: new Date(),
        };

        match.rounds.push(roundEntry);

        if (result === 'player1') match.players[0].roundWins += 1;
        else if (result === 'player2') match.players[1].roundWins += 1;

        const p1Wins = match.players[0].roundWins;
        const p2Wins = match.players[1].roundWins;

        if (p1Wins >= 2 || p2Wins >= 2) {
          match.status = 'completed';
          match.winnerPlayerId = p1Wins >= 2 ? match.players[0].playerId : match.players[1].playerId;
          match.completedAt = new Date();

          // Update player stats
          await Player.findByIdAndUpdate(match.players[0].playerId, {
            $inc: { 'stats.matchesPlayed': 1, 'stats.wins': p1Wins >= 2 ? 1 : 0, 'stats.losses': p2Wins >= 2 ? 1 : 0 }
          });
          await Player.findByIdAndUpdate(match.players[1].playerId, {
            $inc: { 'stats.matchesPlayed': 1, 'stats.wins': p2Wins >= 2 ? 1 : 0, 'stats.losses': p1Wins >= 2 ? 1 : 0 }
          });
        }

        match.markModified('players');
        await match.save();
        pendingMoves.delete(key);

        // Fetch character animation refs
        const char1 = await Character.findById(match.players[0].characterId);
        const char2 = await Character.findById(match.players[1].characterId);

        const revealPayload = {
          moves: { player1: move1, player2: move2 },
          result,
          roundNumber,
          roundWins: { player1: p1Wins, player2: p2Wins },
          animationRefs: {
            player1: char1?.moves?.[move1]?.animationId || null,
            player2: char2?.moves?.[move2]?.animationId || null,
          },
        };

        // Emit reveal to both players simultaneously
        io.to(match.roomCode).emit('round:reveal', revealPayload);

        if (match.status === 'completed') {
          io.to(match.roomCode).emit('match:ended', {
            winnerPlayerId: match.winnerPlayerId,
          });
        }
      } catch (err) {
        console.error('round:submitMove error:', err);
        socket.emit('error', { message: 'Failed to process move.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
