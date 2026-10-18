export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14181d', 2: '#1d232b', 3: '#2a323d', muted: '#8b96a5' },
        paper: '#f0f2f4',
        line: '#dde1e6',
        signal: { DEFAULT: '#2447f0', dark: '#1a35b8', soft: '#e8ecff' },
        amber: { soft: '#fff3d6', DEFAULT: '#b87400' },
        ok: { DEFAULT: '#12805c', soft: '#dff5ec' },
        bad: { DEFAULT: '#c23b3b', soft: '#fbe5e5' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
