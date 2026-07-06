import { useState, useEffect } from 'react';
import { fetchCharacters, joinRoom } from '../api';
import CharacterCard from './CharacterCard';

export default function JoinRoom({ roomCode, player, onJoined }) {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCharacters()
      .then(setCharacters)
      .catch(() => setError('Could not load roster.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin() {
    if (!selectedCharacter || !roomCode) return;
    try {
      setJoining(true);
      const data = await joinRoom(roomCode, selectedCharacter._id, displayName);
      onJoined({ ...data, roomCode });
    } catch (err) {
      setError('Failed to join room. The room may have expired.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-xl) var(--space-md)' }}>
      <h1 className="text-impact" style={{ color: 'var(--clr-accent-red)', marginBottom: 'var(--space-sm)' }}>
        YOU WERE CHALLENGED!
      </h1>
      <p style={{ color: 'var(--clr-grey-200)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
        Room <strong style={{ color: 'var(--clr-accent-yellow)', fontFamily: 'monospace', fontSize: '1.1rem' }}>{roomCode}</strong>
        &nbsp;— pick your fighter and accept the challenge!
      </p>

      {error && (
        <p style={{ color: 'var(--clr-accent-red)', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-impact)' }}>
          ⚠ {error}
        </p>
      )}

      {/* Optional display name */}
      <div style={{ marginBottom: 'var(--space-lg)', width: '100%', maxWidth: 400 }}>
        <label style={{ display: 'block', color: 'var(--clr-grey-200)', fontSize: '0.85rem', marginBottom: 4 }}>
          Your name (optional)
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={player?.displayName || 'Enter your hero name'}
          maxLength={24}
          style={{
            width: '100%',
            background: 'var(--clr-surface-2)',
            border: '2px solid #000',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: 'var(--clr-white)',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
          }}
        />
      </div>

      {loading ? (
        <div className="waiting-dots"><span /><span /><span /></div>
      ) : (
        <>
          <div className="grid-characters" style={{ width: '100%', maxWidth: 700, marginBottom: 'var(--space-lg)' }}>
            {characters.map((char) => (
              <CharacterCard
                key={char._id}
                character={char}
                selected={selectedCharacter?._id === char._id}
                onSelect={() => setSelectedCharacter(char)}
              />
            ))}
          </div>

          <button
            id="btn-accept-challenge"
            className="btn btn-danger"
            disabled={!selectedCharacter || joining}
            onClick={handleJoin}
            style={{ minWidth: 220 }}
          >
            {joining ? 'Joining...' : '⚔️ ACCEPT THE CHALLENGE'}
          </button>
        </>
      )}
    </main>
  );
}
