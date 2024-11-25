module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    theme: {
      extend: {
        // ... other extensions
        keyframes: {
          'slide-in-right': {
            '0%': { transform: 'translateX(100%)', opacity: 0 },
            '100%': { transform: 'translateX(0)', opacity: 1 },
          },
          'fade-out': {
            '0%': { opacity: 1 },
            '100%': { opacity: 0 },
          },
        },
        animation: {
          'slide-in-right': 'slide-in-right 0.3s ease-out',
          'fade-out': 'fade-out 0.3s ease-out',
        },
      },
    },
  },
}