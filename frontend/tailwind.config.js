/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────────────
      // Palette sémantique NORA / ENCG Marrakech
      // Extraite des assets réels (logo ENCG + splash screen)
      // ─────────────────────────────────────────────────────
      colors: {
        // Fond principal — crème chaleureuse (splash screen)
        'encg-cream-bg':          '#F5EFE0',
        'encg-cream-light':       '#FAF7F0',
        'encg-cream-dark':        '#EDE5D0',

        // Terracotta — couleur principale du robot et des accents
        'encg-terracotta':        '#C85A32',   // terracotta moyen (logo palmier)
        'encg-terracotta-light':  '#E07A52',   // terracotta clair (reflets robot)
        'encg-terracotta-dark':   '#9E3E1E',   // terracotta foncé (ombres robot)
        'encg-terracotta-xlight': '#F0A07A',   // terracotta très clair (highlights)

        // Brun foncé — texte secondaire, navigation
        'encg-text-brown':        '#3D271D',   // brun très foncé
        'encg-text-brown-light':  '#6B4035',   // brun moyen (sous-textes)

        // Neutres
        'encg-white':             '#FFFFFF',
        'encg-off-white':         '#FDF9F5',
        'encg-border':            '#E8DDD0',
        'encg-shadow':            'rgba(61, 39, 29, 0.12)',

        // Accent lumineux (pastille antenne, indicateurs)
        'encg-glow':              '#FFB347',
        'encg-glow-light':        '#FFD080',
      },

      // ─────────────────────────────────────────────────────
      // Typographie NORA
      // ─────────────────────────────────────────────────────
      fontFamily: {
        serif:     ['"Playfair Display"', 'Georgia', 'serif'],
        sans:      ['"Inter"', 'system-ui', 'sans-serif'],
        display:   ['"Playfair Display"', 'serif'],
      },

      // ─────────────────────────────────────────────────────
      // Borne tactile — format portrait 1080×1920
      // ─────────────────────────────────────────────────────
      screens: {
        'kiosk': '1080px',
      },

      // ─────────────────────────────────────────────────────
      // Animations custom
      // ─────────────────────────────────────────────────────
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.15)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        'breathe': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%':      { transform: 'scaleY(0.97)' },
        },
        'blink': {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%':            { transform: 'scaleY(0.05)' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'tap-hint': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        'float':       'float 3s ease-in-out infinite',
        'pulse-glow':  'pulse-glow 2s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
        'breathe':     'breathe 4s ease-in-out infinite',
        'blink':       'blink 4s ease-in-out infinite',
        'fade-in-up':  'fade-in-up 0.7s ease-out both',
        'tap-hint':    'tap-hint 2s ease-in-out infinite',
      },

      // ─────────────────────────────────────────────────────
      // Ombres custom
      // ─────────────────────────────────────────────────────
      boxShadow: {
        'robot':         '0 32px 64px rgba(200, 90, 50, 0.20), 0 8px 24px rgba(61, 39, 29, 0.12)',
        'robot-contact': '0 4px 20px rgba(200, 90, 50, 0.30)',
        'card':          '0 4px 24px rgba(61, 39, 29, 0.08)',
        'card-hover':    '0 12px 40px rgba(200, 90, 50, 0.20)',
        'glow':          '0 0 24px rgba(255, 179, 71, 0.60)',
      },

      // ─────────────────────────────────────────────────────
      // Bordures & Rayons
      // ─────────────────────────────────────────────────────
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.75rem',
        'xl4': '2.5rem',
      },

      // ─────────────────────────────────────────────────────
      // Backdrop blur
      // ─────────────────────────────────────────────────────
      backdropBlur: {
        'xs': '4px',
      },
    },
  },
  plugins: [],
}
