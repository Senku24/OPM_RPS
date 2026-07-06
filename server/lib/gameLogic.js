// Isolated AI move selection — easy to swap for a smarter algorithm later
const MOVES = ['rock', 'paper', 'scissors'];

function pickAiMove() {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

// Returns 'player1' | 'player2' | 'draw'
function resolveRound(move1, move2) {
  if (move1 === move2) return 'draw';
  if (
    (move1 === 'rock'     && move2 === 'scissors') ||
    (move1 === 'scissors' && move2 === 'paper')    ||
    (move1 === 'paper'    && move2 === 'rock')
  ) {
    return 'player1';
  }
  return 'player2';
}

module.exports = { pickAiMove, resolveRound };
