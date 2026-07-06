import { useState, useEffect, useRef } from 'react';
import { submitAiRound } from '../api';
import { connectSocket } from '../socket';
import FightAnimator from './FightAnimator';

const MOVE_EMOJIS = { rock: '✊', paper: '✋', scissors: '✌️' };

const MOVE_KEYS = ['rock', 'paper', 'scissors'];

export default function Playzone({ mode, matchId, player, playerCharacter, opponentCharacter, matchPlayers, onMatchEnd }) {
  const [roundWins, setRoundWins] = useState({ player: 0, opponent: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [inputEnabled, setInputEnabled] = useState(true);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [revealData, setRevealData] = useState(null);
  const [showAnimator, setShowAnimator] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState(null);

  // Determine characters for display
  const myChar = playerCharacter;
  const oppChar = opponentCharacter || matchPlayers?.find(p => p.playerId !== player?._id)?.character;

  // Friend-mode socket setup
  useEffect(() => {
    if (mode !== 'friend') return;

    const socket = connectSocket();

    socket.on('round:waitingOnOpponent', () => {
      setWaitingForOpponent(true);
    });

    socket.on('round:reveal', (data) => {
      setWaitingForOpponent(false);
      triggerReveal(data);
    });

    socket.on('match:ended', ({ winnerPlayerId }) => {
      setRevealData(null);
    });

    return () => {
      socket.off('round:waitingOnOpponent');
      socket.off('round:reveal');
      socket.off('match:ended');
    };
  }, [mode, matchId]);

  function triggerReveal(data) {
    setRevealData(data);
    setInputEnabled(false);
    setShowAnimator(true);
  }

  function onAnimationComplete() {
    setShowAnimator(false);

    const data = revealData;
    if (!data) return;

    // Update wins
    const newRoundWins = {
      player: data.roundWins?.player ?? data.roundWins?.player1 ?? roundWins.player,
      opponent: data.roundWins?.ai ?? data.roundWins?.player2 ?? roundWins.opponent,
    };
    setRoundWins(newRoundWins);

    const result = data.result;
    setLastRoundResult(result);

    // Check match end
    if (data.matchStatus === 'completed') {
      setTimeout(() => {
        onMatchEnd({
          result: result === 'player1' ? 'win' : 'lose',
          roundWins: newRoundWins,
          winnerPlayerId: data.winnerPlayerId,
        });
      }, 600);
      return;
    }

    // Draw: same round number replays
    if (result !== 'draw') {
      setCurrentRound((r) => r + 1);
    }

    setRevealData(null);
    setInputEnabled(true);
  }

  async function handleMoveAi(move) {
    if (!inputEnabled) return;
    setInputEnabled(false);

    try {
      const data = await submitAiRound(matchId, move);
      triggerReveal({
        playerMove: data.playerMove,
        aiMove: data.aiMove,
        result: data.result,
        roundWins: { player: data.roundWins.player, opponent: data.roundWins.ai },
        matchStatus: data.matchStatus,
        winnerPlayerId: data.winnerPlayerId,
        animationRefs: data.animationRefs,
      });
    } catch (err) {
      console.error(err);
      setInputEnabled(true);
    }
  }

  function handleMoveFriend(move) {
    if (!inputEnabled || !player) return;
    const socket = connectSocket();
    socket.emit('round:submitMove', { matchId, playerId: player._id, move });
    setInputEnabled(false);
    setWaitingForOpponent(true);
  }

  const handleMove = mode === 'ai' ? handleMoveAi : handleMoveFriend;

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Fight Animator Overlay */}
      {showAnimator && (
        <FightAnimator
          revealData={revealData}
          playerCharacter={myChar}
          opponentCharacter={oppChar}
          onSequenceComplete={onAnimationComplete}
        />
      )}

      {/* ---- Header scoreboard ---- */}
      <header style={{
        background: 'var(--clr-surface)',
        borderBottom: '3px solid #000',
        padding: '12px 0',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
          {/* Player pips */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-impact)', fontSize: '0.85rem', color: myChar?.theme?.primaryColor || 'var(--clr-accent-yellow)' }}>
              YOU
            </span>
            <div className="round-pips" style={{ '--char-primary': myChar?.theme?.primaryColor }}>
              <div className={`pip ${roundWins.player >= 1 ? 'won' : ''}`} />
              <div className={`pip ${roundWins.player >= 2 ? 'won' : ''}`} />
            </div>
          </div>

          {/* Round counter */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-impact)', fontSize: '0.75rem', color: 'var(--clr-grey-400)', letterSpacing: '0.1em' }}>
              ROUND
            </div>
            <div className="vs-banner" style={{ fontSize: '1.5rem', animation: 'none' }}>
              {currentRound}
            </div>
          </div>

          {/* Opponent pips */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-impact)', fontSize: '0.85rem', color: oppChar?.theme?.primaryColor || 'var(--clr-grey-400)' }}>
              {mode === 'ai' ? 'CPU' : (oppChar?.name || 'OPPONENT').toUpperCase()}
            </span>
            <div className="round-pips" style={{ '--char-primary': oppChar?.theme?.primaryColor }}>
              <div className={`pip ${roundWins.opponent >= 1 ? 'won' : ''}`} />
              <div className={`pip ${roundWins.opponent >= 2 ? 'won' : ''}`} />
            </div>
          </div>
        </div>
      </header>

      {/* ---- Fighter portraits ---- */}
      <div style={{
        background: 'var(--clr-surface)',
        borderBottom: '2px solid var(--clr-border)',
        padding: 'var(--space-lg) 0',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {/* Player portrait */}
          <div
            className="fighter-portrait"
            style={{ '--char-primary': myChar?.theme?.primaryColor || '#FFD400' }}
          >
            <div className="portrait-placeholder" style={{ fontSize: '5rem' }}>
              {myChar ? '🦸' : '❓'}
            </div>
            <span className="fighter-name">{myChar?.name?.toUpperCase() || 'YOU'}</span>
          </div>

          <div className="vs-banner">VS</div>

          {/* Opponent portrait */}
          <div
            className="fighter-portrait"
            style={{ '--char-primary': oppChar?.theme?.primaryColor || '#A6A6A6' }}
          >
            <div className="portrait-placeholder" style={{ fontSize: '5rem' }}>
              {mode === 'ai' ? '🤖' : (oppChar ? '🦸' : '❓')}
            </div>
            <span className="fighter-name" style={{ color: oppChar?.theme?.primaryColor || 'var(--clr-grey-400)' }}>
              {mode === 'ai' ? 'CPU' : (oppChar?.name?.toUpperCase() || 'OPPONENT')}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Move picker ---- */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        gap: 'var(--space-lg)',
      }}>

        {lastRoundResult && !showAnimator && (
          <div style={{
            fontFamily: 'var(--font-impact)',
            fontSize: '1.2rem',
            letterSpacing: '0.06em',
            color: lastRoundResult === 'player1' ? 'var(--clr-accent-yellow)'
                : lastRoundResult === 'player2' ? 'var(--clr-accent-red)'
                : 'var(--clr-accent-blue)',
            padding: '6px 16px',
            border: '2px solid currentColor',
            borderRadius: 'var(--radius-sm)',
          }}>
            {lastRoundResult === 'draw' ? 'DRAW — REPLAY!' : lastRoundResult === 'player1' ? 'ROUND WIN!' : 'ROUND LOST!'}
          </div>
        )}

        <h2 style={{ fontFamily: 'var(--font-impact)', fontSize: '1.4rem', color: 'var(--clr-grey-200)', letterSpacing: '0.08em' }}>
          {waitingForOpponent ? 'WAITING FOR OPPONENT...' : 'PICK YOUR MOVE'}
        </h2>

        {waitingForOpponent ? (
          <div className="waiting-dots"><span /><span /><span /></div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {MOVE_KEYS.map((move) => (
              <button
                key={move}
                id={`btn-move-${move}`}
                className="move-btn"
                disabled={!inputEnabled}
                onClick={() => handleMove(move)}
                style={{ '--char-primary': myChar?.theme?.primaryColor }}
                aria-label={`${myChar?.moves?.[move]?.label || move}`}
              >
                <span className="move-icon" aria-hidden="true">{MOVE_EMOJIS[move]}</span>
                <span>{myChar?.moves?.[move]?.label || move.toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
