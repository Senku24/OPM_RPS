export default function MatchEnd({ result, player, onRematch, onDashboard }) {
  const isWin = result?.result === 'win';
  const isDraw = result?.result === 'draw';

  const splashColor = isWin ? 'var(--clr-accent-yellow)' : isDraw ? 'var(--clr-accent-blue)' : 'var(--clr-accent-red)';
  const splashText = isWin ? 'VICTORY!!' : isDraw ? 'DRAW!' : 'DEFEAT!';
  const splashEmoji = isWin ? '🏆' : isDraw ? '🤝' : '💀';

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(ellipse at center, ${splashColor}22 0%, var(--clr-bg) 70%)`,
      padding: 'var(--space-xl) var(--space-md)',
      textAlign: 'center',
    }}>

      {/* Splash emoji */}
      <div style={{ fontSize: '6rem', marginBottom: 'var(--space-md)', animation: 'impact-frame 0.4s ease-out' }}>
        {splashEmoji}
      </div>

      {/* Result text */}
      <div
        className={`result-banner ${isWin ? 'win' : isDraw ? 'draw' : 'lose'}`}
        style={{ marginBottom: 'var(--space-xl)', display: 'inline-block' }}
      >
        {splashText}
      </div>

      {/* Round score */}
      {result?.roundWins && (
        <p style={{
          fontFamily: 'var(--font-impact)',
          fontSize: '1.3rem',
          color: 'var(--clr-grey-200)',
          letterSpacing: '0.06em',
          marginBottom: 'var(--space-xl)',
        }}>
          {result.roundWins.player} — {result.roundWins.opponent}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          id="btn-rematch"
          className="btn btn-primary"
          onClick={onRematch}
          style={{ minWidth: 180 }}
        >
          ⚡ REMATCH
        </button>
        <button
          id="btn-back-dashboard"
          className="btn btn-ghost"
          onClick={onDashboard}
          style={{ minWidth: 180 }}
        >
          🏠 CHANGE FIGHTER
        </button>
      </div>

      {/* Onomatopoeia decorations */}
      <div style={{ position: 'fixed', top: 40, left: 20, opacity: 0.15, pointerEvents: 'none' }}>
        <span className="text-onomatopoeia" style={{ fontSize: '3rem' }}>ZAAN!</span>
      </div>
      <div style={{ position: 'fixed', bottom: 60, right: 20, opacity: 0.15, pointerEvents: 'none' }}>
        <span className="text-onomatopoeia" style={{ fontSize: '2rem' }}>DON!</span>
      </div>
    </main>
  );
}
