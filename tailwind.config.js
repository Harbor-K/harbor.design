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
        // class name kept for compatibility; now maps to Geist (neo-grotesk)
        'inter-tight': ['"Geist"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
};
