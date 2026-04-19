/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50:  '#f5f7ff',
          100: '#e8edff',
          200: '#c8d2ff',
          300: '#a3b2ff',
          400: '#7d8eff',
          500: '#5d6bf0',
          600: '#4650d8',
          700: '#3840ad',
          800: '#2b3287',
          900: '#1f2566'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
}
