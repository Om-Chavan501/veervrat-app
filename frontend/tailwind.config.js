/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Earthy, calm palette aligned with Veervrat's philosophy
        sage: {
          50: '#f4f7f0',
          100: '#e6eed9',
          200: '#cdddb4',
          300: '#adc785',
          400: '#8baf5a',
          500: '#6b8e4e',  // primary
          600: '#547240',
          700: '#425934',
          800: '#36482b',
          900: '#2d3c25',
        },
        terra: {
          50: '#fdf4ef',
          100: '#fae5d3',
          200: '#f5c9a7',
          300: '#eda572',
          400: '#e47d44',
          500: '#c47b5c',  // accent
          600: '#b05a3f',
          700: '#924535',
          800: '#773a2f',
          900: '#633229',
        },
        warm: {
          50: '#fdfaf6',
          100: '#f7ede4',  // background
          200: '#eeddc8',
          300: '#e0c5a0',
          400: '#cda878',
          500: '#bd8f58',
          600: '#a87848',
          700: '#8c623e',
          800: '#734f36',
          900: '#5f4130',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
