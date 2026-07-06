export default function CharacterCard({ character, selected, onSelect }) {
  const primaryColor = character.theme?.primaryColor || '#FFD400';

  return (
    <div
      className={`char-card ${selected ? 'selected' : ''}`}
      style={{
        '--char-primary': primaryColor,
        '--char-secondary': character.theme?.secondaryColor || '#000',
        aspectRatio: '3/4',
        cursor: 'pointer',
      }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Select ${character.name}`}
      aria-pressed={selected}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
    >
      {/* Avatar / placeholder */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '4rem',
        background: `linear-gradient(135deg, ${character.theme?.secondaryColor || '#1e1e2e'}, var(--clr-surface-2))`,
        borderRadius: 'calc(var(--radius-md) - 3px)',
      }}>
        {/* Placeholder emoji based on tier */}
        {character.tier === 'S' ? '🌟' : character.tier === 'A' ? '⚡' : character.tier === 'B' ? '🌀' : '🎯'}
      </div>

      {/* Tier badge */}
      <div className="char-card__tier">
        {character.tier}
      </div>

      {/* Name + title overlay */}
      <div className="char-card__info">
        <div className="char-card__name">{character.name.split(' ')[0].toUpperCase()}</div>
        <div className="char-card__title">{character.title}</div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '2.5rem',
          zIndex: 3,
          animation: 'impact-frame 0.3s ease-out',
          pointerEvents: 'none',
        }}>
          ✅
        </div>
      )}
    </div>
  );
}
