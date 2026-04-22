// Inline SVG icons — Lucide-style 2px stroke, 24x24 viewBox.
// Avoids CDN dependency and gives us full control.

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Icon = ({ name, size = 20, style }) => {
  const commonSvg = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    style: { display: 'block', flexShrink: 0, ...style },
  };

  switch (name) {
    case 'mail':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </g></svg>
      );
    case 'lock':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </g></svg>
      );
    case 'eye':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </g></svg>
      );
    case 'eye-off':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </g></svg>
      );
    case 'arrow-right':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </g></svg>
      );
    case 'alert':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </g></svg>
      );
    case 'check':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M20 6 9 17l-5-5" />
        </g></svg>
      );
    case 'check-circle':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </g></svg>
      );
    case 'shield':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </g></svg>
      );
    case 'trophy':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </g></svg>
      );
    case 'user-plus':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </g></svg>
      );
    case 'settings':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
          <circle cx="12" cy="12" r="3" />
        </g></svg>
      );
    case 'x':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </g></svg>
      );
    case 'zap':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </g></svg>
      );
    case 'users':
      return (
        <svg {...commonSvg}><g {...strokeProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </g></svg>
      );
    case 'google':
      // Google "G" — flat brand colors (not monochrome)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0, ...style }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.997 10.997 0 0 0 12 23Z"/>
          <path fill="#FBBC05" d="M5.84 14.1A6.61 6.61 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A10.999 10.999 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84Z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.3 9.14 5.38 12 5.38Z"/>
        </svg>
      );
    default:
      return null;
  }
};

window.PSGIcon = Icon;
