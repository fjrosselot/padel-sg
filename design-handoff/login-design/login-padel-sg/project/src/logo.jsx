// Brand logo for Padel SG — a compact racket monogram.
// The codebase ships a `P·SG` placeholder; we render a slightly richer mark
// that still reads as restrained editorial on navy backgrounds.

// Primary logo uses the Team Dragon badge. `onDark` swaps the wordmark ink,
// but the badge itself (yellow with blue art) stays as-is.
const Logo = ({ size = 44, onDark = true, showWordmark = true, compact = false, badgeOnly = false }) => {
  const navy = '#0D1B2A';
  const gold = '#F5C518';
  const ink  = onDark ? '#fff' : navy;

  const badge = (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: onDark
          ? '0 4px 14px rgba(245,197,24,0.28), 0 0 0 2px rgba(245,197,24,0.25)'
          : '0 2px 10px rgba(13,27,42,0.08)',
        background: '#FFD91C',
      }}
    >
      <img
        src="assets/team-dragon-logo.jpeg"
        alt="Team Dragon — Pádel Saint George's"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );

  if (badgeOnly) return badge;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      {badge}
      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontFamily: 'var(--font-headline)',
            fontWeight: 900,
            fontSize: compact ? 16 : 20,
            letterSpacing: '-0.02em',
            color: ink,
          }}>
            Padel<span style={{ color: gold }}>SG</span>
          </span>
          {!compact && (
            <span style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: onDark ? 'rgba(255,255,255,0.55)' : 'var(--muted)',
              marginTop: 5,
            }}>
              Team Dragon · Saint George's
            </span>
          )}
        </div>
      )}
    </div>
  );
};

window.PSGLogo = Logo;
