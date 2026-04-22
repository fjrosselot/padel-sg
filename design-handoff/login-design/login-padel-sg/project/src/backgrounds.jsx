// Three background treatments for the visual side of the login.
// Variant A — Editorial: solid navy + gold radial glow + scoreboard typography
// Variant B — Court photo: real padel court with navy gradient overlay
// Variant C — Dark dramatic: navy + animated court lines + bold scoreboard

const Icon = window.PSGIcon;

// ---------- Shared: scoreboard / editorial content overlay ----------
const HEADLINES = {
  enter:     { l1: 'Entra a',         l2: 'la cancha.',    sub: 'Tu próximo gran partido comienza aquí.' },
  community: { l1: 'Nuestra rama.',   l2: 'Nuestra cancha.' },
  together:  { l1: 'La cancha',       l2: 'nos junta.' },
  pairs:     { l1: 'Entre',           l2: 'parejas.' },
  weare:     { l1: 'Somos',           l2: 'Rama.' },
  play:      { l1: 'Juguemos',        l2: 'juntos.' },
  parents:   { l1: 'De padres,',      l2: 'para padres.' },
  dominate:  { l1: 'Domina',          l2: 'la pista.' },
};

const EditorialOverlay = ({ headlineKey = 'enter' }) => {
  const h = HEADLINES[headlineKey] || HEADLINES.enter;
  return (
  <div style={{
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    height: '100%', width: '100%',
    padding: 'clamp(32px, 5vw, 64px)',
    color: '#fff',
  }}>
    {/* Top: eyebrow + season badge */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
        letterSpacing: '0.28em', textTransform: 'uppercase',
        color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 24, height: 2, background: 'var(--gold)', display: 'inline-block' }} />
        Rama Pádel · SG
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 10px',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.75)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 0 0 rgba(245,197,24,0.45)', animation: 'psgPulseGold 2s ease-in-out infinite' }} />
        Temporada 2026
      </div>
    </div>

    {/* Middle: big editorial headline */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{
        margin: 0,
        fontFamily: 'var(--font-headline)',
        fontWeight: 900,
        fontSize: 'clamp(56px, 8vw, 104px)',
        letterSpacing: '-0.04em',
        lineHeight: 0.9,
        textTransform: 'uppercase',
        color: '#fff',
      }}>
        {h.l1}<br/>
        <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{h.l2}</span>
      </h1>
      <div style={{ width: 96, height: 5, background: 'var(--gold)', borderRadius: 2 }} />
      <p style={{
        margin: 0, maxWidth: 440,
        fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.55,
        color: 'rgba(255,255,255,0.85)',
      }}>
        {h.sub || 'La plataforma interna de la Rama de Pádel de Saint George\u2019s College. Rankings ELO, torneos, ligas y partidos amistosos — todo en un solo lugar.'}
      </p>
    </div>

    {/* Bottom: scoreboard stats */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, auto)',
      gap: 'clamp(32px, 5vw, 56px)',
      alignItems: 'flex-end',
    }}>
      <StatBlock num="112" label="Apoderados activos" />
      <StatBlock num="06" label="Torneos 2026" highlight />
      <StatBlock num="1.284" label="Partidos jugados" />
    </div>
  </div>
  );
};

const StatBlock = ({ num, label, highlight }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span className="score-num" style={{
      fontSize: 'clamp(40px, 5vw, 64px)',
      color: highlight ? 'var(--gold)' : '#fff',
    }}>{num}</span>
    <span style={{
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.6)',
    }}>{label}</span>
  </div>
);

// ---------- Variant A — Editorial (solid navy + radial gold glow) ----------
const BackgroundEditorial = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
    {/* Base navy */}
    <div style={{ position: 'absolute', inset: 0, background: 'var(--navy)' }} />

    {/* Radial gold glow */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(60% 50% at 30% 40%, rgba(245,197,24,0.14), transparent 60%), radial-gradient(45% 40% at 75% 75%, rgba(245,197,24,0.06), transparent 70%)',
    }} />

    {/* Court-line geometry (abstract, decorative) */}
    <svg
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="courtline" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F5C518" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#F5C518" stopOpacity="0.1"/>
        </linearGradient>
      </defs>
      {/* Outer court */}
      <rect x="80" y="100" width="640" height="800" stroke="url(#courtline)" strokeWidth="2" fill="none" />
      {/* Service box line */}
      <line x1="80" y1="500" x2="720" y2="500" stroke="url(#courtline)" strokeWidth="2" />
      {/* Vertical service line */}
      <line x1="400" y1="300" x2="400" y2="700" stroke="url(#courtline)" strokeWidth="1.5" />
      {/* Service boxes */}
      <line x1="80" y1="300" x2="720" y2="300" stroke="url(#courtline)" strokeWidth="1.5" />
      <line x1="80" y1="700" x2="720" y2="700" stroke="url(#courtline)" strokeWidth="1.5" />
    </svg>

    {/* Vignette */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(100% 70% at 50% 50%, transparent 40%, rgba(13,27,42,0.65) 100%)',
    }} />
  </div>
);

// ---------- Variant B — Court photo ----------
const BackgroundPhoto = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
    {/* Base image */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: "url('assets/court-photo.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }} />
    {/* Subtle navy wash — keeps photo readable but preserves blue/yellow */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, rgba(13,27,42,0.55) 0%, rgba(13,27,42,0.35) 50%, rgba(13,27,42,0.70) 100%)',
    }} />
    {/* Gold glow accent top-left */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(45% 35% at 20% 25%, rgba(245,197,24,0.18), transparent 65%)',
    }} />
    {/* Bottom deepen for text legibility */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, transparent 40%, rgba(13,27,42,0.75) 100%)',
    }} />
  </div>
);

// ---------- Variant C — Dark dramatic ----------
const BackgroundDramatic = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: '#080F1A' }} />

    {/* Huge faded numeral */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--font-headline)',
        fontWeight: 900,
        fontSize: 'min(80vw, 900px)',
        color: 'rgba(245,197,24,0.04)',
        letterSpacing: '-0.08em',
        lineHeight: 0.8,
        pointerEvents: 'none',
      }}
    >
      SG
    </div>

    {/* Thin gold court frame */}
    <div style={{
      position: 'absolute', inset: 'clamp(24px, 4vw, 56px)',
      border: '1px solid rgba(245,197,24,0.22)',
      borderRadius: 8,
      pointerEvents: 'none',
    }} />
    {/* Inner divider line */}
    <div style={{
      position: 'absolute', left: 'clamp(24px, 4vw, 56px)', right: 'clamp(24px, 4vw, 56px)',
      top: '50%',
      height: 1,
      background: 'linear-gradient(90deg, transparent, rgba(245,197,24,0.28), transparent)',
    }} />

    {/* Top-left gold glow */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(40% 30% at 20% 20%, rgba(245,197,24,0.18), transparent 70%)',
    }} />
  </div>
);

// ---------- Variant D — Illustration (stylized padel scene) ----------
const BackgroundIllustration = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0D1B2A' }}>
    {/* Soft gold glow */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(55% 45% at 30% 35%, rgba(245,197,24,0.16), transparent 65%)',
    }} />

    {/* Full-bleed court illustration */}
    <svg
      viewBox="0 0 1200 1600"
      preserveAspectRatio="xMidYMax slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="courtFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1A2E45" />
          <stop offset="100%" stopColor="#0D1B2A" />
        </linearGradient>
        <linearGradient id="glassWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(143,168,200,0.25)" />
          <stop offset="100%" stopColor="rgba(143,168,200,0.05)" />
        </linearGradient>
        <radialGradient id="ballGlow">
          <stop offset="0%"  stopColor="#F5C518" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#F5C518" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Court perspective floor ── */}
      <polygon
        points="150,1580 1050,1580 900,700 300,700"
        fill="url(#courtFloor)"
      />
      {/* Court line rectangle (perspective) */}
      <polygon
        points="210,1520 990,1520 880,720 320,720"
        fill="none" stroke="rgba(245,197,24,0.35)" strokeWidth="3"
      />
      {/* Service center line */}
      <line x1="600" y1="720"  x2="600" y2="1120" stroke="rgba(245,197,24,0.28)" strokeWidth="2" />
      {/* Service box horizontal */}
      <line x1="265" y1="1120" x2="935" y2="1120" stroke="rgba(245,197,24,0.35)" strokeWidth="2.5" />

      {/* Net (horizontal midline) */}
      <line x1="250" y1="1320" x2="950" y2="1320" stroke="rgba(245,197,24,0.55)" strokeWidth="3" />
      {/* Net posts */}
      <rect x="235" y="1280" width="8"  height="50" fill="#F5C518" opacity="0.7" />
      <rect x="957" y="1280" width="8"  height="50" fill="#F5C518" opacity="0.7" />
      {/* Net mesh (stripes) */}
      <g stroke="rgba(245,197,24,0.22)" strokeWidth="1.5">
        {Array.from({length: 14}).map((_,i) => {
          const x = 250 + (i * 700/14);
          return <line key={i} x1={x} y1="1285" x2={x} y2="1325" />;
        })}
      </g>

      {/* Glass walls hint (back) */}
      <polygon points="300,700 900,700 880,560 320,560" fill="url(#glassWall)" opacity="0.35" />
      <line x1="300" y1="700" x2="320" y2="560" stroke="rgba(245,197,24,0.18)" strokeWidth="2" />
      <line x1="900" y1="700" x2="880" y2="560" stroke="rgba(245,197,24,0.18)" strokeWidth="2" />
      <line x1="600" y1="700" x2="600" y2="560" stroke="rgba(245,197,24,0.10)" strokeWidth="1.5" />

      {/* Player 1 — back left (silhouette, from behind, raising racket) */}
      <g transform="translate(430, 1050)">
        {/* shadow */}
        <ellipse cx="0" cy="210" rx="48" ry="8" fill="#000" opacity="0.35" />
        {/* legs (blue shorts) */}
        <path d="M -22 210 L -24 130 L -8 130 L -4 210 Z" fill="#1B3B8A" />
        <path d="M  4 210 L  8 130 L  24 130 L 22 210 Z" fill="#1B3B8A" />
        {/* torso (yellow shirt) */}
        <path d="M -32 130 Q -38 80 -30 50 L 30 50 Q 38 80 32 130 Z" fill="#F5C518" />
        <path d="M -30 60 L 30 60" stroke="#E5B515" strokeWidth="1.5" opacity="0.6" />
        {/* arm raised for smash */}
        <path d="M 28 58 Q 60 30 72 -10 L 62 -14 Q 50 22 22 50 Z" fill="#F5C518" />
        {/* other arm */}
        <path d="M -28 58 Q -38 90 -36 120 L -28 120 Q -26 92 -22 66 Z" fill="#F5C518" />
        {/* head (back of head) */}
        <ellipse cx="0" cy="30" rx="16" ry="18" fill="#3C2817" />
        {/* racket */}
        <g transform="translate(72, -12) rotate(-30)">
          <ellipse cx="0" cy="-18" rx="16" ry="20" fill="none" stroke="#F5C518" strokeWidth="3" />
          <line x1="0" y1="2" x2="0" y2="22" stroke="#F5C518" strokeWidth="3" strokeLinecap="round"/>
          <g stroke="#F5C518" strokeWidth="0.8" opacity="0.5">
            <line x1="-14" y1="-18" x2="14" y2="-18" />
            <line x1="-10" y1="-28" x2="10" y2="-28" />
            <line x1="-10" y1="-8" x2="10" y2="-8" />
            <line x1="0" y1="-38" x2="0" y2="2" />
          </g>
        </g>
      </g>

      {/* Player 2 — back right (ready stance) */}
      <g transform="translate(770, 1080)">
        <ellipse cx="0" cy="200" rx="44" ry="7" fill="#000" opacity="0.35" />
        {/* legs slightly spread */}
        <path d="M -26 200 L -30 120 L -12 120 L -8 200 Z" fill="#1B3B8A" />
        <path d="M  8 200 L 12 120 L 30 120 L 26 200 Z" fill="#1B3B8A" />
        {/* torso */}
        <path d="M -30 120 Q -36 75 -28 50 L 28 50 Q 36 75 30 120 Z" fill="#F5C518" />
        {/* arms — one forward holding racket, one at side */}
        <path d="M -26 58 Q -40 85 -38 115 L -30 116 Q -26 88 -22 64 Z" fill="#F5C518" />
        <path d="M 26 58 Q 46 72 60 88 L 52 96 Q 36 80 22 66 Z" fill="#F5C518" />
        {/* head */}
        <ellipse cx="0" cy="30" rx="15" ry="17" fill="#3C2817" />
        {/* racket held in front, angled for return */}
        <g transform="translate(60, 92) rotate(40)">
          <ellipse cx="0" cy="-14" rx="14" ry="18" fill="none" stroke="#F5C518" strokeWidth="2.5" />
          <line x1="0" y1="4" x2="0" y2="22" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" />
          <g stroke="#F5C518" strokeWidth="0.7" opacity="0.45">
            <line x1="-12" y1="-14" x2="12" y2="-14" />
            <line x1="0" y1="-32" x2="0" y2="4" />
          </g>
        </g>
      </g>

      {/* Ball in flight (mid-air, gold with glow) */}
      <circle cx="630" cy="850" r="40" fill="url(#ballGlow)" />
      <circle cx="630" cy="850" r="10" fill="#F5C518" />
      <path d="M 624 846 Q 630 842 636 846" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.6" />

      {/* Motion lines behind ball */}
      <g stroke="rgba(245,197,24,0.35)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="590" y1="830" x2="570" y2="815" />
        <line x1="595" y1="852" x2="575" y2="850" />
        <line x1="592" y1="872" x2="574" y2="882" />
      </g>

      {/* Stadium lights suggestion — top */}
      <g opacity="0.35">
        <circle cx="250" cy="80"  r="4" fill="#F5C518" />
        <circle cx="600" cy="50"  r="5" fill="#F5C518" />
        <circle cx="950" cy="80"  r="4" fill="#F5C518" />
      </g>
    </svg>

    {/* Vignette */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, rgba(13,27,42,0.55) 0%, rgba(13,27,42,0) 40%, rgba(13,27,42,0) 70%, rgba(13,27,42,0.7) 100%)',
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(120% 80% at 50% 50%, transparent 40%, rgba(13,27,42,0.55) 100%)',
    }} />
  </div>
);

const BRAND_BG = {
  editorial:    BackgroundEditorial,
  photo:        BackgroundPhoto,
  dramatic:     BackgroundDramatic,
  illustration: BackgroundIllustration,
};

window.PSGBackgrounds = { BRAND_BG, EditorialOverlay, HEADLINES };
