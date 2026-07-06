import { useState, useEffect } from 'react';
import { fetchCharacters, startAiMatch, createRoom } from '../api';
import CharacterCard from './CharacterCard';

export default function Dashboard({ player, selectedCharacter, onSelectCharacter, onStartAi, onRoomCreated }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchCharacters()
      .then(setCharacters)
      .catch(() => setError('Could not load roster. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  async function handleStartAi() {
    if (!selectedCharacter) return;
    try {
      setStarting(true);
      const { matchId } = await startAiMatch(selectedCharacter._id);
      onStartAi(matchId);
    } catch (err) {
      alert('Failed to start match. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  async function handleChallengeFriend() {
    if (!selectedCharacter) return;
    try {
      setStarting(true);
      const room = await createRoom(selectedCharacter._id);
      onRoomCreated(room);
    } catch (err) {
      alert('Failed to create room. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* ---- Header ---- */}
      <header style={{
        borderBottom: '3px solid #000',
        background: 'var(--clr-surface)',
        padding: '20px 0',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div className="container">
          <h1 className="text-impact" style={{ color: 'var(--clr-accent-yellow)' }}>
            ONE PUNCH RPS
          </h1>
          <p style={{ color: 'var(--clr-grey-200)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', marginTop: 4 }}>
            Pick your fighter. Throw your best move. One punch decides it all.
          </p>
          {player && (
            <p style={{ color: 'var(--clr-grey-400)', fontSize: '0.75rem', marginTop: 8 }}>
              Playing as <strong style={{ color: 'var(--clr-white)' }}>{player.displayName}</strong>
              &nbsp;·&nbsp;
              {player.stats.wins}W – {player.stats.losses}L
            </p>
          )}
        </div>
      </header>

      <div className="container" style={{ flex: 1, paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-xl)' }}>

        {/* ---- Section label ---- */}
        <div style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <h2 style={{ fontFamily: 'var(--font-impact)', fontSize: '1.6rem', color: 'var(--clr-white)', letterSpacing: '0.06em' }}>
            SELECT YOUR FIGHTER
          </h2>
          {selectedCharacter && (
            <span className="text-onomatopoeia" style={{ fontSize: '1rem' }}>
              {selectedCharacter.name} is ready!
            </span>
          )}
        </div>

        {/* ---- Character Grid ---- */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)', gap: 8 }}>
            <div className="waiting-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--clr-accent-red)' }}>
            <p style={{ fontFamily: 'var(--font-impact)', fontSize: '1.5rem' }}>⚠ {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid-characters">
            {characters.map((char) => (
              <CharacterCard
                key={char._id}
                character={char}
                selected={selectedCharacter?._id === char._id}
                onSelect={() => onSelectCharacter(char)}
              />
            ))}
          </div>
        )}

        {/* ---- Character Preview Panel ---- */}
        {selectedCharacter && (
          <div
            className="panel"
            style={{
              marginTop: 'var(--space-lg)',
              padding: 'var(--space-lg)',
              '--char-primary': selectedCharacter.theme?.primaryColor,
              display: 'flex',
              gap: 'var(--space-lg)',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              borderColor: selectedCharacter.theme?.primaryColor || '#000',
              boxShadow: `0 0 0 3px #000, 0 0 20px ${selectedCharacter.theme?.primaryColor}55`,
              animation: 'impact-frame 0.3s ease-out',
            }}
          >
            <div>
              <h3 style={{
                fontFamily: 'var(--font-impact)',
                fontSize: '2rem',
                color: selectedCharacter.theme?.primaryColor || 'var(--clr-accent-yellow)',
                textShadow: '2px 2px 0 #000',
                letterSpacing: '0.06em',
              }}>
                {selectedCharacter.name.toUpperCase()}
              </h3>
              <p style={{ color: 'var(--clr-grey-200)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
                {selectedCharacter.title}
              </p>
              {selectedCharacter.tagline && (
                <p style={{
                  fontFamily: 'var(--font-marker)',
                  color: 'var(--clr-grey-200)',
                  fontSize: '0.95rem',
                  marginBottom: 'var(--space-md)',
                  borderLeft: `3px solid ${selectedCharacter.theme?.primaryColor || 'var(--clr-accent-yellow)'}`,
                  paddingLeft: 'var(--space-sm)',
                }}>
                  "{selectedCharacter.tagline}"
                </p>
              )}

              <p style={{ fontFamily: 'var(--font-impact)', fontSize: '0.9rem', color: 'var(--clr-grey-400)', letterSpacing: '0.08em', marginBottom: 6 }}>
                SIGNATURE MOVES
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['rock', 'paper', 'scissors'].map((move) => (
                  <li key={move} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem' }}>
                      {move === 'rock' ? '✊' : move === 'paper' ? '✋' : '✌️'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-impact)', color: 'var(--clr-white)', letterSpacing: '0.04em' }}>
                      {selectedCharacter.moves?.[move]?.label || move}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ---- CTAs ---- */}
        <div style={{
          marginTop: 'var(--space-lg)',
          display: 'flex',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
        }}>
          <button
            id="btn-fight-cpu"
            className="btn btn-primary"
            disabled={!selectedCharacter || starting}
            onClick={handleStartAi}
            style={{ flex: '1 1 200px' }}
          >
            ⚡ FIGHT THE CPU
          </button>
          <button
            id="btn-challenge-friend"
            className="btn btn-danger"
            disabled={!selectedCharacter || starting}
            onClick={handleChallengeFriend}
            style={{ flex: '1 1 200px' }}
          >
            🔗 CHALLENGE A FRIEND
          </button>
        </div>

        {!selectedCharacter && (
          <p style={{ color: 'var(--clr-grey-400)', fontSize: '0.85rem', marginTop: 8 }}>
            ← Select a character first to enable the fight buttons.
          </p>
        )}
      </div>
    </main>
  );
}
