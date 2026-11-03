/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        harbor: {
          bg: '#FFFFFF',
          ink: '#0A0A0A',
          mute: '#8B8B8B',
          cobalt: '#3B5BD9',
          yellow: '#F5C518',
          red: '#E0492A',
          navy: '#1C2541',
        },
      },
      fontFamily: {
        // class names kept for compatibility; everything is Helvetica Neue (never Inter)
        'inter-tight': ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
};
