// Main App — composes background + form into mobile/desktop layouts,
// exposes Tweaks for variant swapping.

const LoginForm = window.PSGLoginForm;
const Logo      = window.PSGLogo;
const Icon      = window.PSGIcon;
const { BRAND_BG, EditorialOverlay, HEADLINES } = window.PSGBackgrounds;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "variant": "photo",
  "layout": "auto",
  "headline": "enter",
  "showApproval": true,
  "showStats": true
}/*EDITMODE-END*/;

const LS_KEY = 'psg_login_tweaks_v5';

function loadTweaks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...TWEAK_DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...TWEAK_DEFAULTS };
}

const App = () => {
  const [tweaks, setTweaks]       = React.useState(loadTweaks);
  const [tweakMode, setTweakMode] = React.useState(false);
  const [isWide, setIsWide]       = React.useState(
    typeof window !== 'undefined' && window.matchMedia('(min-width: 960px)').matches
  );

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 960px)');
    const update = () => setIsWide(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Persist tweaks
  React.useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(tweaks)); } catch (e) {}
  }, [tweaks]);

  // Host <-> iframe protocol for Tweaks toggle
  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode')   setTweakMode(true);
      if (d.type === '__deactivate_edit_mode') setTweakMode(false);
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch(_){}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweak = (patch) => {
    setTweaks(t => {
      const next = { ...t, ...patch };
      try {
        window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
      } catch(_){}
      return next;
    });
  };

  const layout = tweaks.layout === 'auto' ? (isWide ? 'desktop' : 'mobile')
                : tweaks.layout;

  const Bg = BRAND_BG[tweaks.variant] || BRAND_BG.editorial;

  // ──────────────── DESKTOP (split-screen) ────────────────
  if (layout === 'desktop') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
        {/* Left visual panel */}
        <section style={{
          flex: '1.1 1 0',
          position: 'relative',
          overflow: 'hidden',
          minWidth: 420,
        }}>
          <Bg />
          <EditorialOverlay headlineKey={tweaks.headline} />
        </section>

        {/* Right form panel */}
        <section style={{
          flex: '0.9 1 0',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(48px, 5vw, 80px)',
          minWidth: 440,
          background: 'var(--surface)',
        }}>
          <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
            <div style={{ marginBottom: 36 }}>
              <Logo onDark={false} />
            </div>
            <LoginForm />
            <Footer />
          </div>
        </section>

        {tweakMode && <TweaksPanel tweaks={tweaks} update={updateTweak} isWide={isWide} />}
      </div>
    );
  }

  // ──────────────── MOBILE (hero + card) ────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', position: 'relative' }}>
      {/* Top hero */}
      <section style={{
        position: 'relative',
        minHeight: '42vh',
        overflow: 'hidden',
        padding: '28px 24px 48px',
        display: 'flex', flexDirection: 'column',
        color: '#fff',
      }}>
        <Bg />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* top strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Logo size={38} onDark={true} compact={true} showWordmark={true} />
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 10px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.75)',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)',
                animation: 'psgPulseGold 2s ease-in-out infinite',
              }} />
              T. 2026
            </div>
          </div>

          {/* editorial headline */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'var(--gold)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 18, height: 2, background: 'var(--gold)' }} />
              Rama Pádel · SG
            </span>
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--font-headline)', fontWeight: 900,
              fontSize: 'clamp(40px, 11vw, 64px)',
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
              textTransform: 'uppercase',
              color: '#fff',
            }}>
              {(HEADLINES[tweaks.headline] || HEADLINES.enter).l1}<br/>
              <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>
                {(HEADLINES[tweaks.headline] || HEADLINES.enter).l2}
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* Form card (pulled up over the hero) */}
      <section style={{
        position: 'relative',
        marginTop: -28,
        background: 'var(--white)',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px 48px',
        boxShadow: '0 -8px 24px rgba(13,27,42,0.08)',
        minHeight: '58vh',
      }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {/* handle bar */}
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(13,27,42,0.10)',
            margin: '0 auto 24px',
          }} />
          <LoginForm compact={true} />
          <Footer />
        </div>
      </section>

      {tweakMode && <TweaksPanel tweaks={tweaks} update={updateTweak} isWide={isWide} />}
    </div>
  );
};

// ──────────────── Footer ────────────────
const Footer = () => (
  <footer style={{
    marginTop: 32, paddingTop: 20,
    borderTop: '1px solid rgba(13,27,42,0.06)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 12, flexWrap: 'wrap',
  }}>
    <span style={{
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: 'var(--muted)',
    }}>© 2026 Rama Pádel SG</span>
    <div style={{ display: 'flex', gap: 16 }}>
      <a href="#" className="psg-link subtle" style={{ fontSize: 11 }}>Privacidad</a>
      <a href="#" className="psg-link subtle" style={{ fontSize: 11 }}>Términos</a>
      <a href="#" className="psg-link subtle" style={{ fontSize: 11 }}>Ayuda</a>
    </div>
  </footer>
);

// ──────────────── Tweaks Panel ────────────────
const TweaksPanel = ({ tweaks, update, isWide }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 100,
    width: 300,
    maxHeight: '80vh',
    overflowY: 'auto',
    background: 'var(--white)',
    borderRadius: 12,
    boxShadow: '0 20px 48px rgba(13,27,42,0.18)',
    overflow: 'hidden',
    fontFamily: 'var(--font-body)',
  }}>
    <div style={{
      padding: '12px 14px',
      background: 'var(--navy)', color: '#fff',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <Icon name="settings" size={15} style={{ color: 'var(--gold)' }} />
      <span style={{
        fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 12,
        letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>Tweaks</span>
    </div>

    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <TweakGroup label="Variante visual">
        <TweakSeg
          options={[
            { v: 'illustration', l: 'Ilustración' },
            { v: 'photo',        l: 'Foto' },
            { v: 'editorial',    l: 'Editorial' },
            { v: 'dramatic',     l: 'Drama' },
          ]}
          value={tweaks.variant}
          onChange={(v) => update({ variant: v })}
        />
      </TweakGroup>

      <TweakGroup label="Copy · Headline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { v: 'enter',     l: 'Entra a la cancha. Tu próximo gran partido…' },
            { v: 'community', l: 'Nuestra rama. Nuestra cancha.' },
            { v: 'together',  l: 'La cancha nos junta.' },
            { v: 'pairs',     l: 'Entre parejas.' },
            { v: 'weare',     l: 'Somos Rama.' },
            { v: 'play',      l: 'Juguemos juntos.' },
            { v: 'parents',   l: 'De padres, para padres.' },
            { v: 'dominate',  l: 'Domina la pista. (original)' },
          ].map(o => (
            <button
              key={o.v}
              onClick={() => update({ headline: o.v })}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                background: tweaks.headline === o.v ? 'var(--navy)' : 'var(--surface)',
                color:      tweaks.headline === o.v ? 'var(--gold)' : 'var(--slate)',
                border: 'none', borderRadius: 6,
                fontFamily: 'var(--font-body)',
                fontWeight: tweaks.headline === o.v ? 700 : 500,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              {o.l}
            </button>
          ))}
        </div>
      </TweakGroup>

      <TweakGroup label="Layout">
        <TweakSeg
          options={[
            { v: 'auto',    l: 'Auto' },
            { v: 'mobile',  l: 'Mobile' },
            { v: 'desktop', l: 'Desktop' },
          ]}
          value={tweaks.layout}
          onChange={(v) => update({ layout: v })}
        />
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--muted)' }}>
          Pantalla actual: <strong style={{ color: 'var(--slate)' }}>
            {isWide ? 'Wide (≥960px)' : 'Narrow (<960px)'}
          </strong>
        </p>
      </TweakGroup>
    </div>
  </div>
);

const TweakGroup = ({ label, children }) => (
  <div>
    <p className="label" style={{ margin: '0 0 8px', color: 'var(--muted)' }}>{label}</p>
    {children}
  </div>
);

const TweakSeg = ({ options, value, onChange }) => (
  <div style={{
    display: 'flex', gap: 4, padding: 3,
    background: 'var(--surface)', borderRadius: 8,
  }}>
    {options.map(o => (
      <button
        key={o.v}
        onClick={() => onChange(o.v)}
        style={{
          flex: 1, height: 30,
          background: value === o.v ? 'var(--white)' : 'transparent',
          color: value === o.v ? 'var(--navy)' : 'var(--slate)',
          border: 'none', borderRadius: 6,
          fontFamily: 'var(--font-body)', fontWeight: value === o.v ? 700 : 500,
          fontSize: 11,
          cursor: 'pointer',
          boxShadow: value === o.v ? '0 2px 6px rgba(13,27,42,0.08)' : 'none',
          transition: 'all 120ms ease',
        }}
      >
        {o.l}
      </button>
    ))}
  </div>
);

window.PSGApp = App;
