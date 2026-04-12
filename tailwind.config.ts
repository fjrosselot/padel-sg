import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0D1B2A',
        'navy-mid': '#1A2E45',
        gold: '#F5C518',
        'gold-dim': '#F0C110',
        surface: '#F0F4F8',
        'surface-high': '#E4E9ED',
        slate: '#4A6580',
        muted: '#8FA8C8',
        victory: '#006747',
        defeat: '#BA1A1A',
        'warning-bg': '#FFF9E6',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 12px rgba(13,27,42,0.06)',
        'card-hover': '0 12px 32px rgba(13,27,42,0.10)',
        modal: '0 20px 40px rgba(13,27,42,0.14)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [forms],
} satisfies Config
