import { useState, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../socket';

export default function Lobby({ roomData, player, isHost, character, onMatchStarted, onBack }) {
  const [copied, setCopied] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!roomData?.roomCode || !player?._id) return;

    const socket = connectSocket();

    socket.emit('room:enter', { roomCode: roomData.roomCode, playerId: player._id });

    socket.on('room:opponentJoined', ({ opponent: opp }) => {
      setOpponent(opp);
      setOpponentJoined(true);
    });

    socket.on('match:started', (data) => {
      onMatchStarted(data);
    });

    return () => {
      socket.off('room:opponentJoined');
      socket.off('match:started');
    };
  }, [roomData, player]);

  async function handleCopyLink() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'One Punch RPS — Fight me!',
          text: `I challenge you to a fight! Join me: ${roomData.joinUrl}`,
          url: roomData.joinUrl,
        });
      } else {
        await navigator.clipboard.writeText(roomData.joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Clipboard fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleReady() {
    if (!opponentJoined) return;
    setWaiting(true);
    const socket = connectSocket();
    socket.emit('player:ready', { roomCode: roomData.roomCode, playerId: player._id });
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
      <div
        className="panel"
        style={{
          maxWidth: 520,
          width: '100%',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          '--char-primary': character?.theme?.primaryColor || 'var(--clr-accent-yellow)',
        }}
      >
        <h2 className="text-impact" style={{ color: 'var(--clr-accent-yellow)', marginBottom: 'var(--space-sm)' }}>
          {isHost ? 'WAITING ROOM' : 'YOU\'VE BEEN CHALLENGED!'}
        </h2>

        {isHost ? (
          <>
            <p style={{ color: 'var(--clr-grey-200)', marginBottom: 'var(--space-lg)' }}>
              Share this link with your friend to start the fight.
            </p>

            {/* Link display */}
            <div style={{
              background: 'var(--clr-bg)',
              border: '2px solid #000',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-md)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              color: 'var(--clr-accent-yellow)',
              marginBottom: 'var(--space-md)',
              fontSize: '0.9rem',
            }}>
              {roomData?.joinUrl}
            </div>

            <button
              id="btn-copy-link"
              className="btn btn-primary"
              onClick={handleCopyLink}
              style={{ width: '100%', marginBottom: 'var(--space-lg)' }}
            >
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>

            {/* Presence indicator */}
            <div style={{
              padding: 'var(--space-md)',
              border: `2px solid ${opponentJoined ? '#00E088' : 'var(--clr-border)'}`,
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              justifyContent: 'center',
              transition: 'border-color 0.3s ease',
            }}>
              {opponentJoined ? (
                <>
                  <span style={{ fontSize: '1.5rem', animation: 'impact-frame 0.3s ease-out' }}>🔥</span>
                  <span style={{ fontFamily: 'var(--font-impact)', color: '#00E088', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                    {opponent?.displayName || 'Opponent'} HAS JOINED!
                  </span>
                </>
              ) : (
                <>
                  <div className="waiting-dots"><span /><span /><span /></div>
                  <span style={{ color: 'var(--clr-grey-400)', fontSize: '0.9rem' }}>
                    Waiting for opponent...
                  </span>
                </>
              )}
            </div>

            {/* Room expiry notice */}
            {roomData?.expiresAt && (
              <p style={{ color: 'var(--clr-grey-400)', fontSize: '0.75rem', marginBottom: 'var(--space-lg)' }}>
                Link expires {new Date(roomData.expiresAt).toLocaleTimeString()}
              </p>
            )}

            <button
              id="btn-start-match"
              className="btn btn-danger"
              disabled={!opponentJoined || waiting}
              onClick={handleReady}
              style={{ width: '100%' }}
            >
              {waiting ? 'Starting...' : '⚔️ START THE FIGHT!'}
            </button>
          </>
        ) : (
          <>
            {/* Guest view — just show loading until match:started */}
            <p style={{ color: 'var(--clr-grey-200)', marginBottom: 'var(--space-lg)' }}>
              You've joined the room! Waiting for the host to start the match...
            </p>
            <div className="waiting-dots" style={{ justifyContent: 'center' }}>
              <span /><span /><span />
            </div>
          </>
        )}

        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ marginTop: 'var(--space-lg)', width: '100%' }}
        >
          ← Back to Dashboard
        </button>
      </div>
    </main>
  );
}
