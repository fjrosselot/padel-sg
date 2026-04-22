// Login form — the right-side pane on desktop, full-bleed on mobile.
// Handles email/password state, remember-me, show/hide password,
// loading, error and success states.

const Icon = window.PSGIcon;
const Logo = window.PSGLogo;

const LoginForm = ({ compact = false, onDark = false }) => {
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [showPw, setShowPw]     = React.useState(false);
  const [status, setStatus]     = React.useState('idle'); // idle | loading | error | success
  const [errorMsg, setErrorMsg] = React.useState('');
  const [shake, setShake]       = React.useState(false);

  const ink    = onDark ? '#fff' : 'var(--navy)';
  const subInk = onDark ? 'rgba(255,255,255,0.65)' : 'var(--slate)';
  const field  = onDark ? 'rgba(255,255,255,0.05)' : 'var(--white)';
  const fieldBorder = onDark ? 'rgba(255,255,255,0.10)' : 'transparent';

  const submit = (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    setErrorMsg('');

    if (!email.includes('@')) {
      setErrorMsg('Ingresa un email válido.');
      setStatus('error'); setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Email o contraseña incorrectos.');
      setStatus('error'); setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      // Demo: any password containing "123" succeeds; otherwise error.
      if (password.toLowerCase().includes('123') || email === 'demo@sg.cl') {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg('Email o contraseña incorrectos.');
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    }, 1100);
  };

  const googleLogin = () => {
    setStatus('loading');
    setTimeout(() => setStatus('success'), 900);
  };

  // ─── success screen overlay ───
  if (status === 'success') {
    return (
      <div className="fade-up" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 20, minHeight: 420, textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 36px rgba(245,197,24,0.42)',
        }}>
          <Icon name="check" size={34} style={{ color: 'var(--navy)', strokeWidth: 3 }} />
        </div>
        <div>
          <p className="kicker" style={{ margin: 0, color: 'var(--gold)' }}>Sesión iniciada</p>
          <h2 style={{ margin: '6px 0 4px', fontSize: 26, color: ink, letterSpacing: '-0.02em' }}>
            ¡Bienvenido de vuelta!
          </h2>
          <p style={{ margin: 0, color: subInk, fontSize: 14 }}>
            Llevándote al dashboard…
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)',
              opacity: 0.3,
              animation: `psgFadeUp 800ms ease-in-out ${i*0.15}s infinite alternate`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={shake ? 'shake' : ''} style={{
      display: 'flex', flexDirection: 'column', gap: compact ? 20 : 24, width: '100%',
    }}>
      {/* Heading */}
      <div>
        <p className="kicker" style={{ margin: 0, color: 'var(--gold)' }}>
          Saint George's · Rama Pádel
        </p>
        <h2 style={{
          margin: '8px 0 6px',
          fontFamily: 'var(--font-headline)',
          fontWeight: 800,
          fontSize: compact ? 26 : 30,
          letterSpacing: '-0.02em',
          color: ink,
        }}>
          Bienvenidos
        </h2>
        <p style={{ margin: 0, color: subInk, fontSize: 14 }}>
          Ingresa tus credenciales para continuar.
        </p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="fade-up" style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 14px',
          background: onDark ? 'rgba(186,26,26,0.15)' : 'rgba(186,26,26,0.08)',
          borderRadius: 8,
          border: `1px solid ${onDark ? 'rgba(186,26,26,0.35)' : 'rgba(186,26,26,0.18)'}`,
        }}>
          <Icon name="alert" size={18} style={{ color: 'var(--defeat)', marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: onDark ? '#fff' : 'var(--defeat)' }}>
              {errorMsg}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: subInk }}>
              Revisa tus credenciales o solicita acceso si eres nuevo.
            </p>
          </div>
        </div>
      )}

      {/* Email field */}
      <Field
        id="email"
        label="Email"
        icon="mail"
        type="email"
        placeholder="tu@correo.cl"
        value={email}
        onChange={setEmail}
        onDark={onDark}
        error={status === 'error' && !email.includes('@')}
      />

      {/* Password field */}
      <Field
        id="password"
        label="Contraseña"
        icon="lock"
        type={showPw ? 'text' : 'password'}
        placeholder="••••••••"
        value={password}
        onChange={setPassword}
        onDark={onDark}
        error={status === 'error' && email.includes('@')}
        rightAction={{
          icon: showPw ? 'eye-off' : 'eye',
          onClick: () => setShowPw(s => !s),
          label: showPw ? 'Ocultar contraseña' : 'Mostrar contraseña',
        }}
        trailingLink={{ label: '¿Olvidaste la tuya?', onClick: () => alert('Demo: flujo de recuperación') }}
      />

      {/* Remember + submit */}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', marginTop: -4 }}>
        <input
          type="checkbox"
          className="psg-check"
          checked={remember}
          onChange={e => setRemember(e.target.checked)}
        />
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13, fontWeight: 500,
          color: subInk,
        }}>
          Recordar sesión en este dispositivo
        </span>
      </label>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="cta-primary"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          height: 50,
          background: 'var(--gold)',
          color: 'var(--navy)',
          border: 'none',
          borderRadius: 8,
          fontFamily: 'var(--font-body)',
          fontWeight: 700, fontSize: 14,
          letterSpacing: '0.04em',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          boxShadow: '0 6px 18px rgba(245,197,24,0.32)',
          opacity: status === 'loading' ? 0.9 : 1,
        }}
      >
        {status === 'loading' ? (
          <>
            <Spinner />
            Entrando…
          </>
        ) : (
          <>
            Iniciar sesión
            <Icon name="arrow-right" size={18} />
          </>
        )}
      </button>

      {/* divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
        <div style={{ flex: 1, height: 1, background: onDark ? 'rgba(255,255,255,0.08)' : 'rgba(13,27,42,0.08)' }} />
        <span style={{
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: onDark ? 'rgba(255,255,255,0.45)' : 'var(--muted)',
        }}>o</span>
        <div style={{ flex: 1, height: 1, background: onDark ? 'rgba(255,255,255,0.08)' : 'rgba(13,27,42,0.08)' }} />
      </div>

      {/* Google button */}
      <button
        type="button"
        onClick={googleLogin}
        className="google-btn"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          height: 46,
          padding: '0 16px',
          background: onDark ? 'rgba(255,255,255,0.04)' : 'var(--white)',
          color: ink,
          border: `1px solid ${onDark ? 'rgba(255,255,255,0.14)' : 'rgba(13,27,42,0.10)'}`,
          borderRadius: 8,
          fontFamily: 'var(--font-body)',
          fontWeight: 600, fontSize: 14,
          cursor: 'pointer',
          boxShadow: onDark ? 'none' : 'var(--shadow-card)',
        }}
      >
        <Icon name="google" size={18} />
        Continuar con Google
      </button>

      {/* Register prompt */}
      <p style={{
        margin: 0, textAlign: 'center', fontSize: 13,
        color: subInk,
      }}>
        ¿No tienes cuenta?{' '}
        <a className="psg-link" onClick={(e) => { e.preventDefault(); alert('Demo: solicitar acceso'); }} style={{ color: onDark ? '#fff' : 'var(--navy)' }}>
          Solicitar acceso
        </a>
      </p>

      {/* Approval hint */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        background: onDark ? 'rgba(245,197,24,0.08)' : 'var(--warning-bg)',
        borderRadius: 8,
      }}>
        <Icon name="shield" size={16} style={{ color: onDark ? 'var(--gold)' : '#856404', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: onDark ? 'rgba(255,255,255,0.78)' : '#856404' }}>
          Comunidad cerrada — el acceso de nuevos socios requiere aprobación del admin.
        </p>
      </div>
    </form>
  );
};

// ─── Field ─────────────────────────────────────────────────────
const Field = ({ id, label, icon, type, placeholder, value, onChange, rightAction, trailingLink, onDark, error }) => {
  const lblColor = onDark ? 'rgba(255,255,255,0.7)' : 'var(--slate)';
  const field  = onDark ? 'rgba(255,255,255,0.04)' : 'var(--white)';
  const border = onDark ? '1px solid rgba(255,255,255,0.10)' : 'none';
  const text   = onDark ? '#fff' : 'var(--navy)';
  const ph     = onDark ? 'rgba(255,255,255,0.35)' : 'var(--muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <label htmlFor={id} className="label" style={{ color: lblColor, margin: 0 }}>
          {label}
        </label>
        {trailingLink && (
          <a
            className="psg-link subtle"
            onClick={(e) => { e.preventDefault(); trailingLink.onClick(); }}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
              color: onDark ? 'rgba(255,255,255,0.6)' : 'var(--slate)',
              textTransform: 'none', letterSpacing: 0,
            }}
          >
            {trailingLink.label}
          </a>
        )}
      </div>
      <div className={`psg-input-shell${error ? ' error' : ''}`} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 48, padding: '0 14px',
        background: field,
        border,
        borderRadius: 8,
        boxShadow: onDark ? 'none' : 'var(--shadow-card)',
      }}>
        <Icon name={icon} size={18} style={{ color: onDark ? 'rgba(255,255,255,0.5)' : 'var(--muted)' }} />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={id === 'password' ? 'current-password' : 'email'}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-body)', fontSize: 14,
            color: text,
          }}
        />
        {rightAction && (
          <button type="button" onClick={rightAction.onClick} aria-label={rightAction.label} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: onDark ? 'rgba(255,255,255,0.55)' : 'var(--muted)',
            padding: 4, display: 'inline-flex', borderRadius: 4,
          }}>
            <Icon name={rightAction.icon} size={18} />
          </button>
        )}
      </div>

      <style>{`
        #${id}::placeholder { color: ${ph}; }
      `}</style>
    </div>
  );
};

const Spinner = () => (
  <span style={{
    width: 16, height: 16,
    borderRadius: '50%',
    border: '2px solid rgba(13,27,42,0.25)',
    borderTopColor: 'var(--navy)',
    animation: 'psgSpin 800ms linear infinite',
    display: 'inline-block',
  }} />
);

window.PSGLoginForm = LoginForm;
