import { useEffect, useRef, useState } from 'react';

const MOVE_EMOJIS = { rock: '✊', paper: '✋', scissors: '✌️' };

// Animation class map — mapped from animationId naming convention
// e.g. "saitama_rock" -> "anim-punch"
function getAnimClass(animationId) {
  if (!animationId) return 'anim-shake';
  if (animationId.includes('rock')) return 'anim-punch';
  if (animationId.includes('paper')) return 'anim-float';
  if (animationId.includes('scissors')) return 'anim-shake';
  return 'anim-shake';
}

const SEQUENCE_TIMING = {
  preclash: 250,     // pre-clash beat before animations
  animation: 700,    // character move animations
  impact: 150,       // freeze/flash frame
  result: 800,       // result banner hold before clearing
};

/**
 * FightAnimator
 * Props:
 *   revealData: { playerMove, aiMove?, moves?: {player1, player2}, result,
 *                 animationRefs: {player: id, ai?: id, player1?: id, player2?: id} }
 *   playerCharacter: character object for player
 *   opponentCharacter: character object for opponent (null for AI)
 *   onSequenceComplete: () => void  — called when the 1.5s sequence ends
 */
export default function FightAnimator({ revealData, playerCharacter, opponentCharacter, onSequenceComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | preclash | animating | impact | result | done
  const [animClass1, setAnimClass1] = useState('');
  const [animClass2, setAnimClass2] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!revealData) return;

    const playerMove = revealData.playerMove || revealData.moves?.player1;
    const opponentMove = revealData.aiMove || revealData.moves?.player2;
    const animId1 = revealData.animationRefs?.player || revealData.animationRefs?.player1;
    const animId2 = revealData.animationRefs?.ai || revealData.animationRefs?.player2;

    // Start the sequence
    setPhase('preclash');

    const t1 = setTimeout(() => {
      setPhase('animating');
      setAnimClass1(getAnimClass(animId1));
      setAnimClass2(getAnimClass(animId2));
    }, SEQUENCE_TIMING.preclash);

    const t2 = setTimeout(() => {
      setPhase('impact');
      setAnimClass1('');
      setAnimClass2('');
    }, SEQUENCE_TIMING.preclash + SEQUENCE_TIMING.animation);

    const t3 = setTimeout(() => {
      setPhase('result');
    }, SEQUENCE_TIMING.preclash + SEQUENCE_TIMING.animation + SEQUENCE_TIMING.impact);

    const t4 = setTimeout(() => {
      setPhase('done');
      onSequenceComplete?.();
    }, SEQUENCE_TIMING.preclash + SEQUENCE_TIMING.animation + SEQUENCE_TIMING.impact + SEQUENCE_TIMING.result);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [revealData]);

  if (!revealData || phase === 'idle' || phase === 'done') return null;

  const playerMove = revealData.playerMove || revealData.moves?.player1;
  const opponentMove = revealData.aiMove || revealData.moves?.player2;
  const result = revealData.result;

  const resultLabel = result === 'player1' ? 'WIN!' : result === 'player2' ? 'LOSE!' : 'DRAW!';
  const resultClass = result === 'player1' ? 'win' : result === 'player2' ? 'lose' : 'draw';

  const isFlash = phase === 'impact';

  return (
    <div
      className={`fight-overlay ${isFlash ? 'clash-flash' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Fight animation: ${resultLabel}`}
    >
      {/* Pre-clash text */}
      {phase === 'preclash' && (
        <div className="text-onomatopoeia" style={{ fontSize: '3rem' }}>
          DON!
        </div>
      )}

      {/* Character move display */}
      {(phase === 'animating' || phase === 'impact') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
          {/* Player side */}
          <div
            className={`fighter-portrait ${animClass1}`}
            style={{ '--char-primary': playerCharacter?.theme?.primaryColor || '#FFD400' }}
          >
            <div className="portrait-placeholder" style={{ fontSize: '5rem' }}>
              {MOVE_EMOJIS[playerMove] || '✊'}
            </div>
            <span className="fighter-name">{playerCharacter?.name || 'YOU'}</span>
          </div>

          <div className="vs-banner">VS</div>

          {/* Opponent side */}
          <div
            className={`fighter-portrait ${animClass2}`}
            style={{ '--char-primary': opponentCharacter?.theme?.primaryColor || '#A6A6A6' }}
          >
            <div className="portrait-placeholder" style={{ fontSize: '5rem' }}>
              {MOVE_EMOJIS[opponentMove] || '✊'}
            </div>
            <span className="fighter-name">{opponentCharacter?.name || 'CPU'}</span>
          </div>
        </div>
      )}

      {/* Impact flash frame */}
      {phase === 'impact' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,212,0,0.25)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Result banner */}
      {phase === 'result' && (
        <div className={`result-banner ${resultClass}`}>
          {resultLabel}
        </div>
      )}
    </div>
  );
}
