/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        salon: {
          pink: '#FFB6C1',
          rose: '#FF69B4',
          gold: '#FFD700',
          champagne: '#F7E7CE',
          cream: '#FFF8DC',
          white: '#FFFFFF',
          gray: '#6B7280',
          dark: '#374151',
        },
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"'],
        'serif': ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        'mono': ['Consolas', '"Liberation Mono"', 'Menlo', 'Courier', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 182, 193, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 182, 193, 0.6)' },
        },
      },
      boxShadow: {
        'salon': '0 20px 40px rgba(255, 182, 193, 0.2)',
        'salon-lg': '0 25px 50px rgba(255, 182, 193, 0.3)',
        'salon-xl': '0 30px 60px rgba(255, 182, 193, 0.4)',
      },
      backgroundImage: {
        'gradient-salon': 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
        'gradient-salon-reverse': 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #F7E7CE 100%)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
    },
  },
  plugins: [],
};
