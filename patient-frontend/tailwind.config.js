/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#031525',
        panel: '#071d31',
        neon: '#52ff9d',
        neonSoft: 'rgba(82, 255, 157, 0.12)',
        sky: '#83d4ff',
        mist: '#94a9be',
        line: 'rgba(108, 156, 204, 0.08)',
        wire: '#5f89ae'
      },
      boxShadow: {
        glass: '0 24px 80px rgba(0, 0, 0, 0.35)'
      }
    }
  },
  plugins: []
};
